import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { EsignService } from './esign.service';
import { createKeyMaterial, signPayload, type SignablePayload } from '@/utils/esign';

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
    letterSignature: { create: vi.fn(), findUnique: vi.fn() },
    letterFlowEvent: { create: vi.fn() },
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
  // Jenis pengajuan ditentukan server. Bila klien boleh memilih, kunci yang
  // sudah kedaluwarsa bisa "diperpanjang" dan lolos dari pemeriksaan ulang.
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

    // Kuncinya tidak dihapus — surat lama harus tetap terverifikasi.
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

    // Tidak menyentuh kunci sama sekali.
    expect(prisma.userSigningKey.update).not.toHaveBeenCalled();
  });

  // Menebak passphrase harus mahal, termasuk lewat jalur ini.
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
    // Hitungan gagal tetap naik walau operasi utama batal.
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

    const out = await EsignService.signLetter('letter-1', 'ketua', PASS);

    expect(out.verificationToken).toBe('tok');
    expect(prisma.letter.update).toHaveBeenCalledWith({
      where: { id: 'letter-1' },
      data: { status: 'SIGNED' },
    });
    expect(prisma.letterFlowEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'SIGNED', actorId: 'ketua' }),
    });
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
      signerId: 'ketua',
      publicKey: s.publicKey,
      signature: s.signature,
      signedAt,
      revokedAt: null,
      revokedReason: null,
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
    };
  }

  it('token tak dikenal tidak membocorkan apa pun', async () => {
    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(null as any);
    const r = await EsignService.verifyByToken('entah');
    expect(r).toEqual({ found: false });
  });

  it('surat asli terverifikasi', async () => {
    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(
      signedFixture('PUBLIC') as any
    );
    const r: any = await EsignService.verifyByToken('tok');
    expect(r.found).toBe(true);
    expect(r.valid).toBe(true);
    expect(r.signerName).toBe('H. Ramram Mansur Ramdani');
  });

  // Inti keamanan fitur ini: QR menempel pada lembar yang bisa bertanda
  // "SANGAT RAHASIA". Halaman publik tidak boleh menayangkan isinya.
  it.each(['PUBLIC', 'LIMITED', 'CONFIDENTIAL', 'STRICTLY_CONFIDENTIAL'])(
    'tidak pernah mengembalikan isi surat (sifat %s)',
    async (nature) => {
      vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(
        signedFixture(nature) as any
      );
      const r: any = await EsignService.verifyByToken('tok');
      expect(JSON.stringify(r)).not.toContain('Isi rahasia yang tidak boleh bocor');
      expect(r.content).toBeUndefined();
    }
  );

  it('perihal hanya ditampilkan untuk surat bersifat Biasa', async () => {
    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(
      signedFixture('PUBLIC') as any
    );
    expect(((await EsignService.verifyByToken('tok')) as any).subject).toBe(
      'Perihal yang sensitif'
    );

    for (const nature of ['LIMITED', 'CONFIDENTIAL', 'STRICTLY_CONFIDENTIAL']) {
      vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(
        signedFixture(nature) as any
      );
      expect(((await EsignService.verifyByToken('tok')) as any).subject).toBeNull();
    }
  });

  it('naskah yang diubah setelah ditandatangani tidak lagi sah', async () => {
    const f = signedFixture('PUBLIC');
    f.letter.content = 'Isi yang sudah diubah diam-diam.';
    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(f as any);

    const r: any = await EsignService.verifyByToken('tok');
    expect(r.intact).toBe(false);
    expect(r.valid).toBe(false);
  });

  it('tanda tangan yang dicabut tidak sah walau naskahnya utuh', async () => {
    const f: any = signedFixture('PUBLIC');
    f.revokedAt = new Date();
    f.revokedReason = 'Diterbitkan keliru';
    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(f);

    const r: any = await EsignService.verifyByToken('tok');
    expect(r.intact).toBe(true);
    expect(r.revoked).toBe(true);
    expect(r.valid).toBe(false);
  });
});
