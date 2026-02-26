import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import * as budgetService from './budget.service';

// Mock Prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    budget: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    journalEntry: {
      groupBy: vi.fn(),
    },
    purchaseRequestItem: {
      count: vi.fn(),
    },
    academicYear: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((arg) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg); // Handle array of promises
      }
      return arg(prisma); // Handle callback
    }),
  },
}));

describe('Budget Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBudget', () => {
    it('should create a budget if it does not exist', async () => {
      const dto = {
        unitId: 'unit-1',
        academicYearId: 'year-1',
        accountId: 'acc-1',
        amount: 1000000,
        periodType: 'YEARLY' as const,
        notes: 'Test Budget',
        createdById: 'user-1',
      };

      vi.mocked(prisma.budget.findUnique).mockResolvedValue(null);
      const mockCreated = { id: 'budget-1', ...dto, amount: new Prisma.Decimal(1000000) };
      vi.mocked(prisma.budget.create).mockResolvedValue(mockCreated as any);

      const result = await budgetService.createBudget(dto);

      expect(prisma.budget.findUnique).toHaveBeenCalledWith({
        where: {
          unitId_academicYearId_accountId: {
            unitId: dto.unitId,
            academicYearId: dto.academicYearId,
            accountId: dto.accountId,
          },
        },
      });

      expect(prisma.budget.create).toHaveBeenCalledWith({
        data: {
          unit: { connect: { id: dto.unitId } },
          academicYear: { connect: { id: dto.academicYearId } },
          account: { connect: { id: dto.accountId } },
          amount: new Prisma.Decimal(dto.amount),
          periodType: dto.periodType,
          notes: dto.notes,
          createdBy: { connect: { id: dto.createdById } },
        },
        include: {
          account: true,
          academicYear: { select: { id: true, name: true } },
        },
      });

      expect(result).toEqual(mockCreated);
    });

    it('should throw error if budget already exists', async () => {
      vi.mocked(prisma.budget.findUnique).mockResolvedValue({ id: 'existing' } as any);

      await expect(
        budgetService.createBudget({
          unitId: 'unit-1',
          academicYearId: 'year-1',
          accountId: 'acc-1',
          amount: 100,
          createdById: 'user-1',
        })
      ).rejects.toThrow('Budget for this account and academic year already exists');
    });
  });

  describe('updateBudget', () => {
    it('should update budget amount', async () => {
      const id = 'budget-1';
      const dto = { amount: 2000000 };

      vi.mocked(prisma.budget.update).mockResolvedValue({ id, amount: new Prisma.Decimal(2000000) } as any);

      await budgetService.updateBudget(id, dto);

      expect(prisma.budget.update).toHaveBeenCalledWith({
        where: { id },
        data: { amount: new Prisma.Decimal(2000000) },
        include: expect.any(Object),
      });
    });
  });

  describe('deleteBudget', () => {
    it('should delete budget if no usage and no PRs', async () => {
      const id = 'budget-1';
      vi.mocked(prisma.purchaseRequestItem.count).mockResolvedValue(0);
      vi.mocked(prisma.budget.deleteMany).mockResolvedValue({ count: 1 });

      const result = await budgetService.deleteBudget(id);

      expect(prisma.purchaseRequestItem.count).toHaveBeenCalledWith({ where: { budgetId: id } });
      expect(prisma.budget.deleteMany).toHaveBeenCalledWith({
        where: { id, usedAmount: { equals: 0 } },
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw error if referenced by PR', async () => {
      vi.mocked(prisma.purchaseRequestItem.count).mockResolvedValue(1);
      await expect(budgetService.deleteBudget('budget-1')).rejects.toThrow(
        'Cannot delete budget referenced by Purchase Requests'
      );
    });

    it('should throw error if used amount > 0', async () => {
      vi.mocked(prisma.purchaseRequestItem.count).mockResolvedValue(0);
      vi.mocked(prisma.budget.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.budget.findUnique).mockResolvedValue({ id: 'budget-1', usedAmount: new Prisma.Decimal(100) } as any);

      await expect(budgetService.deleteBudget('budget-1')).rejects.toThrow(
        'Cannot delete budget with existing usage'
      );
    });
  });

  describe('recalculateBudgetUsage', () => {
    it('should recalculate usage correctly based on journals', async () => {
      const unitId = 'unit-1';
      const academicYearId = 'year-1';

      // Mock Academic Year
      vi.mocked(prisma.academicYear.findUnique).mockResolvedValue({
        id: academicYearId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      } as any);

      // Mock Budgets
      const budgets = [
        { id: 'b1', accountId: 'acc-expense', account: { normalBalance: 'DEBIT' } },
        { id: 'b2', accountId: 'acc-revenue', account: { normalBalance: 'CREDIT' } },
      ];
      vi.mocked(prisma.budget.findMany).mockResolvedValue(budgets as any);

      // Mock Journal Aggregates
      const aggregates = [
        { accountId: 'acc-expense', _sum: { debit: new Prisma.Decimal(500), credit: new Prisma.Decimal(100) } }, // Net Debit 400
        { accountId: 'acc-revenue', _sum: { debit: new Prisma.Decimal(50), credit: new Prisma.Decimal(1000) } }, // Net Credit 950
      ];
      vi.mocked(prisma.journalEntry.groupBy).mockResolvedValue(aggregates as any);

      // Mock Transaction
      vi.mocked(prisma.$transaction).mockResolvedValue([
        { id: 'b1', usedAmount: new Prisma.Decimal(400) },
        { id: 'b2', usedAmount: new Prisma.Decimal(950) },
      ] as any);

      const result = await budgetService.recalculateBudgetUsage(unitId, academicYearId);

      expect(prisma.journalEntry.groupBy).toHaveBeenCalled();

      // Verify updates
      // Expense (Debit Normal): Used = Debit - Credit = 500 - 100 = 400
      // Revenue (Credit Normal): Used = Credit - Debit = 1000 - 50 = 950

      // Since we can't easily inspect the array passed to $transaction with exactness because it's creating promises inside map,
      // we trust the logic if the test passes execution flow.
      // But we can verify the call count of what would be inside.
      // Actually, budget.service.ts calls prisma.budget.update inside the map, but it does NOT await them individually.
      // It passes the array of promises to $transaction.
      // Wait, in budget.service.ts:
      // const updates = budgets.map(...) -> returns array of Prisma Promises (which are "thenables")
      // await prisma.$transaction(updates)

      // So prisma.budget.update IS called synchronously to generate the promise object.

      expect(prisma.budget.update).toHaveBeenCalledTimes(2);
      expect(prisma.budget.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: { usedAmount: new Prisma.Decimal(400) },
      });
      expect(prisma.budget.update).toHaveBeenCalledWith({
        where: { id: 'b2' },
        data: { usedAmount: new Prisma.Decimal(950) },
      });

      expect(result).toEqual({ count: 2 });
    });
  });
});
