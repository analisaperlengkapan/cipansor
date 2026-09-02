import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { EsignService } from './esign.service';
import {
  createKeyMaterial,
  signPayload,
  signPdfHash,
  verifyRevocation,
  type SignablePayload,
} from '@/utils/esign';
import crypto from 'crypto';

const { emitMock, compareMock } = vi.hoisted(() => ({
  emitMock: vi.fn(),
  compareMock: vi.fn(),
}));

vi.mock('../../lib/prisma', () => ({
  prisma: {
    $executeRaw: vi.fn(),
    userSigningKey: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    signingKeyRequest: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    letter: { findUnique: vi.fn(), update: vi.fn() },
    letterReviewer: { update: vi.fn() },
    letterSignature: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
    letterFlowEvent: { create: vi.fn() },
    auditLog: { create: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn((cb: any) => cb(prisma)),
  },
}));
vi.mock('../../lib/event-bus', () => ({ eventBus: { emit: emitMock } }));
vi.mock('@/lib/event-bus', () => ({ eventBus: { emit: emitMock } }));
vi.mock('@/lib/password', () => ({ comparePassword: compareMock }));

const PASS = 'passphrase-tanda-tangan-2026';
const DAY = 24 * 60 * 60 * 1000;

/** Kunci aktif lengkap dengan bahan kriptografinya. */
function activeKey(over: Record<string, unknown> = {}) {
  const m = createKeyMaterial(PASS);
  return {
    id: 'key-1',
    userId: 'ketua',
    ...m,
    kdfParams: m.kdfParams as unknown,
    failedAttempts: 0,
    lockedUntil: null,
    approvedAt: new Date(Date.now() - 10 * DAY),
    expiresAt: new Date(Date.now() + 200 * DAY),
    revokedAt: null,
    revokedReason: null,
    ...over,
  };
}

beforeEach(() => vi.clearAllMocks());

describe('pengajuan kunci', () => {
  it('memilih ENROLLMENT bila belum punya kunci', async () => {
    vi.mocked(prisma.signingKeyRequest.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(null as any);
    vi.mocked(prisma.signingKeyRequest.create).mockResolvedValue({ id: 'r1' } as any);

    await EsignService.requestKey('ketua');

    expect(prisma.signingKeyRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ kind: 'ENROLLMENT' }),
    });
  });

  it('memilih RENEWAL hanya ketika sudah dekat masa habis', async () => {
    vi.mocked(prisma.signingKeyRequest.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(
      activeKey({ expiresAt: new Date(Date.now() + 5 * DAY) }) as any
    );
    vi.mocked(prisma.signingKeyRequest.create).mockResolvedValue({ id: 'r1' } as any);

    await EsignService.requestKey('ketua');

    expect(prisma.signingKeyRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ kind: 'RENEWAL' }),
    });
  });

  it('menolak bila kunci masih lama berlakunya', async () => {
    vi.mocked(prisma.signingKeyRequest.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(activeKey() as any);

    await expect(EsignService.requestKey('ketua')).rejects.toThrow(/masih berlaku/i);
  });

  it('menolak pengajuan ganda selagi satu masih menunggu', async () => {
    vi.mocked(prisma.signingKeyRequest.findFirst).mockResolvedValue({ id: 'r0' } as any);
    await expect(EsignService.requestKey('ketua')).rejects.toThrow(/masih menunggu/i);
  });
});

