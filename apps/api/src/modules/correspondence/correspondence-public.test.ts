import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CorrespondenceService } from './correspondence.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    letterSignature: {
      findUnique: vi.fn(),
    },
  },
}));

describe('CorrespondenceService - Public Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns isValid: false when signature token is not found', async () => {
    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(null as any);

    const result = await CorrespondenceService.verifyPublicLetter('invalid-token');

    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('tidak ditemukan');
  });

  it('returns valid signature details when token is found and not revoked', async () => {
    const mockSignature = {
      id: 'sig-1',
      verificationToken: 'valid-token',
      algorithm: 'SHA256withRSA',
      digest: 'digest123',
      signedAt: new Date('2026-08-01'),
      revokedAt: null,
      signer: {
        name: 'Dr. H. Ahmad',
        email: 'ahmad@cipansor.or.id',
        teacher: { nip: '19800101', position: 'Kepala Sekolah' },
        staff: null,
      },
      letter: {
        id: 'let-1',
        letterNumber: '001/SK/Y-CPS/VIII/2026',
        agendaNumber: null,
        subject: 'Surat Keputusan Panitia',
        date: new Date('2026-08-01'),
        status: 'SIGNED',
        unit: { name: 'SMA Al-Qur\'an', code: 'SMAQ' },
      },
    };

    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(mockSignature as any);

    const result = await CorrespondenceService.verifyPublicLetter('valid-token');

    expect(result.isValid).toBe(true);
    expect(result.isRevoked).toBe(false);
    expect(result.signer.name).toBe('Dr. H. Ahmad');
    expect(result.signer.nip).toBe('19800101');
    expect(result.letter.letterNumber).toBe('001/SK/Y-CPS/VIII/2026');
  });

  it('returns isRevoked: true and revokedAt date when signature is revoked', async () => {
    const revokedDate = new Date('2026-08-05');
    const mockSignature = {
      id: 'sig-2',
      verificationToken: 'revoked-token',
      algorithm: 'SHA256withRSA',
      digest: 'digest456',
      signedAt: new Date('2026-08-01'),
      revokedAt: revokedDate,
      signer: {
        name: 'H. Ustadz Abdullah',
        email: 'abdullah@cipansor.or.id',
        teacher: null,
        staff: { nip: '19750202', position: 'Sekretaris' },
      },
      letter: {
        id: 'let-2',
        letterNumber: '002/ED/Y-CPS/VIII/2026',
        agendaNumber: null,
        subject: 'Edaran Santri Baru',
        date: new Date('2026-08-01'),
        status: 'SIGNED',
        unit: { name: 'Yayasan Pesantren Cipansor', code: 'YPS' },
      },
    };

    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(mockSignature as any);

    const result = await CorrespondenceService.verifyPublicLetter('revoked-token');

    expect(result.isValid).toBe(false);
    expect(result.isRevoked).toBe(true);
    expect(result.revokedAt).toEqual(revokedDate);
  });
});
