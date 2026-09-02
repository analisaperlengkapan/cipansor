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
import crypto from 'crypto';
import {
  createKeyMaterial,
  lockoutUntil,
  newVerificationToken,
  rewrapKeyMaterial,
  signPayload,
  signPdfHash,
  verifyPdfHashSignature,
  verifySignature,
  type EncryptedKeyMaterial,
  type ScryptParams,
  type SignablePayload,
  EsignError,
  MAX_PASSPHRASE_ATTEMPTS,
} from '@/utils/esign';
import { generateLetterPdfBuffer, LetterPdfError } from '@/utils/generate-letter-pdf';
import { verifyLetterByToken } from '@/utils/letter-verification';
import {
  RevocationError,
  assertKeyRevocable,
  assertSignatureRevocable,
  normalizeReason,
  type RevocationActor,
} from '@/utils/esign-revocation';
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

/**
 * Terjemahkan penolakan aturan pencabutan menjadi galat HTTP yang semestinya.
 *
 * Tanpa ini `RevocationError` jatuh ke penangan umum sebagai 500, dan operator
 * yang alasannya kurang sepuluh karakter membaca "Internal server error"
 * alih-alih kalimat yang memberitahunya apa yang harus diperbaiki.
 */
function asHttpError(error: unknown): unknown {
  if (!(error instanceof RevocationError)) return error;
  return error.forbidden ? Errors.forbidden(error.message) : Errors.badRequest(error.message);
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

  /**
   * Daftar kunci yang pernah diterbitkan — kewenangan Super Admin.
   *
   * Ada karena pencabutan menuntutnya. Rutenya sudah lama tersedia, tetapi
   * tanpa daftar ini tidak ada satu pun tempat di dalam aplikasi yang
   * menyebutkan siapa saja pemegang kunci — sehingga passphrase yang bocor atau
   * pejabat yang berhenti hanya dapat dicabut lewat basis data langsung.
   *
   * Statusnya dihitung di sini, bukan dibaca dari kolom, sama seperti di
   * halaman pengaturan pemiliknya (utils/esign-lifecycle.ts).
   */
  async listKeys() {
    const keys = await prisma.userSigningKey.findMany({
      select: {
        id: true,
        userId: true,
        algorithm: true,
        approvedAt: true,
        expiresAt: true,
        lastUsedAt: true,
        lockedUntil: true,
        revokedAt: true,
        revokedReason: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
            unit: { select: { name: true } },
            staff: { select: { position: true } },
            // Peran utama saja, sekadar untuk dikenali di daftar. Kewenangan
            // tidak pernah dibaca dari sini — itu urusan middleware.
            userRoles: {
              where: { isActive: true },
              select: { role: { select: { code: true } } },
              orderBy: { isPrimary: 'desc' },
              take: 1,
            },
          },
        },
        approvedBy: { select: { name: true } },
        revokedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const now = new Date();
    return keys.map((k) => ({
      id: k.id,
      userId: k.userId,
      name: k.user.name,
      email: k.user.email,
      roleCode: k.user.userRoles[0]?.role.code ?? null,
      position: k.user.staff?.position ?? null,
      unitName: k.user.unit?.name ?? null,
      algorithm: k.algorithm,
      state: effectiveState(k, now),
      approvedAt: k.approvedAt,
      approvedByName: k.approvedBy?.name ?? null,
      expiresAt: k.expiresAt,
      daysUntilExpiry: daysUntilExpiry(k, now),
      lastUsedAt: k.lastUsedAt,
      lockedUntil: k.lockedUntil,
      revokedAt: k.revokedAt,
      revokedReason: k.revokedReason,
      revokedByName: k.revokedBy?.name ?? null,
      createdAt: k.createdAt,
    }));
  },

  /**
   * Cabut kunci (Super Admin).
   *
   * **Mencabut kunci tidak mencabut surat.** Setiap tanda tangan menyimpan
   * salinan kunci publiknya sendiri, jadi surat yang telanjur sah tetap
   * terverifikasi — dan memang begitu yang dikehendaki untuk pergantian pejabat
   * atau kunci yang kedaluwarsa.
   *
   * Untuk passphrase yang bocor, itu justru bukan yang diinginkan: siapa pun
   * yang memegang passphrase itu bisa saja telah menandatangani surat sebelum
   * kebocorannya diketahui. Karena itu pemanggil mendapat kembali daftar surat
   * yang ditandatangani dengan kunci ini beserta jumlahnya — supaya yang
   * mencabut melihat sendiri seberapa luas akibatnya dan dapat memutuskan mana
   * yang perlu dicabut satu per satu, bukan menyangka pekerjaannya sudah
   * selesai.
   */
  async revokeKey(userId: string, actorId: string, reason: string) {
    const key = await prisma.userSigningKey.findUnique({ where: { userId } });
    if (!key) throw Errors.notFound('Kunci tanda tangan tidak ditemukan');

    let trimmed: string;
    try {
      trimmed = normalizeReason(reason);
      assertKeyRevocable(key);
    } catch (e) {
      throw asHttpError(e);
    }

    const revokedAt = new Date();
    await prisma.userSigningKey.update({
      where: { id: key.id },
      data: { revokedAt, revokedReason: trimmed, revokedById: actorId },
    });

    // Surat yang ditandatangani dengan kunci ini — dicocokkan pada salinan
    // kunci publiknya, bukan sekadar pada penandatangannya, karena orang yang
    // sama bisa pernah memegang kunci lain sebelumnya.
    const signedWithThisKey = await prisma.letterSignature.findMany({
      where: { signerId: userId, publicKey: key.publicKey, revokedAt: null },
      select: {
        id: true,
        signedAt: true,
        letter: { select: { id: true, letterNumber: true, subject: true, date: true } },
      },
      orderBy: { signedAt: 'desc' },
      take: 200,
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'REVOKE',
        entity: 'UserSigningKey',
        entityId: key.id,
        newValues: {
          revokedAt: revokedAt.toISOString(),
          revokedReason: trimmed,
          keyHolderId: userId,
          lettersStillValid: signedWithThisKey.length,
        },
      },
    });

    eventBus.emit('notification:send', {
      userId,
      type: 'WARNING',
      title: 'Kunci Tanda Tangan Dicabut',
      message: `Kunci tanda tangan elektronik Anda dicabut: ${trimmed}`,
      data: {},
    });

    return {
      success: true,
      revokedAt,
      revokedReason: trimmed,
      affectedLetterCount: signedWithThisKey.length,
      affectedLetters: signedWithThisKey.map((s) => ({
        signatureId: s.id,
        letterId: s.letter.id,
        letterNumber: s.letter.letterNumber,
        subject: s.letter.subject,
        date: s.letter.date,
        signedAt: s.signedAt,
      })),
    };
  },

  /**
   * Cabut tanda tangan pada sebuah surat.
   *
   * Menarik kembali surat yang telanjur beredar adalah kebutuhan tata usaha
   * yang biasa — SK salah orang, nomor ganda, keputusan yang dibatalkan. Skema
   * dan halaman verifikasi publik sudah lama siap menampilkannya; yang tidak
   * pernah ada adalah jalan untuk melakukannya, sehingga satu-satunya cara
   * adalah menyunting basis data.
   *
   * Barisnya tidak dihapus. Surat yang sudah beredar harus tetap bisa dijawab
   * statusnya kepada siapa pun yang mengunggahnya — dan jawaban "dicabut,
   * dengan alasan ini" jauh lebih berguna daripada "tidak terdaftar", yang
   * berbunyi persis seperti jawaban untuk dokumen palsu.
   */
  async revokeLetterSignature(letterId: string, actor: RevocationActor, reason: string) {
    const letter = await prisma.letter.findUnique({
      where: { id: letterId },
      select: {
        id: true,
        status: true,
        letterNumber: true,
        subject: true,
        createdById: true,
        /**
         * Termasuk yang sudah dicabut, sengaja.
         *
         * Menyaring `revokedAt: null` di sini akan membuat surat yang tanda
         * tangannya sudah dicabut tampak seperti surat yang belum pernah
         * ditandatangani — dan itulah kalimat yang akan dibaca operatornya.
         * Barisnya diambil apa adanya supaya aturan di
         * `utils/esign-revocation.ts` yang menjawab, dengan sebab yang benar.
         */
        signatures: {
          orderBy: { signedAt: 'desc' },
          select: { id: true, signerId: true, revokedAt: true },
        },
      },
    });
    if (!letter) throw Errors.notFound('Surat tidak ditemukan');

    const target = letter.signatures[0] ?? null;
    let trimmed: string;
    try {
      // Wewenang lebih dulu: yang tidak berwenang tidak perlu diberi tahu
      // panjang alasan yang benar, apalagi bahwa suratnya memang sudah dicabut.
      assertSignatureRevocable(target, actor);
      trimmed = normalizeReason(reason);
    } catch (e) {
      throw asHttpError(e);
    }

    const revokedAt = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const sig = await tx.letterSignature.update({
        where: { id: target!.id },
        data: { revokedAt, revokedReason: trimmed, revokedById: actor.id },
      });

      await tx.letterFlowEvent.create({
        data: {
          letterId: letter.id,
          actorId: actor.id,
          action: LetterFlowAction.SIGNATURE_REVOKED,
          fromStatus: letter.status,
          toStatus: letter.status,
          note: `Tanda tangan elektronik dicabut: ${trimmed}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: 'REVOKE',
          entity: 'LetterSignature',
          entityId: sig.id,
          newValues: {
            revokedAt: revokedAt.toISOString(),
            revokedReason: trimmed,
            letterId: letter.id,
            letterNumber: letter.letterNumber,
          },
        },
      });

      return sig;
    });

    /**
     * Status surat sengaja tidak diubah.
     *
     * Surat ini memang pernah ditandatangani dan memang pernah beredar;
     * mengembalikannya ke DRAFT akan menghapus kenyataan itu dari buku agenda.
     * Yang menentukan sah atau tidaknya adalah tanda tangannya, dan di situlah
     * pencabutan dicatat — dibaca oleh halaman verifikasi publik, oleh naskah
     * yang dicetak, dan oleh riwayat alur surat di atas.
     */

    // Penandatangan diberi tahu bila bukan dia sendiri yang mencabut; pembuat
    // konsep selalu, karena dialah yang biasanya harus menerbitkan gantinya.
    const notify = new Set<string>();
    if (target!.signerId !== actor.id) notify.add(target!.signerId);
    if (letter.createdById && letter.createdById !== actor.id) notify.add(letter.createdById);

    const label = letter.letterNumber || letter.subject || 'Surat';
    for (const userId of notify) {
      eventBus.emit('notification:send', {
        userId,
        type: 'WARNING',
        title: 'Tanda Tangan Surat Dicabut',
        message: `Tanda tangan elektronik pada ${label} dicabut: ${trimmed}`,
        data: { letterId: letter.id },
      });
    }

    return {
      success: true,
      signatureId: updated.id,
      revokedAt: updated.revokedAt,
      revokedReason: updated.revokedReason,
    };
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
      include: { reviewers: { orderBy: { order: 'asc' } } },
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

    // Verify that caller is the current pending reviewer in turn order and no non-signer reviewers remain pending
    const pendingReviewers = letter.reviewers.filter((r) => r.status !== 'APPROVED');
    const pendingNonSigners = pendingReviewers.filter((r) => !r.isSigner);
    if (pendingNonSigners.length > 0) {
      throw Errors.forbidden(
        `Surat belum selesai ditinjau oleh seluruh pemeriksa/paraf sebelum ditandatangani.`
      );
    }

    const currentTurn = pendingReviewers[0];
    if (currentTurn && currentTurn.reviewerId !== userId) {
      throw Errors.forbidden(
        `Belum giliran Anda. Menunggu verifikator urutan ${currentTurn.order} terlebih dahulu.`
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

    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
      // Lock letter row and re-verify reviewer state under concurrency
      await tx.$executeRaw`SELECT id FROM letters WHERE id = ${letterId} FOR UPDATE`;

      const txLetter = await tx.letter.findUnique({
        where: { id: letterId },
        include: { reviewers: { orderBy: { order: 'asc' } } },
      });
      if (!txLetter) throw Errors.notFound('Surat tidak ditemukan');

      const txMine = txLetter.reviewers.find((r) => r.reviewerId === userId);
      if (!txMine?.isSigner) {
        throw Errors.forbidden('Anda bukan penandatangan surat ini.');
      }
      if (txLetter.status !== LetterStatus.READY_TO_SIGN) {
        throw Errors.badRequest(
          `Surat belum siap ditandatangani (status: ${txLetter.status}).`
        );
      }

      const pendingReviewers = txLetter.reviewers.filter((r) => r.status !== 'APPROVED');
      const pendingNonSigners = pendingReviewers.filter((r) => !r.isSigner);
      if (pendingNonSigners.length > 0) {
        throw Errors.forbidden(
          'Surat belum selesai ditinjau oleh seluruh pemeriksa/paraf sebelum ditandatangani.'
        );
      }

      const currentTurn = pendingReviewers[0];
      if (currentTurn && currentTurn.reviewerId !== userId) {
        throw Errors.forbidden(
          `Belum giliran Anda. Menunggu verifikator urutan ${currentTurn.order} terlebih dahulu.`
        );
      }

      const signature = await tx.letterSignature.create({
        data: {
          letterId: txLetter.id,
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
        where: { id: txMine.id },
        data: { status: 'APPROVED', reviewedAt: signedAt },
      });
      await tx.letter.update({
        where: { id: txLetter.id },
        data: { status: LetterStatus.SIGNED },
      });
      await tx.letterFlowEvent.create({
        data: {
          letterId: txLetter.id,
          actorId: userId,
          action: LetterFlowAction.SIGNED,
          fromStatus: txLetter.status,
          toStatus: LetterStatus.SIGNED,
          note: 'Ditandatangani secara elektronik.',
        },
      });

      /**
       * The PDF hash is part of signing, not an afterthought to it.
       *
       * This used to sit after the transaction inside a `try/catch` whose body
       * was a single `console.error`. When PDF generation failed for any
       * reason the letter was still committed as SIGNED with `pdfHash = NULL`
       * — and because uploading the PDF is the only supported way to verify a
       * letter, that letter could never be proven genuine again. Worse, the
       * public page does not say "our system had a problem"; it says the
       * document "tidak terdaftar dalam sistem resmi ... atau telah mengalami
       * perubahan". A genuine letter was publicly accused of being forged, and
       * nothing surfaced it.
       *
       * Generating inside the transaction means a failure rolls the signature
       * back and the signer sees an error, which is the honest outcome: either
       * a letter is signed and verifiable, or it is not signed at all.
       */
      const fullLetter = await tx.letter.findUnique({
        where: { id: letterId },
        include: {
          unit: true,
          signatures: {
            include: {
              signer: {
                select: {
                  name: true,
                  teacher: { select: { nip: true } },
                  staff: { select: { nip: true } },
                },
              },
            },
          },
        },
      });
      if (!fullLetter) throw Errors.notFound('Surat tidak ditemukan');

      const pdfBuffer = await generateLetterPdfBuffer(fullLetter);
      const pdfHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
      const pdfSignature = signPdfHash(toMaterial(key!), passphrase, pdfHash);

      const withPdf = await tx.letterSignature.update({
        where: { id: signature.id },
        data: { pdfHash, pdfSignature },
      });

      return withPdf;
    },
      // Rendering the naskah is part of this transaction now; the default 5s
      // ceiling is tight for a multi-page letter on a cold container.
      { timeout: 20_000 });
    } catch (e) {
      // An unrenderable naskah is the author's to fix, not a server fault.
      if (e instanceof LetterPdfError) throw Errors.badRequest(e.message);
      throw e;
    }

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
  /**
   * Inti aturan verifikasi yang dipakai bersama.
   *
   * **Tidak dirutekan sebagai endpoint publik.** Menjawab keabsahan dari sebuah
   * token saja berarti menyatakan sesuatu tentang dokumen yang tidak pernah
   * diperiksa; jalan masuk publik satu-satunya adalah `verifyByPdfBuffer`, yang
   * lebih dulu mengikat hash byte berkas yang diunggah. Fungsi ini dipanggil
   * dari sana setelah ikatan itu terbukti.
   */
  async verifyByToken(token: string) {
    return verifyLetterByToken(token);
  },

  /**
   * Verifikasi publik lewat buffer file PDF yang diunggah.
   *
   * Mencari token verifikasi atau mencocokkan rekaman tanda tangan di DB,
   * lalu memanggil verifyLetterByToken agar tetap menjaga aturan kerahasiaan.
   */
  async verifyByPdfBuffer(pdfBuffer: Buffer) {
    // 1. Calculate SHA-256 byte hash of uploaded PDF
    const uploadedHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    // 2. Direct DB lookup by indexed pdfHash
    const signature = await prisma.letterSignature.findUnique({
      where: { pdfHash: uploadedHash },
      select: {
        verificationToken: true,
        publicKey: true,
        pdfHash: true,
        pdfSignature: true,
      },
    });

    if (!signature || !signature.pdfHash || !signature.pdfSignature) {
      return {
        found: false as const,
        isValid: false,
        isRevoked: false,
        reason: 'Dokumen PDF tidak terdaftar dalam sistem resmi Yayasan Pesantren Cipansor atau telah mengalami perubahan.',
        letter: null,
        signer: null,
      };
    }

    // 3. Verify Ed25519 digital signature over the PDF byte hash
    const isSigValid = verifyPdfHashSignature(
      signature.publicKey,
      signature.pdfHash,
      signature.pdfSignature
    );

    if (!isSigValid) {
      return {
        found: false as const,
        isValid: false,
        isRevoked: false,
        reason: 'Tanda tangan digital pada dokumen PDF tidak valid atau telah dimanipulasi.',
        letter: null,
        signer: null,
      };
    }

    // 4. Ikatan dokumen sudah terbukti; baru sekarang aturan kerahasiaan dan
    //    status surat dijalankan lewat inti yang sama.
    return EsignService.verifyByToken(signature.verificationToken);
  },
};

export type { SigningKeyState };