describe('putusan Super Admin', () => {
  it('menolak masa berlaku di luar batas', async () => {
    vi.mocked(prisma.signingKeyRequest.findUnique).mockResolvedValue({
      id: 'r1', userId: 'ketua', kind: 'ENROLLMENT', status: 'PENDING',
    } as any);

    await expect(
      EsignService.decideRequest('r1', 'admin', true, 5000)
    ).rejects.toThrow(/Masa berlaku/i);
  });

  it('perpanjangan memperpanjang kunci yang ada, tidak menggantinya', async () => {
    const key = activeKey({ expiresAt: new Date(Date.now() + 5 * DAY) });
    vi.mocked(prisma.signingKeyRequest.findUnique).mockResolvedValue({
      id: 'r1', userId: 'ketua', kind: 'RENEWAL', status: 'PENDING',
    } as any);
    vi.mocked(prisma.signingKeyRequest.update).mockResolvedValue({ id: 'r1' } as any);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(key as any);

    await EsignService.decideRequest('r1', 'admin', true, 365);

    expect(prisma.userSigningKey.deleteMany).not.toHaveBeenCalled();
    expect(prisma.userSigningKey.update).toHaveBeenCalledWith({
      where: { id: key.id },
      data: expect.objectContaining({ expiresAt: expect.any(Date) }),
    });
  });

  it('tidak memutus pengajuan yang sudah diputus', async () => {
    vi.mocked(prisma.signingKeyRequest.findUnique).mockResolvedValue({
      id: 'r1', userId: 'ketua', kind: 'ENROLLMENT', status: 'APPROVED',
    } as any);
    await expect(EsignService.decideRequest('r1', 'admin', true)).rejects.toThrow(
      /sudah diputuskan/i
    );
  });
});

describe('ganti passphrase', () => {
  it('menolak bila password akun salah — passphrase saja tidak cukup', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ passwordHash: 'h' } as any);
    compareMock.mockResolvedValue(false);

    await expect(
      EsignService.changePassphrase('ketua', PASS, 'password-salah', 'passphrase-baru-2026')
    ).rejects.toThrow(/Password akun salah/i);

    expect(prisma.userSigningKey.update).not.toHaveBeenCalled();
  });

  it('mencatat percobaan gagal bila passphrase lama salah', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ passwordHash: 'h' } as any);
    compareMock.mockResolvedValue(true);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(activeKey() as any);

    await expect(
      EsignService.changePassphrase('ketua', 'passphrase-salah-sekali', 'pw', 'passphrase-baru-2026')
    ).rejects.toThrow();

    expect(prisma.userSigningKey.update).toHaveBeenCalledWith({
      where: { id: 'key-1' },
      data: expect.objectContaining({ failedAttempts: 1 }),
    });
  });
});

