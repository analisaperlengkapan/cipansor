import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { procurementService } from './procurement.service';
import { PurchaseRequestStatus } from '@cipansor/shared';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    purchaseRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    budget: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    accountCode: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    journalEntry: {
      create: vi.fn(),
    },
    asset: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    setting: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('Procurement Service - Budget Block', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should block fulfillment if actual price exceeds remaining budget', async () => {
    const mockPR = {
      id: 'pr-1',
      unitId: 'unit-1',
      status: PurchaseRequestStatus.APPROVED,
      items: [
        {
          id: 'item-1',
          budgetId: 'budget-1',
          itemName: 'Laptop',
        }
      ]
    };

    const mockBudget = {
      id: 'budget-1',
      accountId: 'acc-1',
      amount: 1000,
      usedAmount: 800, // 200 remaining
    };

    const fulfillInput = {
      receiptDate: new Date().toISOString(),
      paymentAccountId: 'pay-acc-1',
      items: [
        {
          itemId: 'item-1',
          quantityReceived: 1,
          actualPrice: 300, // 300 > 200 remaining
        }
      ]
    };

    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(mockPR as any);
    vi.mocked(prisma.accountCode.findUnique).mockResolvedValue({ id: 'pay-acc-1' } as any);
    vi.mocked(prisma.budget.findMany).mockResolvedValue([mockBudget] as any);

    await expect(procurementService.fulfill('pr-1', fulfillInput as any, 'user-1'))
      .rejects.toThrow(/Budget Exceeded/);

    expect(prisma.purchaseRequest.update).not.toHaveBeenCalled();
  });

  it('should allow fulfillment if budget is sufficient', async () => {
    const mockPR = {
      id: 'pr-2',
      unitId: 'unit-1',
      status: PurchaseRequestStatus.APPROVED,
      code: 'PR-001',
      items: [
        {
          id: 'item-2',
          budgetId: 'budget-2',
          itemName: 'Mouse',
          budget: { accountId: 'acc-2' }
        }
      ]
    };

    const mockBudget = {
      id: 'budget-2',
      accountId: 'acc-2',
      amount: 1000,
      usedAmount: 500, // 500 remaining
    };

    const fulfillInput = {
      receiptDate: new Date().toISOString(),
      paymentAccountId: 'pay-acc-1',
      items: [
        {
          itemId: 'item-2',
          quantityReceived: 1,
          actualPrice: 100, // 100 < 500 remaining
        }
      ]
    };

    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(mockPR as any);
    vi.mocked(prisma.accountCode.findUnique).mockResolvedValue({ id: 'pay-acc-1' } as any);
    vi.mocked(prisma.budget.findMany).mockResolvedValue([mockBudget] as any);
    vi.mocked(prisma.purchaseRequest.update).mockResolvedValue({ id: 'pr-2' } as any);

    const result = await procurementService.fulfill('pr-2', fulfillInput as any, 'user-1');

    expect(result).toBeDefined();
    expect(prisma.purchaseRequest.update).toHaveBeenCalled();
    expect(prisma.budget.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'budget-2' },
      data: { usedAmount: { increment: 100 } }
    }));
  });
});
