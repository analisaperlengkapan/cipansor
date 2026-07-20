import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PurchaseRequestStatus } from '@cipansor/shared';

// Mock Notification Service first to avoid import issues
vi.mock('../../../../src/modules/notifications/notifications.service', () => ({
  createNotification: vi.fn(),
}));

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
  budget: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  accountCode: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock @prisma/client to return local Enums
vi.mock('@prisma/client', () => ({
  UserRole: { SUPER_ADMIN: 'SUPER_ADMIN', UNIT_ADMIN: 'UNIT_ADMIN' },
  AssetCondition: {
    GOOD: 'GOOD',
    FAIR: 'FAIR',
    POOR: 'POOR',
    EXCELLENT: 'EXCELLENT',
    BROKEN: 'BROKEN',
  },
  PurchaseRequestStatus: { ...PurchaseRequestStatus },
  Prisma: {
    JsonObject: {},
  },
}));

vi.mock('@/utils/code-generator', () => ({
  generateUniqueCode: vi.fn().mockResolvedValue('TEST-CODE'),
  generateBulkUniqueCodes: vi.fn().mockResolvedValue(['TEST-CODE-1', 'TEST-CODE-2']),
}));

// Import service AFTER mocks are set up
import { procurementService } from '../../../../src/modules/procurement/procurement.service';
import { ApiError } from '../../../../src/middleware/error';

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
      expect(mockPrisma.auditLog.create).toHaveBeenCalled(); // Check audit log
      expect(result).toBeDefined();
      expect(result.id).toBe('pr-1');
    });

    it('should fail if budget is exceeded', async () => {
      const input = {
        unitId: 'unit-1',
        date: new Date(),
        description: 'Over Budget Request',
        items: [
          {
            itemName: 'Expensive Item',
            quantity: 1,
            unit: 'pcs',
            estimatedPrice: 2000,
            budgetId: 'budget-low',
          },
        ],
      };

      mockPrisma.budget.findMany.mockResolvedValue([
        { id: 'budget-low', amount: 1000, usedAmount: 0 },
      ]);

      await expect(procurementService.create(input, 'user-1')).rejects.toThrow(ApiError);
    });
  });

  describe('fulfill', () => {
    it('should fulfill a request, create assets, and create balanced journal entries', async () => {
      const mockRequest = {
        id: 'pr-1',
        unitId: 'unit-1',
        code: 'PR-001',
        requesterId: 'user-1',
        status: PurchaseRequestStatus.APPROVED,
        items: [
          {
            id: 'item-1',
            itemName: 'Laptop',
            quantity: 1,
            estimatedPrice: 5000000,
            totalPrice: 5000000,
            assetCategoryId: 'cat-1',
            budgetId: 'budget-1',
            budget: {
              accountId: 'acc-expense-1',
            },
          },
        ],
      };

      const fulfillInput = {
        items: [
          {
            itemId: 'item-1',
            quantityReceived: 1,
            actualPrice: 5000000,
            condition: 'GOOD' as const,
            notes: 'Received in good condition',
          },
        ],
        paymentAccountId: 'acc-cash-1',
        receiptDate: new Date(),
        purchaseOrderNo: 'PO-001',
        supplier: 'Vendor A',
      };

      mockPrisma.purchaseRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.purchaseRequest.update.mockResolvedValue({
        ...mockRequest,
        status: PurchaseRequestStatus.RECEIVED,
      });

      // Mock Payment Account finding
      mockPrisma.accountCode.findUnique.mockResolvedValue({
        id: 'acc-cash-1',
        code: '1101',
        name: 'Cash',
      });

      await procurementService.fulfill('pr-1', fulfillInput, 'user-1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();

      // 1. Update status
      expect(mockPrisma.purchaseRequest.update).toHaveBeenCalledWith({
        where: { id: 'pr-1' },
        data: expect.objectContaining({ status: PurchaseRequestStatus.RECEIVED }),
      });

      // 2. Create Asset
      expect(mockPrisma.asset.create).toHaveBeenCalled();

      // 3. Create Journal Entries (Debit & Credit)
      expect(mockPrisma.accountCode.findUnique).toHaveBeenCalledWith({
        where: { id: 'acc-cash-1' },
      });
      expect(mockPrisma.journalEntry.create).toHaveBeenCalledTimes(2);

      // Debit check
      expect(mockPrisma.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: 'acc-expense-1',
            debit: 5000000,
            credit: 0,
          }),
        })
      );

      // Credit check
      expect(mockPrisma.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: 'acc-cash-1',
            debit: 0,
            credit: 5000000,
          }),
        })
      );

      // Audit log check
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });
});