describe('menandatangani surat', () => {
  const letter = (over: Record<string, unknown> = {}) => ({
    id: 'letter-1',
    letterNumber: '434/Sket/Y-CPS/VII/2026',
    date: new Date('2026-07-13T00:00:00Z'),
    type: 'SURAT_KETERANGAN',
    nature: 'PUBLIC',
    subject: 'Keterangan',
    content: 'Isi.',
    unitId: 'unit-1',
    status: 'READY_TO_SIGN',
    reviewers: [{ id: 'rev-1', reviewerId: 'ketua', isSigner: true, order: 1, status: 'PENDING' }],
    ...over,
  });

  it('menolak bukan penandatangan', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(
      letter({ reviewers: [{ id: 'r', reviewerId: 'orang-lain', isSigner: true }] }) as any
    );
    await expect(EsignService.signLetter('letter-1', 'ketua', PASS)).rejects.toThrow(
      /bukan penandatangan/i
    );
  });

  it('menolak bila surat belum sampai giliran tanda tangan', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(
      letter({ status: 'PENDING_REVIEW' }) as any
    );
    await expect(EsignService.signLetter('letter-1', 'ketua', PASS)).rejects.toThrow(
      /belum siap ditandatangani/i
    );
  });

  it('menolak bila kunci kedaluwarsa', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(letter() as any);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(
      activeKey({ expiresAt: new Date(Date.now() - DAY) }) as any
    );
    await expect(EsignService.signLetter('letter-1', 'ketua', PASS)).rejects.toThrow(
      /Masa berlaku/i
    );
  });

  it('passphrase salah dicatat dan tidak menandatangani apa pun', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(letter() as any);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(activeKey() as any);

    await expect(
      EsignService.signLetter('letter-1', 'ketua', 'passphrase-yang-salah')
    ).rejects.toThrow(/Passphrase.*salah/i);

    expect(prisma.letterSignature.create).not.toHaveBeenCalled();
    expect(prisma.letter.update).not.toHaveBeenCalled();
    expect(prisma.userSigningKey.update).toHaveBeenCalledWith({
      where: { id: 'key-1' },
      data: expect.objectContaining({ failedAttempts: 1 }),
    });
  });

  it('menandatangani, menandai surat SIGNED, dan mencatat riwayat', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(letter() as any);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(activeKey() as any);
    vi.mocked(prisma.letterSignature.create).mockResolvedValue({
      id: 'sig-1', verificationToken: 'tok', signedAt: new Date(),
    } as any);
    vi.mocked(prisma.letterSignature.update).mockResolvedValue({
      id: 'sig-1', verificationToken: 'tok', signedAt: new Date(),
    } as any);

    const out = await EsignService.signLetter('letter-1', 'ketua', PASS);

    expect(out.verificationToken).toBe('tok');
    expect(prisma.letter.update).toHaveBeenCalledWith({
      where: { id: 'letter-1' },
      data: { status: 'SIGNED' },
    });
    expect(prisma.letterFlowEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'SIGNED', actorId: 'ketua' }),
    });
    // Hash PDF ditulis sebagai bagian dari penandatanganan, bukan sesudahnya.
    expect(prisma.letterSignature.update).toHaveBeenCalledWith({
      where: { id: 'sig-1' },
      data: expect.objectContaining({
        pdfHash: expect.stringMatching(/^[0-9a-f]{64}$/),
        pdfSignature: expect.any(String),
      }),
    });
  });

  /**
   * Naskah yang tidak dapat dirender tidak boleh menghasilkan surat SIGNED.
   *
   * Sebelumnya pembuatan PDF berada di luar transaksi, dibungkus `try/catch`
   * yang hanya mencetak ke konsol. Setiap kegagalan meninggalkan surat berstatus
   * SIGNED dengan `pdfHash` kosong — dan karena unggah berkas adalah satu-satunya
   * cara memverifikasi, surat itu selamanya tidak bisa dibuktikan asli. Yang
   * dilihat publik pun bukan "sistem bermasalah", melainkan tuduhan bahwa
   * dokumennya telah diubah.
   */
  it('menolak menandatangani bila naskahnya tidak dapat dirender', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(
      letter({ content: 'Kutipan: \u0628\u0633\u0645 \u0627\u0644\u0644\u0647' }) as any
    );
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(activeKey() as any);
    vi.mocked(prisma.letterSignature.create).mockResolvedValue({
      id: 'sig-1', verificationToken: 'tok', signedAt: new Date(),
    } as any);

    await expect(EsignService.signLetter('letter-1', 'ketua', PASS)).rejects.toThrow(
      /belum didukung/i
    );
  });
});

