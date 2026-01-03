import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinanceEnhancementService } from '../../../src/modules/finance-enhancement/finance-enhancement.service';
import { prisma } from '../../../src/lib/prisma';
import { AccountType, JournalReferenceType } from '@cipansor/shared';

// Mock Prisma
vi.mock('../../../src/lib/prisma', () => ({
  prisma: {
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
      findUnique: vi.fn(),
      create: vi.fn(),
      groupBy: vi.fn(),
    },
    scholarship: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    scholarshipRecipient: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    paymentComponent: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    }
  }
}));

describe('FinanceEnhancementService', () => {
  let service: FinanceEnhancementService;

  beforeEach(() => {
    service = new FinanceEnhancementService();
    vi.clearAllMocks();
  });

  describe('Account Codes', () => {
    it('should get account codes with pagination', async () => {
      (prisma.accountCode.findMany as any).mockResolvedValue([
        { id: '1', code: '100', name: 'Assets', type: 'ASSET' }
      ]);
      (prisma.accountCode.count as any).mockResolvedValue(1);

      const result = await service.getAccountCodes({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].code).toBe('100');
      expect(prisma.accountCode.findMany).toHaveBeenCalled();
    });

    it('should create an account code', async () => {
      const input = { code: '100', name: 'Assets', type: AccountType.ASSET };
      (prisma.accountCode.findUnique as any).mockResolvedValue(null);
      (prisma.accountCode.create as any).mockResolvedValue({ id: '1', ...input });

      const result = await service.createAccountCode(input);

      expect(result.code).toBe('100');
      expect(prisma.accountCode.create).toHaveBeenCalled();
    });

    it('should throw error if account code exists', async () => {
      const input = { code: '100', name: 'Assets', type: AccountType.ASSET };
      (prisma.accountCode.findUnique as any).mockResolvedValue({ id: '1' });

      await expect(service.createAccountCode(input)).rejects.toThrow('Account code already exists');
    });
  });

  describe('Journal Entries', () => {
    it('should create a journal entry', async () => {
      const input = {
        unitId: 'u1',
        accountId: 'a1',
        date: new Date(),
        debit: 1000,
        createdById: 'user1'
      };

      // Use string for decimal in mock return if mimicking Prisma Decimal
      // But typically we mock the resolved object.
      // The service maps Decimal to Number.
      // Let's assume Prisma returns an object with a number-like property or we mock the exact shape if needed.
      // Since the service does `Number(entry.debit)`, we can pass a number or a string.
      (prisma.journalEntry.create as any).mockResolvedValue({
        id: '1',
        ...input,
        debit: 1000, // as number for simplicity in mock, service logic handles casting
        credit: 0
      });

      const result = await service.createJournalEntry(input);

      expect(result.debit).toBe(1000);
      expect(prisma.journalEntry.create).toHaveBeenCalled();
    });
  });

  describe('Reports: Trial Balance', () => {
    it('should calculate trial balance correctly', async () => {
      // Setup mocks
      const groupByResult = [
        { accountId: 'a1', _sum: { debit: 1000, credit: 0 } },
        { accountId: 'a2', _sum: { debit: 0, credit: 1000 } }
      ];
      (prisma.journalEntry.groupBy as any).mockResolvedValue(groupByResult);

      (prisma.accountCode.findMany as any).mockResolvedValue([
        { id: 'a1', code: '100', name: 'Cash', type: 'ASSET' },
        { id: 'a2', code: '400', name: 'Revenue', type: 'REVENUE' }
      ]);

      const result = await service.getTrialBalance({
        unitId: 'u1',
        startDate: new Date(),
        endDate: new Date()
      });

      expect(result.accounts).toHaveLength(2);
      expect(result.totals.debit).toBe(1000);
      expect(result.totals.credit).toBe(1000);
      expect(result.isBalanced).toBe(true);
    });
  });
});
