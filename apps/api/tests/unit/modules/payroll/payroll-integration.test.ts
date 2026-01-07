import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayrollStatus } from '@prisma/client';

// Use vi.hoisted to ensure mock object is initialized before imports
const mockPrisma = vi.hoisted(() => ({
  payrollPeriod: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  payroll: {
    updateMany: vi.fn(),
    aggregate: vi.fn(),
  },
  accountCode: {
    findFirst: vi.fn(),
  },
  journalEntry: {
    create: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
}));

// Mock @prisma/client because src/lib/prisma.ts uses `new PrismaClient()`
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma), // Ensure this returns our mock instance
  Prisma: {
    Decimal: class {
      constructor(val) { this.val = val; }
      toNumber() { return Number(this.val); }
    }
  },
  SalaryComponentType: {
    EARNING: 'EARNING',
    DEDUCTION: 'DEDUCTION'
  },
  PayrollStatus: {
    DRAFT: 'DRAFT',
    APPROVED: 'APPROVED',
    PAID: 'PAID',
    CANCELLED: 'CANCELLED'
  },
  AccountType: {
    ASSET: 'ASSET',
    LIABILITY: 'LIABILITY',
    EQUITY: 'EQUITY',
    REVENUE: 'REVENUE',
    EXPENSE: 'EXPENSE',
  }
}));

// Mock prisma lib with correct relative path
vi.mock('../../../../src/lib/prisma', () => ({
  prisma: mockPrisma
}));

// Import service AFTER mock
import { payrollPeriodService } from '../../../../src/modules/payroll/service';

describe('Payroll Period Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('markAsPaid', () => {
    it('should mark payroll period as paid and create journal entries', async () => {
      // Setup mock data
      const periodId = 'period-1';
      const unitId = 'unit-1';
      const payDate = new Date();
      const totalAmount = 50000000;

      const mockPeriod = {
        id: periodId,
        unitId: unitId,
        status: PayrollStatus.APPROVED,
        name: 'Gaji Januari 2025',
      };

      const mockSalaryExpenseAccount = { id: 'acc-expense-1' };
      const mockCashAccount = { id: 'acc-asset-1' };

      // Configure mocks - using any casting to avoid TS errors on mocks
      (mockPrisma.payrollPeriod.findUnique as any).mockResolvedValue(mockPeriod);

      const findFirstMock = mockPrisma.accountCode.findFirst as any;
      findFirstMock
        .mockResolvedValueOnce(mockSalaryExpenseAccount) // Salary Expense
        .mockResolvedValueOnce(mockCashAccount); // Cash Asset

      (mockPrisma.payroll.aggregate as any).mockResolvedValue({
        _sum: { netSalary: totalAmount }
      });

      // Execute
      await payrollPeriodService.markAsPaid(periodId, payDate);

      // Verify
      expect(mockPrisma.payroll.updateMany).toHaveBeenCalledWith({
        where: { periodId, status: PayrollStatus.APPROVED },
        data: { status: PayrollStatus.PAID },
      });

      // Verify Journal Entries creation
      expect(mockPrisma.journalEntry.create).toHaveBeenCalledTimes(2);

      // Debit Salary Expense
      expect(mockPrisma.journalEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          unitId,
          accountId: mockSalaryExpenseAccount.id,
          debit: totalAmount,
          credit: 0,
          reference: periodId,
          referenceType: 'PAYROLL',
        }),
      });

      // Credit Cash
      expect(mockPrisma.journalEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          unitId,
          accountId: mockCashAccount.id,
          debit: 0,
          credit: totalAmount,
          reference: periodId,
          referenceType: 'PAYROLL',
        }),
      });

      // Update Period Status
      expect(mockPrisma.payrollPeriod.update).toHaveBeenCalledWith({
        where: { id: periodId },
        data: expect.objectContaining({
          status: PayrollStatus.PAID,
          payDate,
        }),
      });
    });

    it('should throw error if period not found', async () => {
      (mockPrisma.payrollPeriod.findUnique as any).mockResolvedValue(null);

      await expect(payrollPeriodService.markAsPaid('invalid-id', new Date()))
        .rejects.toThrow('Periode penggajian tidak ditemukan');
    });

    it('should throw error if period is not APPROVED', async () => {
      (mockPrisma.payrollPeriod.findUnique as any).mockResolvedValue({
        id: 'period-1',
        status: PayrollStatus.DRAFT,
      });

      await expect(payrollPeriodService.markAsPaid('period-1', new Date()))
        .rejects.toThrow('Hanya periode APPROVED yang dapat dibayar');
    });
  });
});
