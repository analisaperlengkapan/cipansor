import { describe, it, expect, vi, beforeEach } from 'vitest';
import { payrollService } from './service';
import { prisma } from '../../lib/prisma';
import { PayrollStatus } from '@prisma/client';

// Mock prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    payrollPeriod: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    staff: {
      findMany: vi.fn(),
    },
    salaryComponent: {
      findMany: vi.fn(),
    },
    staffAttendance: {
      groupBy: vi.fn(),
    },
    payroll: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    payrollItem: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('PayrollService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generate', () => {
    it('should throw error if period not found', async () => {
      vi.mocked(prisma.payrollPeriod.findUnique).mockResolvedValue(null);

      await expect(
        payrollService.generate({ periodId: 'period-1', overwrite: false })
      ).rejects.toThrow('Periode penggajian tidak ditemukan');
    });

    it('should throw error if period is not DRAFT', async () => {
      vi.mocked(prisma.payrollPeriod.findUnique).mockResolvedValue({
        id: 'period-1',
        status: 'APPROVED',
      } as any);

      await expect(
        payrollService.generate({ periodId: 'period-1', overwrite: false })
      ).rejects.toThrow('Hanya periode DRAFT yang dapat digenerate');
    });

    it('should generate payroll for eligible staff', async () => {
      // Mock Period
      vi.mocked(prisma.payrollPeriod.findUnique).mockResolvedValue({
        id: 'period-1',
        unitId: 'unit-1',
        status: 'DRAFT',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
      } as any);

      // Mock Staff
      vi.mocked(prisma.staff.findMany).mockResolvedValue([
        {
          id: 'staff-1',
          user: { name: 'Employee 1' },
          employeeSalary: {
            baseSalary: 5000000,
            items: [],
            taxStatus: 'TK/0',
          },
        },
      ] as any);

      // Mock Components
      vi.mocked(prisma.salaryComponent.findMany).mockResolvedValue([
        { id: 'comp-1', code: 'GAJI_POKOK', name: 'Gaji Pokok', type: 'EARNING', isTaxable: true },
      ] as any);

      // Mock Attendance
      vi.mocked(prisma.staffAttendance.groupBy).mockResolvedValue([]);

      // Mock Transaction aggregation
      vi.mocked(prisma.payroll.aggregate).mockResolvedValue({
        _sum: { netSalary: 100 },
        _count: 1,
      } as any);

      // Mock Create
      vi.mocked(prisma.payroll.create).mockResolvedValue({ id: 'payroll-1' } as any);

      // Execute
      const result = await payrollService.generate({ periodId: 'period-1', overwrite: false });

      // Verify
      expect(result.created).toBe(1);
      expect(prisma.payroll.create).toHaveBeenCalled();
      expect(prisma.payrollItem.createMany).toHaveBeenCalled();
    });
  });
});
