import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CorrespondenceService } from '../correspondence.service';
import { prisma } from '@/lib/prisma';
import { createKeyMaterial, signPayload, type SignablePayload } from '@/utils/esign';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    letterSignature: {
      findUnique: vi.fn(),
    },
  },
}));

const PASS = 'PassphraseTTE123!';

function signedFixture(nature: string, content = 'Isi naskah resmi.') {
  const m = createKeyMaterial(PASS);
  const signedAt = new Date('2026-08-01T00:00:00Z');
  const payload: SignablePayload = {
    letterId: 'let-1',
    letterNumber: '001/SK/Y-CPS/VIII/2026',
    date: new Date('2026-08-01T00:00:00Z'),
    type: 'SURAT_DINAS',
    nature,
    subject: 'Surat Keputusan Panitia',
    content,
    unitId: 'unit-1',
    signerId: 'user-1',
    signedAt,
  };
  const s = signPayload(m, PASS, payload);
  return {
    id: 'sig-1',
    verificationToken: 'valid-token',
    algorithm: s.algorithm,
    digest: s.digest,
    publicKey: s.publicKey,
    signature: s.signature,
    signedAt,
    revokedAt: null,
    signerId: 'user-1',
    signer: {
      name: 'Dr. H. Ahmad',
      teacher: { nip: '19800101' },
      staff: { nip: null, position: 'Kepala Sekolah' },
    },
    letter: {
      id: 'let-1',
      letterNumber: payload.letterNumber,
      agendaNumber: null,
      type: payload.type,
      nature,
      subject: payload.subject,
      content,
      unitId: payload.unitId,
      date: payload.date,
      status: 'SIGNED',
      unit: { name: 'SMA Al-Qur\'an' },
    },
  };
}

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
    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(signedFixture('PUBLIC') as any);

    const result = await CorrespondenceService.verifyPublicLetter('valid-token');

    expect(result.isValid).toBe(true);
    expect(result.isRevoked).toBe(false);
    expect(result.signer?.name).toBe('Dr. H. Ahmad');
    expect(result.signer?.nip).toBe('19800101');
    expect(result.letter?.letterNumber).toBe('001/SK/Y-CPS/VIII/2026');
    expect(result.letter?.subject).toBe('Surat Keputusan Panitia');
  });

  it('hides subject for confidential letters', async () => {
    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(signedFixture('CONFIDENTIAL') as any);

    const result = await CorrespondenceService.verifyPublicLetter('valid-token');

    expect(result.isValid).toBe(true);
    expect(result.letter?.subject).toBeNull();
  });

  it('returns isValid: false when letter content is modified after signing', async () => {
    const fixture = signedFixture('PUBLIC');
    fixture.letter.content = 'Isi naskah yang diubah setelah ditandatangani';
    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(fixture as any);

    const result = await CorrespondenceService.verifyPublicLetter('valid-token');

    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('diubah');
  });

  it('returns isRevoked: true and revokedAt date when signature is revoked', async () => {
    const revokedDate = new Date('2026-08-05');
    const fixture = signedFixture('PUBLIC') as any;
    fixture.revokedAt = revokedDate;
    fixture.revokedReason = 'Diterbitkan keliru';

    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(fixture);

    const result = await CorrespondenceService.verifyPublicLetter('revoked-token');

    expect(result.isValid).toBe(false);
    expect(result.isRevoked).toBe(true);
    expect(result.revokedAt).toEqual(revokedDate);
  });

  it('validates uploaded PDF buffer matching signature digest', async () => {
    const fixture = signedFixture('PUBLIC') as any;
    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(fixture);

    // Create buffer whose SHA-256 matches fixture.digest
    const pdfBuffer = Buffer.from('Matching PDF content');
    const crypto = await import('crypto');
    fixture.digest = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    const result = await CorrespondenceService.verifyPublicLetter('valid-token', pdfBuffer);

    expect(result.isValid).toBe(true);
    expect(result.pdfVerified).toBe(true);
    expect(result.pdfMatch).toBe(true);
  });

  it('returns pdfMatch=false and isValid=false when PDF contains token string but content/digest differs', async () => {
    const fixture = signedFixture('PUBLIC') as any;
    vi.mocked(prisma.letterSignature.findUnique).mockResolvedValue(fixture);

    // PDF contains verificationToken string but SHA-256 digest differs from fixture.digest
    const tamperedPdfBuffer = Buffer.from(`%PDF-1.4 Token: ${fixture.verificationToken} Tampered Content`);
    const result = await CorrespondenceService.verifyPublicLetter('valid-token', tamperedPdfBuffer);

    expect(result.isValid).toBe(false);
    expect(result.pdfVerified).toBe(true);
    expect(result.pdfMatch).toBe(false);
    expect(result.reason).toContain('PDF yang diunggah tidak cocok');
  });
});
