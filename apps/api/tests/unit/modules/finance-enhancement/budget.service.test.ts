import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBudget, updateBudget, getBudgets } from '../../../../src/modules/finance-enhancement/budget.service';
import { prisma } from '../../../../src/lib/prisma';
import { Prisma } from '@prisma/client';

// Mock Prisma
vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    budget: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    journalEntry: {
      aggregate: vi.fn(),
    },
  },
}));

describe('Budget Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a budget successfully', async () => {
    const input = {
      unitId: 'unit-1',
      academicYearId: 'year-1',
      accountId: 'acc-1',
      amount: 1000000,
      periodType: 'YEARLY' as const,
      createdById: 'user-1',
    };

    const mockCreatedBudget = {
      id: 'budget-1',
      ...input,
      amount: new Prisma.Decimal(input.amount),
      usedAmount: new Prisma.Decimal(0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.budget.findUnique as any).mockResolvedValue(null);
    (prisma.budget.create as any).mockResolvedValue(mockCreatedBudget);

    const result = await createBudget(input);

    expect(prisma.budget.findUnique).toHaveBeenCalledWith({
      where: {
        unitId_academicYearId_accountId: {
          unitId: input.unitId,
          academicYearId: input.academicYearId,
          accountId: input.accountId
        }
      }
    });

    expect(prisma.budget.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        amount: new Prisma.Decimal(input.amount)
      })
    }));

    expect(result).toEqual(mockCreatedBudget);
  });

  it('should throw error if budget already exists', async () => {
    (prisma.budget.findUnique as any).mockResolvedValue({ id: 'existing' });

    await expect(createBudget({
      unitId: 'unit-1',
      academicYearId: 'year-1',
      accountId: 'acc-1',
      amount: 1000000,
      createdById: 'user-1',
    })).rejects.toThrow('Budget for this account and academic year already exists');
  });

  it('should get budgets with correct transformation', async () => {
    const mockBudgets = [
      {
        id: '1',
        unitId: 'unit-1',
        accountId: 'acc-1',
        amount: new Prisma.Decimal(1000),
        academicYear: { startDate: new Date(), endDate: new Date() }
      }
    ];

    (prisma.budget.findMany as any).mockResolvedValue(mockBudgets);
    (prisma.budget.count as any).mockResolvedValue(1);

    // Mock aggregate for usage calculation
    (prisma.journalEntry.aggregate as any).mockResolvedValue({
      _sum: { debit: new Prisma.Decimal(200), credit: new Prisma.Decimal(0) }
    });

    const result = await getBudgets({});

    expect(result.data[0].amount).toBe(1000);
    expect(result.data[0].usedAmount).toBe(200);
  });
});
