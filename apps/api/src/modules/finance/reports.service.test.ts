import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as reportsService from './reports.service';
import { prisma } from '../../lib/prisma';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    accountCode: {
      findMany: vi.fn(),
    },
    journalEntry: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    businessUnit: {
      findMany: vi.fn(),
    },
    budget: {
      findMany: vi.fn(),
    },
    reportNote: {
      findMany: vi.fn(),
    },
    reportTemplate: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock accounting.service dependency for getTrialBalance
vi.mock('./accounting.service', () => ({
  getTrialBalance: vi.fn().mockResolvedValue([]),
  getIncomeStatement: vi.fn().mockResolvedValue({ totalRevenue: 0, totalExpense: 0, netIncome: 0 }),
}));

import { getTrialBalance } from './accounting.service';

describe('ReportsService', () => {
  const unitId = 'test-unit-id';
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-01-31');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStatementOfActivities', () => {
    it('should calculate unrestricted and restricted totals', async () => {
      const mockTrialBalance = [
        { accountId: '1', type: 'REVENUE', normalBalance: 'CREDIT', credit: 1000, debit: 0 },
        { accountId: '2', type: 'EXPENSE', normalBalance: 'DEBIT', credit: 0, debit: 400 },
      ];
      (getTrialBalance as any).mockResolvedValue(mockTrialBalance);
      (prisma.accountCode.findMany as any).mockResolvedValue([
        { id: '1', netAssetCategory: 'UNRESTRICTED' },
        { id: '2', netAssetCategory: 'UNRESTRICTED' },
      ]);

      const result = await reportsService.getStatementOfActivities({ unitId, startDate, endDate });

      expect(result.revenues.total).toBe(1000);
      expect(result.expenses.total).toBe(400);
      expect(result.changeInNetAssets.total).toBe(600);
    });
  });

  describe('getCashFlowStatement', () => {
    it('should calculate operating, investing, and financing flows', async () => {
      (prisma.journalEntry.findMany as any).mockResolvedValue([
        { debit: { toNumber: () => 500 }, credit: { toNumber: () => 0 }, account: { cashFlowCategory: 'OPERATING' } },
        { debit: { toNumber: () => 0 }, credit: { toNumber: () => 200 }, account: { cashFlowCategory: 'INVESTING' } },
      ]);
      (prisma.journalEntry.aggregate as any).mockResolvedValue({ _sum: { debit: { toNumber: () => 1000 }, credit: { toNumber: () => 0 } } });

      const result = await reportsService.getCashFlowStatement({ unitId, startDate, endDate });

      expect(result.operating).toBe(500);
      expect(result.investing).toBe(-200);
      expect(result.beginningBalance).toBe(1000);
      expect(result.endingBalance).toBe(1300);
    });
  });

  describe('getZiswafReport', () => {
    it('should group receipts and distributions by fund type', async () => {
        const mockTrialBalance = [
            { accountId: 'z1', type: 'REVENUE', normalBalance: 'CREDIT', credit: 1000, debit: 0 },
            { accountId: 'z1', type: 'EXPENSE', normalBalance: 'DEBIT', credit: 0, debit: 200 },
        ];
        (getTrialBalance as any).mockResolvedValue(mockTrialBalance);
        (prisma.accountCode.findMany as any).mockResolvedValue([
            { id: 'z1', ziswafFundType: 'ZAKAT' }
        ]);

        const result = await reportsService.getZiswafReport({ unitId, startDate, endDate });
        const zakat = result.find(r => r.type === 'ZAKAT');

        expect(zakat?.receipts).toBe(1000);
        expect(zakat?.distributions).toBe(200);
        expect(zakat?.netChange).toBe(800);
    });
  });
});