describe('verifikasi publik', () => {
  function signedFixture(nature: string, content = 'Isi rahasia yang tidak boleh bocor.') {
    const m = createKeyMaterial(PASS);
    const signedAt = new Date('2026-07-13T04:00:00Z');
    const payload: SignablePayload = {
      letterId: 'letter-1',
      letterNumber: '434/Sket/Y-CPS/VII/2026',
      date: new Date('2026-07-13T00:00:00Z'),
      type: 'SURAT_KETERANGAN',
      nature,
      subject: 'Perihal yang sensitif',
      content,
      unitId: 'unit-1',
      signerId: 'ketua',
      signedAt,
    };
    const s = signPayload(m, PASS, payload);
    return {
      material: m,
      fixture: {
        signerId: 'ketua',
        publicKey: s.publicKey,
        signature: s.signature,
        signedAt,
        // Dibiarkan nullable secara eksplisit: beberapa tes mengisi keduanya
        // untuk menguji surat yang dicabut, dan inferensi `null` akan menolaknya.
        revokedAt: null as Date | null,
        revokedReason: null as string | null,
        signer: { name: 'H. Ramram Mansur Ramdani' },
        letter: {
          id: 'letter-1',
          letterNumber: payload.letterNumber,
          date: payload.date,
          type: payload.type,
          nature,
          subject: payload.subject,
          content,
          unitId: 'unit-1',
          unit: { name: 'Yayasan' },
        },
      },
    };
  }

  it('token tak dikenal tidak membocorkan apa pun', async () => {
    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(null as any);
    const r = await EsignService.verifyByToken('entah');
    expect(r).toEqual({ found: false });
  });

  it('surat asli terverifikasi', async () => {
    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(
      signedFixture('PUBLIC').fixture as any
    );
    const r: any = await EsignService.verifyByToken('tok');
    expect(r.found).toBe(true);
    expect(r.valid).toBe(true);
    expect(r.signerName).toBe('H. Ramram Mansur Ramdani');
  });

  it('verifikasi via upload buffer PDF berhasil menemukan record berdasarkan hash SHA-256', async () => {
    const pdfBuffer = Buffer.from('PDF Content for SHA-256 hash matching test');
    const pdfHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    const { material, fixture } = signedFixture('PUBLIC');
    const pdfSignature = signPdfHash(material, PASS, pdfHash);

    const fullFixture = {
      ...fixture,
      verificationToken: 'tok-123',
      pdfHash,
      pdfSignature,
    };

    // Prisma mengembalikan Prisma__LetterSignatureClient — sebuah thenable yang
    // juga membawa relasi — bukan Promise biasa. Mock ini hanya perlu bagian
    // then-able-nya, jadi tipenya dilebarkan sekali di sini.
    vi.mocked(prisma.letterSignature.findUnique).mockImplementation(((args: any) => {
      if (args?.where?.pdfHash === pdfHash) {
        return Promise.resolve(fullFixture as any);
      }
      if (args?.where?.verificationToken === 'tok-123') {
        return Promise.resolve(fullFixture as any);
      }
      return Promise.resolve(null as any);
    }) as unknown as typeof prisma.letterSignature.findUnique);

    const r: any = await EsignService.verifyByPdfBuffer(pdfBuffer);

    expect(r.found).toBe(true);
    expect(r.valid).toBe(true);
  });

  it.each(['PUBLIC', 'LIMITED', 'CONFIDENTIAL', 'STRICTLY_CONFIDENTIAL'])(
    'tidak pernah mengembalikan isi surat (sifat %s)',
    async (nature) => {
      vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(
        signedFixture(nature).fixture as any
      );
      const r: any = await EsignService.verifyByToken('tok');
      expect(JSON.stringify(r)).not.toContain('Isi rahasia yang tidak boleh bocor');
      expect(r.content).toBeUndefined();
    }
  );

  it('perihal hanya ditampilkan untuk surat bersifat Biasa', async () => {
    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(
      signedFixture('PUBLIC').fixture as any
    );
    expect(((await EsignService.verifyByToken('tok')) as any).subject).toBe(
      'Perihal yang sensitif'
    );

    for (const nature of ['LIMITED', 'CONFIDENTIAL', 'STRICTLY_CONFIDENTIAL']) {
      vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(
        signedFixture(nature).fixture as any
      );
      expect(((await EsignService.verifyByToken('tok')) as any).subject).toBeNull();
    }
  });

  it('naskah yang diubah setelah ditandatangani tidak lagi sah', async () => {
    const { fixture } = signedFixture('PUBLIC');
    fixture.letter.content = 'Isi yang sudah diubah diam-diam.';
    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(fixture as any);

    const r: any = await EsignService.verifyByToken('tok');
    expect(r.intact).toBe(false);
    expect(r.valid).toBe(false);
  });

  it('tanda tangan yang dicabut tidak sah walau naskahnya utuh', async () => {
    const { fixture } = signedFixture('PUBLIC');
    fixture.revokedAt = new Date();
    fixture.revokedReason = 'Diterbitkan keliru';
    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(fixture as any);

    const r: any = await EsignService.verifyByToken('tok');
    expect(r.intact).toBe(true);
    expect(r.revoked).toBe(true);
    expect(r.valid).toBe(false);
  });
});

