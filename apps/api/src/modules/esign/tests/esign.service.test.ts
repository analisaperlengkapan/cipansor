import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EsignService } from '../esign.service';
import { prisma } from '@/lib/prisma';
import { computePdfHash, createKeyMaterial, signPdfHash } from '@/utils/esign';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    letter: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    letterSignature: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    userSigningKey: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    letterReviewer: {
      update: vi.fn(),
    },
    letterFlowEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('EsignService PDF Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify signed PDF as valid when hash matches', async () => {
    const pdfBuffer = Buffer.from('Official Letter Document PDF Content', 'utf8');
    const pdfHash = computePdfHash(pdfBuffer);

    const passphrase = 'SecretPassphrase123!';
    const keyMaterial = createKeyMaterial(passphrase);
    const pdfSig = signPdfHash(keyMaterial, passphrase, pdfHash);

    vi.mocked(prisma.letterSignature.findMany).mockResolvedValue([
      {
        id: 'sig-1',
        publicKey: keyMaterial.publicKey,
        pdfHash: pdfHash,
        pdfSignature: pdfSig,
        revokedAt: null,
        signedAt: new Date(),
        signer: { name: 'Ketua Yayasan' },
        letter: {
          id: 'letter-1',
          letterNumber: '001/Y-CPS/2026',
          date: new Date(),
          type: 'SURAT_DINAS',
          nature: 'PUBLIC',
          subject: 'Permohonan Kerjasama',
          content: 'Isi Surat',
          unitId: 'unit-1',
          unit: { name: 'Yayasan' },
        },
      },
    ] as any);

    const result = await EsignService.verifyPdf(pdfBuffer);
    expect(result.found).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.signerName).toBe('Ketua Yayasan');
  });

  it('should reject modified PDF document', async () => {
    const originalBuffer = Buffer.from('Original Content', 'utf8');
    const pdfHash = computePdfHash(originalBuffer);

    vi.mocked(prisma.letterSignature.findMany).mockResolvedValue([
      {
        id: 'sig-1',
        pdfHash: pdfHash,
        revokedAt: null,
      },
    ] as any);

    const tamperedBuffer = Buffer.from('Tampered Content', 'utf8');
    const result = await EsignService.verifyPdf(tamperedBuffer);
    expect(result.found).toBe(false);
    expect(result.valid).toBe(false);
  });
});
