import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as service from '../service';
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
    },
    invoice: {
      create: vi.fn(),
      findFirst: vi.fn(),
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
  });

  it('should generate registration number correctly and create invoice', async () => {
    const mockPeriod = {
      id: 'p1',
      academicYear: { name: '2024/2025' },
      unit: { name: 'SD IT' },
      unitId: 'u1',
      registrationFee: 100000
    };

    vi.mocked(prisma.admissionPeriod.findUnique).mockResolvedValue(mockPeriod as any);
    vi.mocked(prisma.registrant.count).mockResolvedValue(10);
    vi.mocked(prisma.registrant.create).mockImplementation(({ data }: any) => Promise.resolve({ ...data, id: 'r1' }));
    vi.mocked(prisma.paymentType.findFirst).mockResolvedValue({ id: 'pt1' } as any);
    vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null);

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

    expect(result.registrationNo).toBe('REG-2024-00011');
    expect(result.fullName).toBe('Test Student');
    expect(prisma.invoice.create).toHaveBeenCalled();
  });
});