/**
 * Pencabutan.
 *
 * Dua hal yang paling mudah salah dan paling mahal akibatnya: mencabut sesuatu
 * yang sudah dicabut (menimpa catatan pertama, yang justru menjawab sejak kapan
 * ia tidak berlaku), dan mengira mencabut kunci berarti mencabut surat-suratnya
 * (tidak — dan itulah sebabnya jumlahnya dilaporkan kembali).
 */
describe('mencabut kunci tanda tangan', () => {
  const REASON = 'Passphrase bocor ke pihak lain';

  beforeEach(() => {
    vi.mocked(prisma.letterSignature.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'audit-1' } as any);
  });

  it('mencatat tanggal, alasan, dan siapa yang mencabut', async () => {
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(activeKey() as any);

    await EsignService.revokeKey('ketua', 'admin-1', REASON);

    expect(prisma.userSigningKey.update).toHaveBeenCalledWith({
      where: { id: 'key-1' },
      data: expect.objectContaining({
        revokedAt: expect.any(Date),
        revokedReason: REASON,
        revokedById: 'admin-1',
      }),
    });
  });

  it('menolak mencabut kunci yang sudah dicabut', async () => {
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(
      activeKey({ revokedAt: new Date('2026-01-01'), revokedReason: 'Sudah' }) as any
    );

    await expect(EsignService.revokeKey('ketua', 'admin-1', REASON)).rejects.toThrow(
      /sudah dicabut/i
    );
    expect(prisma.userSigningKey.update).not.toHaveBeenCalled();
  });

  it('menolak alasan yang hanya berisi spasi', async () => {
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(activeKey() as any);

    await expect(
      EsignService.revokeKey('ketua', 'admin-1', '              ')
    ).rejects.toThrow(/Alasan pencabutan/i);
    expect(prisma.userSigningKey.update).not.toHaveBeenCalled();
  });

  /**
   * Yang mencabut kunci karena passphrase bocor perlu tahu berapa surat yang
   * sudah telanjur ditandatangani dengannya — mencabut kuncinya tidak mencabut
   * satu pun di antaranya.
   */
  it('melaporkan surat yang sudah ditandatangani dengan kunci itu', async () => {
    const key = activeKey();
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(key as any);
    vi.mocked(prisma.letterSignature.findMany).mockResolvedValue([
      {
        id: 'sig-1',
        signedAt: new Date('2026-08-01'),
        letter: {
          id: 'letter-1',
          letterNumber: '434/Sket/Y-CPS/VII/2026',
          subject: 'Keterangan',
          date: new Date('2026-08-01'),
        },
      },
    ] as any);

    const r = await EsignService.revokeKey('ketua', 'admin-1', REASON);

    expect(r.affectedLetterCount).toBe(1);
    expect(r.affectedLetters[0]).toMatchObject({ letterId: 'letter-1', signatureId: 'sig-1' });
  });

  /**
   * Dicocokkan pada salinan kunci publiknya, bukan sekadar pada
   * penandatangannya: orang yang sama bisa pernah memegang kunci lain, dan
   * surat-surat kunci lama itu tidak ada hubungannya dengan kebocoran ini.
   */
  it('mencocokkan surat pada kunci publiknya, bukan hanya pada penandatangannya', async () => {
    const key = activeKey();
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(key as any);

    await EsignService.revokeKey('ketua', 'admin-1', REASON);

    expect(prisma.letterSignature.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { signerId: 'ketua', publicKey: key.publicKey, revokedAt: null },
      })
    );
  });

  /**
   * Kode sebab RFC 5280 §5.3.1: hanya KEY_COMPROMISE yang membuat surat-surat
   * yang telanjur ditandatangani menjadi meragukan. Membedakannya menghindarkan
   * petugas dari dua kekeliruan yang berlawanan — mencabut belasan naskah yang
   * sebenarnya tidak apa-apa, atau membiarkan naskah bertanda tangan kunci
   * bocor tetap berlaku.
   */
  it('menandai perlunya peninjauan hanya untuk kebocoran kunci', async () => {
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(activeKey() as any);
    const bocor = await EsignService.revokeKey('ketua', 'admin-1', REASON, 'KEY_COMPROMISE' as any);
    expect(bocor.lettersNeedReview).toBe(true);

    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(activeKey() as any);
    const berhenti = await EsignService.revokeKey(
      'ketua', 'admin-1', REASON, 'AFFILIATION_CHANGED' as any
    );
    expect(berhenti.lettersNeedReview).toBe(false);
  });

  it('menyimpan kode sebabnya, dan memilih yang paling tidak berbahaya bila tidak disebut', async () => {
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(activeKey() as any);

    await EsignService.revokeKey('ketua', 'admin-1', REASON);

    expect(prisma.userSigningKey.update).toHaveBeenCalledWith({
      where: { id: 'key-1' },
      data: expect.objectContaining({ revocationCode: 'AFFILIATION_CHANGED' }),
    });
  });

  it('memberi tahu pemilik kunci', async () => {
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(activeKey() as any);

    await EsignService.revokeKey('ketua', 'admin-1', REASON);

    expect(emitMock).toHaveBeenCalledWith(
      'notification:send',
      expect.objectContaining({ userId: 'ketua', title: expect.stringMatching(/Dicabut/i) })
    );
  });
});

