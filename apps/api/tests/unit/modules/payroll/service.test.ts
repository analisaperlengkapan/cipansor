import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { payrollPeriodService } from '@/modules/payroll/service';

// Hoist mocks
const mocks = vi.hoisted(() => ({
  payrollPeriod: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  payroll: {
    updateMany: vi.fn(),
  },
  accountCode: {
    findFirst: vi.fn(),
  },
  journalEntry: {
    create: vi.fn(),
  },
}));

// Mock the prisma instance directly
vi.mock('@/lib/prisma', () => ({
  prisma: {
    payrollPeriod: mocks.payrollPeriod,
    payroll: mocks.payroll,
    accountCode: mocks.accountCode,
    journalEntry: mocks.journalEntry,
    // Simple transaction mock that immediately executes callback with the same mock object
    $transaction: vi.fn(async (callback) => callback({
      payrollPeriod: mocks.payrollPeriod,
      payroll: mocks.payroll,
      accountCode: mocks.accountCode,
      journalEntry: mocks.journalEntry,
    })),
  },
}));

describe('Payroll Period Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('markAsPaid', () => {
    const periodId = 'period-1';
    const payDate = new Date();
    const mockPeriod = {
      id: periodId,
      status: 'APPROVED',
      totalAmount: 1000000,
      month: 1,
      year: 2024,
      unitId: 'unit-1',
      createdById: 'user-1',
      notes: 'Test notes',
    };

    it('should mark period as paid and create journal entries if accounts found', async () => {
      // Setup
      mocks.payrollPeriod.findUnique.mockResolvedValue(mockPeriod);

      const mockExpenseAccount = { id: 'acc-exp', code: '5101' };
      const mockAssetAccount = { id: 'acc-asset', code: '1101' };

      mocks.accountCode.findFirst
        .mockResolvedValueOnce(mockExpenseAccount)
        .mockResolvedValueOnce(mockAssetAccount);

      mocks.payrollPeriod.update.mockResolvedValue({
        ...mockPeriod,
        status: 'PAID',
      });

      // Execute
      await payrollPeriodService.markAsPaid(periodId, payDate);

      // Verify
      expect(prisma.$transaction).toHaveBeenCalled();

      expect(mocks.payroll.updateMany).toHaveBeenCalledWith({
        where: { periodId, status: 'APPROVED' },
        data: { status: 'PAID' },
      });

      expect(mocks.payrollPeriod.update).toHaveBeenCalledWith({
        where: { id: periodId },
        data: {
          status: 'PAID',
          payDate,
          paidAt: expect.any(Date),
          notes: mockPeriod.notes,
        },
      });

      expect(mocks.journalEntry.create).toHaveBeenCalledTimes(2);
    });

    it('should mark as paid but NOT create journal entries if accounts NOT found', async () => {
      mocks.payrollPeriod.findUnique.mockResolvedValue(mockPeriod);
      mocks.accountCode.findFirst.mockResolvedValue(null);
      mocks.payrollPeriod.update.mockResolvedValue({ ...mockPeriod, status: 'PAID' });

      await payrollPeriodService.markAsPaid(periodId, payDate);

      expect(mocks.payrollPeriod.update).toHaveBeenCalled();
      expect(mocks.journalEntry.create).not.toHaveBeenCalled();
    });

    it('should throw error if period not found', async () => {
      mocks.payrollPeriod.findUnique.mockResolvedValue(null);
      await expect(payrollPeriodService.markAsPaid(periodId, payDate))
        .rejects.toThrow('Periode penggajian tidak ditemukan');
    });

    it('should throw error if period not approved', async () => {
      mocks.payrollPeriod.findUnique.mockResolvedValue({ ...mockPeriod, status: 'DRAFT' });
      await expect(payrollPeriodService.markAsPaid(periodId, payDate))
        .rejects.toThrow('Hanya periode APPROVED yang dapat dibayar');
    });
  });
});
