import {
  LetterFlowAction,
  LetterStatus,
  Prisma,
  SigningKeyRequestKind,
  SigningKeyRequestStatus,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/password';
import { Errors } from '@/middleware/error';
import { eventBus } from '@/lib/event-bus';
import {
  createKeyMaterial,
  lockoutUntil,
  newVerificationToken,
  rewrapKeyMaterial,
  signPayload,
  verifySignature,
  computePdfHash,
  verifyPdfHashSignature,
  type EncryptedKeyMaterial,
  type ScryptParams,
  type SignablePayload,
  EsignError,
  MAX_PASSPHRASE_ATTEMPTS,
} from '@/utils/esign';
import {
  DEFAULT_VALIDITY_DAYS,
  SigningKeyState,
  assertCanSign,
  assertValidityDays,
  canRequestRenewal,
  daysUntilExpiry,
  effectiveState,
  expiryFrom,
  needsNewIssuance,
  renewedExpiry,
} from '@/utils/esign-lifecycle';

/** Baris kunci → bahan kriptografi yang dimengerti utils/esign. */
function toMaterial(key: {
  algorithm: string;
  publicKey: string;
  encryptedPrivateKey: string;
  kdfSalt: string;
  kdfParams: Prisma.JsonValue;
  iv: string;
  authTag: string;
}): EncryptedKeyMaterial {
  return {
    algorithm: key.algorithm,
    publicKey: key.publicKey,
    encryptedPrivateKey: key.encryptedPrivateKey,
    kdfSalt: key.kdfSalt,
    kdfParams: key.kdfParams as unknown as ScryptParams,
    iv: key.iv,
    authTag: key.authTag,
  };
}

/**
 * Catat percobaan passphrase yang gagal, dan kunci bila sudah terlalu sering.
 *
 * Dilakukan di luar transaksi penandatanganan supaya hitungannya tetap
 * bertambah walaupun operasi utamanya dibatalkan — kalau tidak, menebak
 * passphrase menjadi gratis.
 */
async function recordFailedAttempt(keyId: string, current: number) {
  const failed = current + 1;
  await prisma.userSigningKey.update({
    where: { id: keyId },
    data: { failedAttempts: failed, lockedUntil: lockoutUntil(failed) },
  });
}

async function clearFailedAttempts(keyId: string) {
  await prisma.userSigningKey.update({
    where: { id: keyId },
    data: { failedAttempts: 0, lockedUntil: null, lastUsedAt: new Date() },
  });
}

export const EsignService = {
  /** Ringkasan kunci milik pengguna, untuk halaman pengaturan. */
  async myStatus(userId: string) {
    const key = await prisma.userSigningKey.findUnique({
      where: { userId },
      select: {
        id: true,
        algorithm: true,
        approvedAt: true,
        expiresAt: true,
        revokedAt: true,
        revokedReason: true,
        lockedUntil: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    const pendingRequest = await prisma.signingKeyRequest.findFirst({
      where: { userId, status: SigningKeyRequestStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });

    // Kunci yang sudah disetujui tetapi belum pernah dibuka passphrase-nya
    // masih menunggu pengguna menetapkan passphrase.
    const state = key ? effectiveState(key) : null;

    return {
      hasKey: !!key,
      state,
      expiresAt: key?.expiresAt ?? null,
      daysUntilExpiry: key ? daysUntilExpiry(key) : null,
      revokedReason: key?.revokedReason ?? null,
      lockedUntil: key?.lockedUntil ?? null,
      lastUsedAt: key?.lastUsedAt ?? null,
      canRequestRenewal: canRequestRenewal(key ?? null),
      needsNewIssuance: needsNewIssuance(key ?? null),
      pendingRequest: pendingRequest
        ? { id: pendingRequest.id, kind: pendingRequest.kind, createdAt: pendingRequest.createdAt }
        : null,
    };
  },

  /**
   * Ajukan penerbitan atau perpanjangan.
   *
   * Jenis pengajuan ditentukan server dari keadaan kunci, bukan dari yang
   * dikirim klien: kalau klien boleh memilih, kunci yang sudah kedaluwarsa
   * bisa "diperpanjang" dan lolos dari pemeriksaan ulang yang justru menjadi
   * alasan adanya masa berlaku.
   */
  async requestKey(userId: string, reason?: string) {
    const existing = await prisma.signingKeyRequest.findFirst({
      where: { userId, status: SigningKeyRequestStatus.PENDING },
    });
    if (existing) {
      throw Errors.badRequest('Pengajuan Anda sebelumnya masih menunggu keputusan.');
    }

    const key = await prisma.userSigningKey.findUnique({ where: { userId } });

    let kind: SigningKeyRequestKind;
    if (needsNewIssuance(key)) {
      kind = SigningKeyRequestKind.ENROLLMENT;
    } else if (canRequestRenewal(key)) {
      kind = SigningKeyRequestKind.RENEWAL;
    } else {
      throw Errors.badRequest(
        'Kunci tanda tangan Anda masih berlaku dan belum memasuki masa perpanjangan.'
      );
    }

    const request = await prisma.signingKeyRequest.create({
      data: { userId, kind, reason, status: SigningKeyRequestStatus.PENDING },
    });

    eventBus.emit('notification:send', {
      userId,
      type: 'INFO',
      title: 'Pengajuan Tanda Tangan Elektronik Terkirim',
      message:
        kind === SigningKeyRequestKind.RENEWAL
          ? 'Pengajuan perpanjangan kunci tanda tangan Anda menunggu persetujuan Super Admin.'
          : 'Pengajuan penerbitan kunci tanda tangan Anda menunggu persetujuan Super Admin.',
      data: { requestId: request.id },
    });

    return request;
  },

  /** Antrean pengajuan untuk Super Admin. */
  async listRequests(status?: SigningKeyRequestStatus) {
    return prisma.signingKeyRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        user: { select: { id: true, name: true, email: true } },
        decidedBy: { select: { name: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });
  },

  /**
   * Putusan Super Admin.
   *
   * Menyetujui perpanjangan langsung memperpanjang masa berlaku kunci yang ada
   * — kuncinya tidak diganti, sehingga surat-surat lama tetap terverifikasi.
   * Menyetujui penerbitan hanya membuka pintu: kuncinya baru benar-benar dibuat
   * ketika pemiliknya menetapkan passphrase, karena hanya dia yang boleh tahu.
   */
  async decideRequest(
    requestId: string,
    deciderId: string,
    approve: boolean,
    grantedDays?: number,
    note?: string
  ) {
    const request = await prisma.signingKeyRequest.findUnique({ where: { id: requestId } });
    if (!request) throw Errors.notFound('Pengajuan tidak ditemukan');
    if (request.status !== SigningKeyRequestStatus.PENDING) {
      throw Errors.badRequest('Pengajuan ini sudah diputuskan.');
    }

    if (!approve) {
      const rejected = await prisma.signingKeyRequest.update({
        where: { id: requestId },
        data: {
          status: SigningKeyRequestStatus.REJECTED,
          decidedById: deciderId,
          decidedAt: new Date(),
          decisionNote: note,
        },
      });
      eventBus.emit('notification:send', {
        userId: request.userId,
        type: 'WARNING',
        title: 'Pengajuan Tanda Tangan Ditolak',
        message: note ? `Pengajuan ditolak: ${note}` : 'Pengajuan tanda tangan Anda ditolak.',
        data: { requestId },
      });
      return rejected;
    }

    const days = grantedDays ?? DEFAULT_VALIDITY_DAYS;
    assertValidityDays(days);

    return prisma.$transaction(async (tx) => {
      const approved = await tx.signingKeyRequest.update({
        where: { id: requestId },
        data: {
          status: SigningKeyRequestStatus.APPROVED,
          decidedById: deciderId,
          decidedAt: new Date(),
          decisionNote: note,
          grantedDays: days,
        },
      });

      if (request.kind === SigningKeyRequestKind.RENEWAL) {
        const key = await tx.userSigningKey.findUnique({ where: { userId: request.userId } });
        if (key) {
          await tx.userSigningKey.update({
            where: { id: key.id },
            data: { expiresAt: renewedExpiry(key, days), approvedById: deciderId },
          });
        }
      } else {
        // Penerbitan: hapus sisa kunci lama (kedaluwarsa/dicabut) supaya
        // pemiliknya bisa menetapkan passphrase baru. Tanda tangan lama tidak
        // terpengaruh — masing-masing menyimpan salinan kunci publiknya.
        await tx.userSigningKey.deleteMany({ where: { userId: request.userId } });
      }

      return approved;
    });
  },

  /**
   * Tetapkan passphrase dan terbitkan kunci, setelah pengajuan disetujui.
   *
   * Kunci baru dibuat di sini — bukan saat disetujui — karena passphrase-nya
   * hanya boleh diketahui pemiliknya.
   */
  async activateKey(userId: string, passphrase: string) {
    const approved = await prisma.signingKeyRequest.findFirst({
      where: {
        userId,
        status: SigningKeyRequestStatus.APPROVED,
        kind: SigningKeyRequestKind.ENROLLMENT,
      },
      orderBy: { decidedAt: 'desc' },
    });
    if (!approved) {
      throw Errors.badRequest(
        'Belum ada persetujuan penerbitan kunci tanda tangan untuk Anda.'
      );
    }

    const existing = await prisma.userSigningKey.findUnique({ where: { userId } });
    if (existing && !needsNewIssuance(existing)) {
      throw Errors.badRequest('Anda sudah memiliki kunci tanda tangan yang aktif.');
    }

    const material = createKeyMaterial(passphrase);
    const days = approved.grantedDays ?? DEFAULT_VALIDITY_DAYS;
    const now = new Date();

    await prisma.userSigningKey.deleteMany({ where: { userId } });
    const key = await prisma.userSigningKey.create({
      data: {
        userId,
        algorithm: material.algorithm,
        publicKey: material.publicKey,
        encryptedPrivateKey: material.encryptedPrivateKey,
        kdfSalt: material.kdfSalt,
        kdfParams: material.kdfParams as unknown as Prisma.InputJsonValue,
        iv: material.iv,
        authTag: material.authTag,
        approvedById: approved.decidedById,
        approvedAt: approved.decidedAt ?? now,
        expiresAt: expiryFrom(now, days),
      },
    });

    return { id: key.id, expiresAt: key.expiresAt, state: effectiveState(key) };
  },

  /**
   * Ganti passphrase.
   *
   * Menuntut dua bukti sekaligus: passphrase lama (bahwa Anda pemilik kunci)
   * dan password akun (bahwa ini benar-benar Anda, bukan sesi yang tertinggal
   * terbuka di komputer bersama). Salah satu saja tidak cukup — keduanya
   * menjawab pertanyaan yang berbeda.
   *
   * Kuncinya tidak diganti, hanya disegel ulang, sehingga surat-surat lama
   * tetap terverifikasi.
   */
  async changePassphrase(
    userId: string,
    currentPassphrase: string,
    accountPassword: string,
    newPassphrase: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash || !(await comparePassword(accountPassword, user.passwordHash))) {
      throw Errors.unauthorized('Password akun salah.');
    }

    const key = await prisma.userSigningKey.findUnique({ where: { userId } });
    if (!key) throw Errors.badRequest('Anda belum memiliki kunci tanda tangan.');
    assertCanSign(key);

    let rewrapped;
    try {
      rewrapped = rewrapKeyMaterial(toMaterial(key), currentPassphrase, newPassphrase);
    } catch (error) {
      if (error instanceof EsignError) {
        await recordFailedAttempt(key.id, key.failedAttempts);
      }
      throw error;
    }

    await prisma.userSigningKey.update({
      where: { id: key.id },
      data: {
        encryptedPrivateKey: rewrapped.encryptedPrivateKey,
        kdfSalt: rewrapped.kdfSalt,
        kdfParams: rewrapped.kdfParams as unknown as Prisma.InputJsonValue,
        iv: rewrapped.iv,
        authTag: rewrapped.authTag,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    return { success: true };
  },

  /** Cabut kunci (Super Admin). Tanda tangan lama tetap dapat diverifikasi. */
  async revokeKey(userId: string, reason: string) {
    const key = await prisma.userSigningKey.findUnique({ where: { userId } });
    if (!key) throw Errors.notFound('Kunci tanda tangan tidak ditemukan');

    await prisma.userSigningKey.update({
      where: { id: key.id },
      data: { revokedAt: new Date(), revokedReason: reason },
    });

    eventBus.emit('notification:send', {
      userId,
      type: 'WARNING',
      title: 'Kunci Tanda Tangan Dicabut',
      message: `Kunci tanda tangan elektronik Anda dicabut: ${reason}`,
      data: {},
    });

    return { success: true };
  },

  /**
   * Bubuhkan tanda tangan pada surat.
   *
   * Hanya penandatangan yang ditunjuk, hanya ketika surat sudah sampai
   * gilirannya, dan hanya dengan passphrase yang benar.
   */
  async signLetter(letterId: string, userId: string, passphrase: string) {
    const letter = await prisma.letter.findUnique({
      where: { id: letterId },
      include: { reviewers: true },
    });
    if (!letter) throw Errors.notFound('Surat tidak ditemukan');

    const mine = letter.reviewers.find((r) => r.reviewerId === userId);
    if (!mine?.isSigner) {
      throw Errors.forbidden('Anda bukan penandatangan surat ini.');
    }
    if (letter.status !== LetterStatus.READY_TO_SIGN) {
      throw Errors.badRequest(
        `Surat belum siap ditandatangani (status: ${letter.status}).`
      );
    }

    const key = await prisma.userSigningKey.findUnique({ where: { userId } });
    assertCanSign(key);

    const signedAt = new Date();
    const payload: SignablePayload = {
      letterId: letter.id,
      letterNumber: letter.letterNumber,
      date: letter.date,
      type: letter.type,
      nature: letter.nature,
      subject: letter.subject,
      content: letter.content,
      unitId: letter.unitId,
      signerId: userId,
      signedAt,
    };

    let signed;
    try {
      signed = signPayload(toMaterial(key!), passphrase, payload);
    } catch (error) {
      if (error instanceof EsignError) {
        await recordFailedAttempt(key!.id, key!.failedAttempts);
        const left = MAX_PASSPHRASE_ATTEMPTS - (key!.failedAttempts + 1);
        throw Errors.unauthorized(
          left > 0
            ? `Passphrase tanda tangan salah. Sisa percobaan: ${left}.`
            : 'Passphrase salah. Kunci tanda tangan dikunci sementara.'
        );
      }
      throw error;
    }

    const result = await prisma.$transaction(async (tx) => {
      const signature = await tx.letterSignature.create({
        data: {
          letterId: letter.id,
          signerId: userId,
          algorithm: signed.algorithm,
          publicKey: signed.publicKey,
          digest: signed.digest,
          signature: signed.signature,
          verificationToken: newVerificationToken(),
          signedAt,
        },
      });

      await tx.letterReviewer.update({
        where: { id: mine.id },
        data: { status: 'APPROVED', reviewedAt: signedAt },
      });
      await tx.letter.update({
        where: { id: letter.id },
        data: { status: LetterStatus.SIGNED },
      });
      await tx.letterFlowEvent.create({
        data: {
          letterId: letter.id,
          actorId: userId,
          action: LetterFlowAction.SIGNED,
          fromStatus: letter.status,
          toStatus: LetterStatus.SIGNED,
          note: 'Ditandatangani secara elektronik.',
        },
      });

      return signature;
    });

    await clearFailedAttempts(key!.id);

    return {
      id: result.id,
      verificationToken: result.verificationToken,
      signedAt: result.signedAt,
    };
  },

  /**
   * Verifikasi publik lewat token QR.
   *
   * **Tidak pernah mengembalikan isi surat.** QR menempel pada lembar yang bisa
   * saja bertanda "Sangat Rahasia"; halaman yang menampilkan isinya kepada
   * siapa pun yang memindai justru membocorkan surat yang derajat
   * kerahasiaannya ada untuk mencegah hal itu. Yang dijawab hanyalah pertanyaan
   * yang memang ditanyakan pemindai: benar surat ini terbit dari Yayasan,
   * ditandatangani siapa, kapan, dan masih utuh atau tidak.
   *
   * Perihal pun hanya ditampilkan untuk surat bersifat Biasa.
   */
  /** Verifikasi PDF berbasis SHA-256 byte digest upload dokumen. */
  async verifyPdf(fileBuffer: Buffer) {
    const pdfHash = computePdfHash(fileBuffer);

    const signatures = await prisma.letterSignature.findMany({
      include: {
        signer: { select: { name: true } },
        letter: {
          select: {
            id: true,
            letterNumber: true,
            date: true,
            type: true,
            nature: true,
            subject: true,
            content: true,
            unitId: true,
            unit: { select: { name: true } },
          },
        },
      },
    });

    const matched = signatures.find((sig) => {
      if (sig.pdfHash && sig.pdfHash === pdfHash) {
        if (sig.pdfSignature) {
          return verifyPdfHashSignature(sig.publicKey, sig.pdfSignature, pdfHash);
        }
        return true;
      }
      return false;
    });

    if (!matched) {
      return { found: false as const, valid: false };
    }

    const l = matched.letter;
    const isPublicNature = l.nature === 'PUBLIC';

    return {
      found: true as const,
      valid: !matched.revokedAt,
      pdfHashMatch: true,
      revoked: !!matched.revokedAt,
      revokedReason: matched.revokedReason,
      letterNumber: l.letterNumber,
      letterType: l.type,
      nature: l.nature,
      subject: isPublicNature ? l.subject : null,
      date: l.date,
      unitName: l.unit?.name ?? null,
      signerName: matched.signer.name,
      signedAt: matched.signedAt,
    };
  },

  async verifyByToken(token: string) {
    const signature = await prisma.letterSignature.findUnique({
      where: { verificationToken: token },
      include: {
        signer: { select: { name: true } },
        letter: {
          select: {
            id: true,
            letterNumber: true,
            date: true,
            type: true,
            nature: true,
            subject: true,
            content: true,
            unitId: true,
            unit: { select: { name: true } },
          },
        },
      },
    });

    if (!signature) {
      return { found: false as const };
    }

    const l = signature.letter;
    const intact = verifySignature(signature.publicKey, signature.signature, {
      letterId: l.id,
      letterNumber: l.letterNumber,
      date: l.date,
      type: l.type,
      nature: l.nature,
      subject: l.subject,
      content: l.content,
      unitId: l.unitId,
      signerId: signature.signerId,
      signedAt: signature.signedAt,
    });

    const isPublicNature = l.nature === 'PUBLIC';

    return {
      found: true as const,
      valid: intact && !signature.revokedAt,
      intact,
      revoked: !!signature.revokedAt,
      revokedReason: signature.revokedReason,
      letterNumber: l.letterNumber,
      letterType: l.type,
      nature: l.nature,
      // Hanya untuk surat biasa; selebihnya cukup dibuktikan keasliannya.
      subject: isPublicNature ? l.subject : null,
      date: l.date,
      unitName: l.unit?.name ?? null,
      signerName: signature.signer.name,
      signedAt: signature.signedAt,
    };
  },
};

export type { SigningKeyState };
