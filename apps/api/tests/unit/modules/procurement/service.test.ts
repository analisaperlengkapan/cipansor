import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PurchaseRequestStatus } from '@cipansor/shared';

// Use vi.hoisted to ensure mocks are available
const mockPrisma = vi.hoisted(() => ({
  purchaseRequest: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  asset: {
    create: vi.fn(),
  },
  journalEntry: {
    create: vi.fn(),
  },
  accountCode: {
    findFirst: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/utils/code-generator', () => ({
  generateUniqueCode: vi.fn().mockResolvedValue('TEST-CODE'),
}));

// Import service AFTER mocks are set up
import { procurementService } from '../../../../src/modules/procurement/procurement.service';

describe('ProcurementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a purchase request successfully', async () => {
      const input = {
        unitId: 'unit-1',
        date: new Date(),
        description: 'Test Request',
        items: [
          {
            itemName: 'Item 1',
            quantity: 2,
            unit: 'pcs',
            estimatedPrice: 10000,
            assetCategoryId: 'cat-1',
          },
        ],
      };

      mockPrisma.purchaseRequest.create.mockResolvedValue({
        id: 'pr-1',
        ...input,
        totalEstimated: 20000,
        status: PurchaseRequestStatus.PENDING,
      });

      const result = await procurementService.create(input, 'user-1');

      expect(mockPrisma.purchaseRequest.create).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('pr-1');
    });
  });

  describe('fulfill', () => {
    it('should fulfill a request, create assets, and create balanced journal entries', async () => {
      const mockRequest = {
        id: 'pr-1',
        unitId: 'unit-1',
        code: 'PR-001',
        status: PurchaseRequestStatus.APPROVED,
        items: [
          {
            itemName: 'Laptop',
            quantity: 1,
            estimatedPrice: 5000000,
            totalPrice: 5000000,
            assetCategoryId: 'cat-1',
            budgetId: 'budget-1',
            budget: {
              accountId: 'acc-expense-1'
            }
          },
        ],
      };

      mockPrisma.purchaseRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.purchaseRequest.update.mockResolvedValue({
        ...mockRequest,
        status: PurchaseRequestStatus.RECEIVED,
      });

      // Mock Cash Account finding
      mockPrisma.accountCode.findFirst.mockResolvedValue({ id: 'acc-cash-1101', code: '1101' });

      await procurementService.fulfill('pr-1', 'user-1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();

      // 1. Update status
      expect(mockPrisma.purchaseRequest.update).toHaveBeenCalledWith({
        where: { id: 'pr-1' },
        data: expect.objectContaining({ status: PurchaseRequestStatus.RECEIVED }),
      });

      // 2. Create Asset
      expect(mockPrisma.asset.create).toHaveBeenCalled();

      // 3. Create Journal Entries (Debit & Credit)
      expect(mockPrisma.accountCode.findFirst).toHaveBeenCalledWith({ where: { code: '1101' } });
      expect(mockPrisma.journalEntry.create).toHaveBeenCalledTimes(2);

      // Debit check
      expect(mockPrisma.journalEntry.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          accountId: 'acc-expense-1',
          debit: 5000000,
          credit: 0
        })
      }));

      // Credit check
      expect(mockPrisma.journalEntry.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          accountId: 'acc-cash-1101',
          debit: 0,
          credit: 5000000
        })
      }));
    });
  });
});
