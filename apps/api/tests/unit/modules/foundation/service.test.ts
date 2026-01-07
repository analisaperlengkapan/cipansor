import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getFinancialSummary } from '@/modules/foundation/service';

// Hoist mocks
const mocks = vi.hoisted(() => ({
  unit: {
    findMany: vi.fn(),
  },
  journalEntry: {
    groupBy: vi.fn(),
  },
  accountCode: {
    findMany: vi.fn(),
  },
  $queryRaw: vi.fn(),
}));

// Mock the prisma instance directly
vi.mock('@/lib/prisma', () => ({
  prisma: {
    unit: mocks.unit,
    journalEntry: mocks.journalEntry,
    accountCode: mocks.accountCode,
    $queryRaw: mocks.$queryRaw,
  },
}));

describe('Foundation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFinancialSummary', () => {
    const foundationId = 'foundation-1';
    const endDate = new Date('2024-12-31');

    it('should return empty summary if no units found', async () => {
      mocks.unit.findMany.mockResolvedValue([]);

      const result = await getFinancialSummary(foundationId, endDate);

      expect(result.totalRevenue).toBe(0);
      expect(result.units).toHaveLength(0);
    });

    it('should calculate summary correctly', async () => {
      // Mock Units
      const units = [{ id: 'u1', name: 'Unit 1' }];
      mocks.unit.findMany.mockResolvedValue(units);

      // Mock GroupBy (Summary)
      // Revenue (Credit - Debit), Expense (Debit - Credit)
      // Unit 1: Rev Account (Credit 100), Exp Account (Debit 50)
      const groupByResult = [
        { unitId: 'u1', accountId: 'acc-rev', _sum: { debit: 0, credit: 100 } },
        { unitId: 'u1', accountId: 'acc-exp', _sum: { debit: 50, credit: 0 } },
      ];
      mocks.journalEntry.groupBy.mockResolvedValueOnce(groupByResult); // For overall summary

      // Mock Expense Composition (groupBy call)
      const expenseCompResult = [
        { accountId: 'acc-exp', _sum: { debit: 50, credit: 0 } }
      ];
      mocks.journalEntry.groupBy.mockResolvedValueOnce(expenseCompResult);

      // Mock Accounts
      const accounts = [
        { id: 'acc-rev', type: 'REVENUE', name: 'Tuition' },
        { id: 'acc-exp', type: 'EXPENSE', name: 'Salary' },
      ];
      mocks.accountCode.findMany.mockResolvedValue(accounts);

      // Mock Trends ($queryRaw)
      // Use BigInt for raw result simulation
      const trendsResult = [
        { month: '2024-01', type: 'REVENUE', debit: 0n, credit: 100n },
        { month: '2024-01', type: 'EXPENSE', debit: 50n, credit: 0n },
      ];
      mocks.$queryRaw.mockResolvedValue(trendsResult);

      const result = await getFinancialSummary(foundationId, endDate);

      // Assertions
      expect(result.totalRevenue).toBe(100);
      expect(result.totalExpense).toBe(50);
      expect(result.netIncome).toBe(50);

      // Trends
      const jan24 = result.trends.find(t => t.month === '2024-01');
      expect(jan24).toBeDefined();
      expect(jan24?.revenue).toBe(100);
      expect(jan24?.expense).toBe(50);

      // Expense Composition
      expect(result.expenseComposition).toHaveLength(1);
      expect(result.expenseComposition[0].category).toBe('Salary');
      expect(result.expenseComposition[0].amount).toBe(50);
    });

    it('should handle trends calculation errors gracefully', async () => {
      // Mock Units
      mocks.unit.findMany.mockResolvedValue([{ id: 'u1', name: 'Unit 1' }]);

      // Mock GroupBy (Summary) - Success
      mocks.journalEntry.groupBy.mockResolvedValueOnce([]);

      // Mock Accounts
      mocks.accountCode.findMany.mockResolvedValue([]);

      // Mock Trends ($queryRaw) - FAILURE
      mocks.$queryRaw.mockRejectedValue(new Error('Raw Query Error'));

      const result = await getFinancialSummary(foundationId, endDate);

      // Should still return summary data (zeros in this case)
      expect(result.totalRevenue).toBe(0);
      // But trends should be empty array
      expect(result.trends).toHaveLength(0);
    });
  });
});