describe('mencabut naskah dinas', () => {
  const REASON = 'Nomor surat ganda, diterbitkan ulang';
  const SIGNER = { id: 'ketua', roleCode: 'YAYASAN_KETUA' };
  const PENGAWAS = { id: 'pengawas-1', roleCode: 'YAYASAN_PENGAWAS' };
  const SUPER_ADMIN = { id: 'admin-1', roleCode: 'SUPER_ADMIN' };
  const OTHER = { id: 'guru-9', roleCode: 'TKQ_GURU' };

  function signedLetter(over: Record<string, unknown> = {}) {
    return {
      id: 'letter-1',
      status: 'SIGNED',
      letterNumber: '434/Sket/Y-CPS/VII/2026',
      subject: 'Keterangan',
      createdById: 'tata-usaha',
      signatures: [
        { id: 'sig-1', signerId: 'ketua', signerRoleCode: 'YAYASAN_KETUA', revokedAt: null },
      ],
      ...over,
    };
  }

  /** Kunci milik pencabutnya — bukan milik penandatangan. */
  function revokerKey(userId: string) {
    return activeKey({ id: `key-${userId}`, userId });
  }

  beforeEach(() => {
    vi.mocked(prisma.letterSignature.update).mockResolvedValue({
      id: 'sig-1',
      revokedAt: new Date(),
      revokedReason: REASON,
    } as any);
    vi.mocked(prisma.letterFlowEvent.create).mockResolvedValue({ id: 'ev-1' } as any);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'audit-1' } as any);
  });

  it('penandatangannya sendiri boleh mencabut', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(signedLetter() as any);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(revokerKey('ketua') as any);

    await EsignService.revokeLetterSignature('letter-1', SIGNER, REASON, PASS);

    expect(prisma.letterSignature.update).toHaveBeenCalledWith({
      where: { id: 'sig-1' },
      data: expect.objectContaining({
        revokedAt: expect.any(Date),
        revokedReason: REASON,
        revokedById: 'ketua',
        revokedByRoleCode: 'YAYASAN_KETUA',
      }),
    });
  });

  /**
   * Menganulir naskah organ pelaksana adalah perbuatan pengawasan, dan Pengawas
   * memakai kuncinya sendiri — sehingga passphrase Ketua yang bocor tidak
   * menghalangi pencabutannya.
   */
  it('Pengawas boleh mencabut naskah Pengurus, dengan kuncinya sendiri', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(signedLetter() as any);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(
      revokerKey('pengawas-1') as any
    );

    await EsignService.revokeLetterSignature('letter-1', PENGAWAS, REASON, PASS);

    expect(prisma.userSigningKey.findUnique).toHaveBeenCalledWith({
      where: { userId: 'pengawas-1' },
    });
    expect(prisma.letterSignature.update).toHaveBeenCalled();
  });

  /**
   * Pengelola sistem mengurus kunci, bukan kewenangan menandatangani atas nama
   * yayasan. Sebelumnya ia boleh mencabut naskah siapa pun.
   */
  it('Super Admin ditolak, dan tidak ada yang tertulis', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(signedLetter() as any);

    await expect(
      EsignService.revokeLetterSignature('letter-1', SUPER_ADMIN, REASON, PASS)
    ).rejects.toThrow(/Pengawas Yayasan/i);

    expect(prisma.letterSignature.update).not.toHaveBeenCalled();
  });

  it('pengguna lain ditolak', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(signedLetter() as any);

    await expect(
      EsignService.revokeLetterSignature('letter-1', OTHER, REASON, PASS)
    ).rejects.toThrow(/Pengawas Yayasan/i);

    expect(prisma.letterFlowEvent.create).not.toHaveBeenCalled();
  });

  /**
   * Pencabutan adalah pernyataan kriptografis, bukan pengubahan kolom status:
   * sebuah CRL pun ditandatangani penerbitnya (RFC 5280). Passphrase yang salah
   * berarti tidak ada pencabutan sama sekali.
   */
  it('passphrase salah tidak mencabut apa pun, dan dicatat', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(signedLetter() as any);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(revokerKey('ketua') as any);

    await expect(
      EsignService.revokeLetterSignature('letter-1', SIGNER, REASON, 'passphrase-yang-salah')
    ).rejects.toThrow(/Passphrase/i);

    expect(prisma.letterSignature.update).not.toHaveBeenCalled();
    expect(prisma.userSigningKey.update).toHaveBeenCalledWith({
      where: { id: 'key-ketua' },
      data: expect.objectContaining({ failedAttempts: 1 }),
    });
  });

  it('menyimpan tanda tangan Ed25519 atas pernyataan pencabutannya', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(signedLetter() as any);
    const key = revokerKey('ketua');
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(key as any);

    await EsignService.revokeLetterSignature('letter-1', SIGNER, REASON, PASS);

    const written = vi.mocked(prisma.letterSignature.update).mock.calls[0][0] as any;
    expect(written.data.revocationSignature).toEqual(expect.any(String));
    expect(written.data.revocationDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(written.data.revocationPublicKey).toBe(key.publicKey);

    // Benar-benar dapat diverifikasi, bukan sekadar terisi.
    expect(
      verifyRevocation(
        written.data.revocationPublicKey,
        {
          signatureId: 'sig-1',
          letterId: 'letter-1',
          revokedById: 'ketua',
          revokedByRoleCode: 'YAYASAN_KETUA',
          revokedAt: written.data.revokedAt,
          reason: REASON,
        },
        written.data.revocationSignature
      )
    ).toBe(true);
  });

  it('alasan yang diubah membatalkan tanda tangan pencabutannya', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(signedLetter() as any);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(revokerKey('ketua') as any);

    await EsignService.revokeLetterSignature('letter-1', SIGNER, REASON, PASS);
    const written = vi.mocked(prisma.letterSignature.update).mock.calls[0][0] as any;

    expect(
      verifyRevocation(
        written.data.revocationPublicKey,
        {
          signatureId: 'sig-1',
          letterId: 'letter-1',
          revokedById: 'ketua',
          revokedByRoleCode: 'YAYASAN_KETUA',
          revokedAt: written.data.revokedAt,
          reason: 'Alasan yang diganti diam-diam',
        },
        written.data.revocationSignature
      )
    ).toBe(false);
  });

  it('menolak bila pencabut tidak punya kunci yang berlaku', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(signedLetter() as any);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(null as any);

    await expect(
      EsignService.revokeLetterSignature('letter-1', SIGNER, REASON, PASS)
    ).rejects.toThrow(/kunci tanda tangan elektronik/i);
  });

  /**
   * Statusnya sengaja tetap. Surat ini memang pernah ditandatangani dan memang
   * pernah beredar; mengembalikannya ke DRAFT menghapus kenyataan itu dari buku
   * agenda.
   */
  it('tidak mengubah status surat', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(signedLetter() as any);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(revokerKey('ketua') as any);

    await EsignService.revokeLetterSignature('letter-1', SIGNER, REASON, PASS);

    expect(prisma.letter.update).not.toHaveBeenCalled();
  });

  it('mencatat pencabutan pada riwayat alur surat', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(signedLetter() as any);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(
      revokerKey('pengawas-1') as any
    );

    await EsignService.revokeLetterSignature('letter-1', PENGAWAS, REASON, PASS);

    expect(prisma.letterFlowEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        letterId: 'letter-1',
        actorId: 'pengawas-1',
        action: 'SIGNATURE_REVOKED',
        note: expect.stringContaining(REASON),
      }),
    });
  });

  it('memberi tahu penandatangan dan pembuat konsep', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(signedLetter() as any);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(
      revokerKey('pengawas-1') as any
    );

    await EsignService.revokeLetterSignature('letter-1', PENGAWAS, REASON, PASS);

    const notified = emitMock.mock.calls
      .filter((c) => c[0] === 'notification:send')
      .map((c) => (c[1] as { userId: string }).userId);
    expect(notified).toContain('ketua');
    expect(notified).toContain('tata-usaha');
  });

  it('tidak memberi tahu pencabutnya sendiri', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(signedLetter() as any);
    vi.mocked(prisma.userSigningKey.findUnique).mockResolvedValue(revokerKey('ketua') as any);

    await EsignService.revokeLetterSignature('letter-1', SIGNER, REASON, PASS);

    const notified = emitMock.mock.calls
      .filter((c) => c[0] === 'notification:send')
      .map((c) => (c[1] as { userId: string }).userId);
    expect(notified).not.toContain('ketua');
  });

  it('menolak naskah yang sudah dicabut, dan mengatakannya begitu', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(
      signedLetter({
        signatures: [
          {
            id: 'sig-1',
            signerId: 'ketua',
            signerRoleCode: 'YAYASAN_KETUA',
            revokedAt: new Date('2026-08-20'),
          },
        ],
      }) as any
    );

    await expect(
      EsignService.revokeLetterSignature('letter-1', SIGNER, REASON, PASS)
    ).rejects.toThrow(/sudah dicabut/i);
    expect(prisma.letterSignature.update).not.toHaveBeenCalled();
  });

  it('menolak alasan yang terlalu pendek', async () => {
    vi.mocked(prisma.letter.findUnique).mockResolvedValue(signedLetter() as any);

    await expect(
      EsignService.revokeLetterSignature('letter-1', SIGNER, 'salah', PASS)
    ).rejects.toThrow(/Alasan pencabutan/i);
    expect(prisma.letterSignature.update).not.toHaveBeenCalled();
  });
});
