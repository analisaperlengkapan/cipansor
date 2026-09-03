import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as service from '../admissions.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    admissionPeriod: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    registrant: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    paymentType: {
      findFirst: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    invoice: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    admissionWave: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

vi.mock('@prisma/client', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    Prisma: {
      ...actual.Prisma,
      Decimal: class {
        val: number;
        constructor(v: any) { this.val = Number(v); }
        toNumber() { return this.val; }
      },
      PrismaClientKnownRequestError: class extends Error {},
    },
  };
});

describe('Admissions Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.admissionWave.count as any).mockResolvedValue(0);
  });

  it('should reject document upload when registration token is invalid', async () => {
    vi.mocked(prisma.registrant.findUnique).mockResolvedValue({ id: 'reg123', registrationNo: 'REG-001' } as any);

    await expect(
      service.createPublicRegistrantDocumentService({
        registrantId: 'reg123',
        type: 'PHOTO',
        base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        registrationToken: 'invalid_token_123',
      })
    ).rejects.toThrow('Invalid registration token');
  });

  it('should reject document upload when timestamped registration token is expired (> 2 hours)', async () => {
    const crypto = await import('crypto');
    const { config } = await import('../../../config');
    const oldTimestamp = Date.now() - (3 * 60 * 60 * 1000); // 3 hours ago
    const tsHex = oldTimestamp.toString(16);
    const hmacHex = crypto.createHmac('sha256', config.jwt.secret).update(`reg123:${tsHex}`).digest('hex').slice(0, 16);
    const expiredToken = `${tsHex}.${hmacHex}`;

    vi.mocked(prisma.registrant.findUnique).mockResolvedValue({ id: 'reg123', registrationNo: 'REG-001' } as any);

    await expect(
      service.createPublicRegistrantDocumentService({
        registrantId: 'reg123',
        type: 'PHOTO',
        base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        registrationToken: expiredToken,
      })
    ).rejects.toThrow('Invalid registration token');
  });

  it('should reject document upload when base64 exceeds size limit', async () => {
    const crypto = await import('crypto');
    const { config } = await import('../../../config');
    const expectedToken = crypto.createHmac('sha256', config.jwt.secret).update('reg123').digest('hex').slice(0, 16);

    vi.mocked(prisma.registrant.findUnique).mockResolvedValue({ id: 'reg123', registrationNo: 'REG-001' } as any);

    const hugeBase64 = 'data:image/png;base64,' + 'A'.repeat(4500000);

    await expect(
      service.createPublicRegistrantDocumentService({
        registrantId: 'reg123',
        type: 'PHOTO',
        base64: hugeBase64,
        registrationToken: expectedToken,
      })
    ).rejects.toThrow('Ukuran berkas melebihi batas maksimum');
  });

  it('should reject registration when all waves for a period are full', async () => {
    const mockPeriod = {
      id: 'p1',
      academicYear: { name: '2024/2025' },
      unit: { name: 'SD IT' },
      unitId: 'u1',
      registrationFee: 100000
    };

    vi.mocked(prisma.admissionPeriod.findUnique).mockResolvedValue(mockPeriod as any);
    vi.mocked(prisma.admissionWave.count as any).mockResolvedValue(2); // Period has 2 waves
    vi.mocked(prisma.admissionWave.findMany as any).mockResolvedValue([
      { id: 'w1', quota: 10, registeredCount: 10 },
      { id: 'w2', quota: 10, registeredCount: 10 },
    ]);

    await expect(
      service.createRegistrant({
        admissionPeriodId: 'p1',
        fullName: 'Test Student',
        gender: 'MALE',
        birthPlace: 'Jakarta',
        birthDate: new Date().toISOString(),
        address: 'Test Address',
        fatherName: 'Father',
        motherName: 'Mother',
      } as any)
    ).rejects.toThrow('Semua gelombang pendaftaran pada periode ini telah penuh atau ditutup');
  });

  it('should generate registration number correctly and skip invoice creation at registration', async () => {
    const mockPeriod = {
      id: 'p1',
      academicYear: { name: '2024/2025' },
      unit: { name: 'SD IT' },
      unitId: 'u1',
      registrationFee: 100000
    };

    vi.mocked(prisma.admissionPeriod.findUnique).mockResolvedValue(mockPeriod as any);
    vi.mocked(prisma.registrant.count).mockResolvedValue(10);
    (vi.mocked(prisma.registrant.create) as any).mockImplementation(({ data }: any) => Promise.resolve({ ...data, id: 'r1' }));
    // REG_FEE payment type already exists, so no need to create one.
    vi.mocked(prisma.paymentType.findFirst).mockResolvedValue({ id: 'pt1' } as any);

    const result = await service.createRegistrant({
      admissionPeriodId: 'p1',
      fullName: 'Test Student',
      gender: 'MALE',
      birthPlace: 'Jakarta',
      birthDate: new Date().toISOString(),
      address: 'Test Address',
      fatherName: 'Father',
      motherName: 'Mother',
    } as any);

    // The registration number includes a 4-char period suffix derived from
    // the admissionPeriodId (with hyphens removed, uppercased, first 4 chars)
    // so two distinct periods in the same academic year cannot collide on the
    // globally-unique `registrationNo`. For id='p1' the suffix is 'P1'.
    expect(result.registrationNo).toBe('REG-2024-P1-00011');
    expect(result.fullName).toBe('Test Student');
    // Invoice creation is intentionally deferred to enrollment time, when a
    // real Student record exists. Creating it here would require a non-null
    // studentId that doesn't yet exist.
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });
});
