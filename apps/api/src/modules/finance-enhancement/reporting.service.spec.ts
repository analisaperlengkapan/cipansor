
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies BEFORE importing the SUT
vi.mock('../../lib/prisma', () => ({
  prisma: {
    accountCode: {
      findMany: vi.fn(),
    },
    journalEntry: {
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

vi.mock('@cipansor/shared', () => ({
  AccountType: {
    REVENUE: 'REVENUE',
    EXPENSE: 'EXPENSE',
    ASSET: 'ASSET',
    LIABILITY: 'LIABILITY',
    EQUITY: 'EQUITY',
  },
  CashFlowCategory: {
    OPERATING: 'OPERATING',
    INVESTING: 'INVESTING',
    FINANCING: 'FINANCING',
  }
}));

import { getStatementOfActivities } from './reporting.service';
import { prisma } from '../../lib/prisma';
import { AccountType } from '@cipansor/shared';

describe('Reporting Service (ISAK 35)', () => {
  const mockStartDate = new Date('2024-01-01');
  const mockEndDate = new Date('2024-12-31');
  const mockUnitId = 'unit-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStatementOfActivities', () => {
    it('should correctly classify restricted and unrestricted revenues and expenses', async () => {
      // Mock Accounts
      // Using 'any' cast to bypass strict Prisma type checks in mock if necessary,
      // but ensuring runtime structure is correct.
      vi.mocked(prisma.accountCode.findMany).mockResolvedValue([
        { id: 'acc-1', code: '4101', name: 'Pendapatan SPP', type: AccountType.REVENUE, isActive: true, parentId: null, normalBalance: 'CREDIT', cashFlowCategory: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
        { id: 'acc-2', code: '4201', name: 'Hibah Terikat Gedung', type: AccountType.REVENUE, isActive: true, parentId: null, normalBalance: 'CREDIT', cashFlowCategory: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
        { id: 'acc-3', code: '5101', name: 'Beban Gaji', type: AccountType.EXPENSE, isActive: true, parentId: null, normalBalance: 'DEBIT', cashFlowCategory: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
        { id: 'acc-4', code: '5201', name: 'Beban Pembangunan (Terikat)', type: AccountType.EXPENSE, isActive: true, parentId: null, normalBalance: 'DEBIT', cashFlowCategory: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      ] as any);

      const mockDecimal = (val: number) => ({ toNumber: () => val });

      // @ts-ignore
      vi.mocked(prisma.journalEntry.groupBy).mockResolvedValue([
        { accountId: 'acc-1', _sum: { debit: mockDecimal(0), credit: mockDecimal(1000) } },
        { accountId: 'acc-2', _sum: { debit: mockDecimal(0), credit: mockDecimal(500) } },
        { accountId: 'acc-3', _sum: { debit: mockDecimal(400), credit: mockDecimal(0) } },
        { accountId: 'acc-4', _sum: { debit: mockDecimal(200), credit: mockDecimal(0) } },
      ]);

      const report = await getStatementOfActivities(mockUnitId, mockStartDate, mockEndDate);

      // Verify Revenue Classification
      expect(report.revenues.unrestricted.items).toHaveLength(1);
      expect(report.revenues.unrestricted.items[0].code).toBe('4101');
      expect(report.revenues.unrestricted.total).toBe(1000);

      expect(report.revenues.restricted.items).toHaveLength(1);
      expect(report.revenues.restricted.items[0].code).toBe('4201');
      expect(report.revenues.restricted.total).toBe(500);

      // Verify Expense Classification
      expect(report.expenses.unrestricted.items).toHaveLength(1);
      expect(report.expenses.unrestricted.total).toBe(400);

      expect(report.expenses.restricted.items).toHaveLength(1);
      expect(report.expenses.restricted.total).toBe(200);

      // Verify Net Assets Change
      expect(report.changeInNetAssets.unrestricted).toBe(600);
      expect(report.changeInNetAssets.restricted).toBe(300);
      expect(report.changeInNetAssets.total).toBe(900);
    });
  });
});
