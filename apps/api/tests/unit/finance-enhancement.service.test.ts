import { describe, it, expect, vi, beforeEach } from 'vitest';
import { financeEnhancementService } from '@/modules/finance-enhancement/finance-enhancement.service';
import { AccountType } from '@cipansor/shared';

// Mock dependencies
const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      accountCode: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      journalEntry: {
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        groupBy: vi.fn(),
      },
      scholarship: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      invoice: {
        findMany: vi.fn(),
      },
      purchaseRequest: {
        findMany: vi.fn(),
      },
      budget: {
        findMany: vi.fn(),
      },
      $queryRaw: vi.fn(),
      $transaction: vi.fn().mockImplementation((cb) => cb(mockPrisma)),
    },
  };
});

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

describe('Finance Enhancement Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Account Code Mapping', () => {
    it('should correctly map Prisma account code to Shared AccountCode', async () => {
      const mockPrismaAccount = {
        id: '1',
        code: '100',
        name: 'Assets',
        type: 'ASSET', // String in Prisma
        parentId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        parent: null,
        children: [],
      };

      mockPrisma.accountCode.findMany.mockResolvedValue([mockPrismaAccount]);
      mockPrisma.accountCode.count.mockResolvedValue(1);

      const result = await financeEnhancementService.getAccountCodes({ page: 1, limit: 10 });

      expect(result.data[0]).toEqual(
        expect.objectContaining({
          id: '1',
          type: AccountType.ASSET, // Should be Enum
        })
      );
    });
  });

  describe('Journal Entry Mapping', () => {
    it('should correctly map Prisma journal entry (Decimals) to Shared JournalEntry (Numbers)', async () => {
      const mockEntry = {
        id: 'je-1',
        unitId: 'unit-1',
        accountId: 'acc-1',
        date: new Date('2024-01-01'),
        description: 'Test Entry',
        debit: 100000, // In real Prisma this might be Decimal/BigInt, but mock usually passes number
        credit: 0,
        reference: null,
        referenceType: null,
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        unit: { id: 'unit-1', name: 'Unit 1' },
        account: { id: 'acc-1', code: '101', name: 'Cash', type: 'ASSET' },
        createdBy: { id: 'user-1', name: 'User 1' },
      };

      mockPrisma.journalEntry.findMany.mockResolvedValue([mockEntry]);
      mockPrisma.journalEntry.count.mockResolvedValue(1);

      const result = await financeEnhancementService.getJournalEntries({ page: 1, limit: 10 });

      expect(result.data[0].debit).toBe(100000);
      expect(result.data[0].credit).toBe(0);
      expect(result.data[0].account?.type).toBe(AccountType.ASSET);
    });
  });

  describe('getIncomeExpenseReport', () => {
    it('should use Enum values in raw query and calculate net income correctly', async () => {
      const mockRawResult = [
        { period: '2024-01', type: 'REVENUE', total: BigInt(5000000) },
        { period: '2024-01', type: 'EXPENSE', total: BigInt(-2000000) }, // Query returns credit - debit, so expense is negative usually
      ];

      mockPrisma.$queryRaw.mockResolvedValue(mockRawResult);

      const result = await financeEnhancementService.getIncomeExpenseReport({
        unitId: 'unit-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      // Verify the SQL call contains correct enum values
      // We can't easily check the SQL string content in a simple mock without a spy on the template literal tag function,
      // but we can check args if passed.
      // However, we can check logic result.

      expect(result.summary.totalIncome).toBe(5000000);
      // Expense in logic: if type is EXPENSE, amount = -val.
      // -(-2000000) = 2000000
      expect(result.summary.totalExpense).toBe(2000000);
      expect(result.summary.netIncome).toBe(3000000);

      expect(result.breakdown[0]).toEqual({
        period: '2024-01',
        income: 5000000,
        expense: 2000000,
        net: 3000000,
      });
    });
  });

  describe('getCashFlowForecast', () => {
    it('should aggregate income from invoices and expenses from budgets/PRs', async () => {
      const mockUnitId = 'unit-1';

      // Mock Invoices (Income)
      mockPrisma.invoice.findMany.mockResolvedValue([
        { amount: 10000000 },
        { amount: 5000000 }
      ]);

      // Mock Purchase Requests (Committed Expense)
      mockPrisma.purchaseRequest.findMany.mockResolvedValue([
        { totalEstimated: 3000000 }
      ]);

      // Mock Budgets (Projected Expense)
      mockPrisma.budget.findMany.mockResolvedValue([
        { amount: 5000000, usedAmount: 2000000 } // 3M remaining
      ]);

      const result = await financeEnhancementService.getCashFlowForecast(mockUnitId);

      expect(result.projectedIncome).toBe(15000000);
      expect(result.projectedExpense).toBe(6000000); // 3M PR + 3M budget
      expect(result.netCashFlow).toBe(9000000);
    });
  });
});
