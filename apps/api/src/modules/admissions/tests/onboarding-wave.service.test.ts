import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentOnboardingOrchestrator } from '../../../services/integration/student-onboarding.orchestrator';
import { prisma } from '@/lib/prisma';
import * as admissionsService from '../admissions.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    registrant: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    admissionPeriod: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    admissionWave: {
      count: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    unit: {
      findUnique: vi.fn(),
    },
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    student: {
      create: vi.fn(),
    },
    studentParent: {
      create: vi.fn(),
    },
    userRoleAssignment: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    medicalRecord: {
      create: vi.fn(),
    },
    santriWallet: {
      create: vi.fn(),
    },
    classEnrollment: {
      create: vi.fn(),
    },
    roomAssignment: {
      create: vi.fn(),
    },
    paymentType: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    invoice: {
      create: vi.fn(),
    },
    $executeRaw: vi.fn().mockResolvedValue(1),
    $queryRaw: vi.fn().mockResolvedValue([{ max_seq: 10 }]),
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

vi.mock('@/lib/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_pwd'),
}));

vi.mock('@/utils/parent-scope', () => ({
  syncParentRoleAssignments: vi.fn().mockResolvedValue(undefined),
}));

describe('Student Onboarding & Wave Quota Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('StudentOnboardingOrchestrator.processEnrollment', () => {
    it('applies nis, nisn, classId, and roomId, and skips duplicate REG_FEE invoice when registration fee is already settled', async () => {
      const mockRegistrant = {
        id: 'reg-1',
        status: 'ACCEPTED',
        admissionPeriodId: 'period-1',
        fullName: 'Ahmad Santri',
        gender: 'MALE',
        birthPlace: 'Bandung',
        birthDate: new Date('2010-01-01'),
        address: 'Jl. Pesantren',
        parentName: 'Ayah Ahmad',
        parentPhone: '081234567890',
        parentEmail: 'ayah@gmail.com',
        registrationFeePaidAt: new Date(), // ALREADY SETTLED
      };

      const mockPeriod = {
        id: 'period-1',
        unitId: 'unit-1',
        registrationFee: 250000,
        academicYearId: 'ay-2026',
      };

      vi.mocked(prisma.registrant.findUnique).mockResolvedValue(mockRegistrant as any);
      vi.mocked(prisma.admissionPeriod.findUnique).mockResolvedValue(mockPeriod as any);
      vi.mocked(prisma.unit.findUnique).mockResolvedValue({ id: 'unit-1', type: 'SMP_IT' } as any);
      (vi.mocked(prisma.user.create) as any).mockResolvedValue({ id: 'u-1', name: 'Ahmad Santri' });
      (vi.mocked(prisma.student.create) as any).mockResolvedValue({ id: 's-1', nis: 'NIS-CUSTOM-001' });

      const result = await StudentOnboardingOrchestrator.processEnrollment(
        'reg-1',
        'unit-1',
        'admin-1',
        {
          nis: 'NIS-CUSTOM-001',
          nisn: '1234567890',
          classId: 'class-7a',
          roomId: 'room-101',
          academicYearId: 'ay-2026',
        }
      );

      expect(result.success).toBe(true);
      expect(result.nis).toBe('NIS-CUSTOM-001');

      // Verify Student creation received custom NIS and NISN
      expect(prisma.student.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nis: 'NIS-CUSTOM-001',
            nisn: '1234567890',
          }),
        })
      );

      // Verify Class Enrollment created
      expect(prisma.classEnrollment.create).toHaveBeenCalledWith({
        data: {
          studentId: 's-1',
          classId: 'class-7a',
          status: 'active',
        },
      });

      // Verify Room Assignment created
      expect(prisma.roomAssignment.create).toHaveBeenCalledWith({
        data: {
          studentId: 's-1',
          roomId: 'room-101',
          isActive: true,
        },
      });

      // Verify NO duplicate REG_FEE invoice was created because registrationFeePaidAt is set
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });
  });

  describe('Admissions Service - Atomic Wave Claim & Fallback', () => {
    it('falls back to wave 2 when wave 1 is full, and atomically increments wave 2 registeredCount', async () => {
      const mockPeriod = {
        id: 'period-1',
        academicYear: { name: '2026/2027' },
        unit: { name: 'SMP IT' },
        unitId: 'unit-1',
        registrationFee: 0,
      };

      const wave1Full = { id: 'w-1', waveNumber: 1, registeredCount: 50, quota: 50 };
      const wave2Open = { id: 'w-2', waveNumber: 2, registeredCount: 10, quota: 50 };

      vi.mocked(prisma.admissionPeriod.findUnique).mockResolvedValue(mockPeriod as any);
      vi.mocked(prisma.admissionWave.count).mockResolvedValue(2);
      vi.mocked(prisma.admissionWave.findMany).mockResolvedValue([wave1Full, wave2Open] as any);

      // Wave 2 increment claim returns count = 1
      vi.mocked(prisma.admissionWave.updateMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.registrant.count).mockResolvedValue(15);
      (vi.mocked(prisma.registrant.create) as any).mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: 'reg-new' })
      );

      const result = await admissionsService.createRegistrant({
        admissionPeriodId: 'period-1',
        fullName: 'Santri Baru',
        gender: 'MALE',
        birthPlace: 'Bandung',
        birthDate: new Date('2011-05-05').toISOString(),
        address: 'Alamat',
        fatherName: 'Ayah',
        motherName: 'Ibu',
      } as any);

      // Should be assigned to wave 2 (w-2) because wave 1 was full
      expect(result.waveId).toBe('w-2');
      expect(prisma.admissionWave.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'w-2',
          status: { in: ['OPEN', 'FULL'] },
          registeredCount: { lt: 50 },
        },
        data: { registeredCount: { increment: 1 }, status: 'OPEN' },
      });
    });

    it('claims a wave previously marked FULL if registeredCount is less than quota due to cancellation', async () => {
      const mockPeriod = {
        id: 'period-1',
        academicYear: { name: '2026/2027' },
        unit: { name: 'SMP IT' },
        unitId: 'unit-1',
        registrationFee: 0,
      };

      const wave1Freed = { id: 'w-1', waveNumber: 1, registeredCount: 49, quota: 50, status: 'FULL' };

      vi.mocked(prisma.admissionPeriod.findUnique).mockResolvedValue(mockPeriod as any);
      vi.mocked(prisma.admissionWave.count).mockResolvedValue(1);
      vi.mocked(prisma.admissionWave.findMany).mockResolvedValue([wave1Freed] as any);
      vi.mocked(prisma.admissionWave.updateMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.registrant.count).mockResolvedValue(15);
      (vi.mocked(prisma.registrant.create) as any).mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: 'reg-new' })
      );

      const result = await admissionsService.createRegistrant({
        admissionPeriodId: 'period-1',
        fullName: 'Santri Baru 2',
        gender: 'FEMALE',
        birthPlace: 'Bandung',
        birthDate: new Date('2011-05-05').toISOString(),
        address: 'Alamat',
        fatherName: 'Ayah',
        motherName: 'Ibu',
      } as any);

      expect(result.waveId).toBe('w-1');
      expect(prisma.admissionWave.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'w-1',
          status: { in: ['OPEN', 'FULL'] },
          registeredCount: { lt: 50 },
        },
        data: { registeredCount: { increment: 1 }, status: 'OPEN' },
      });
    });
  });
});
