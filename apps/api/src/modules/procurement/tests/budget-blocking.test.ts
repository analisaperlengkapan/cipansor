import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    purchaseRequest: { findUnique: vi.fn(), update: vi.fn() },
    accountCode: { findUnique: vi.fn() },
    budget: { findMany: vi.fn(), update: vi.fn() },
    asset: { create: vi.fn() },
    journalEntry: { create: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  };
  mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockPrisma));
  return { prisma: mockPrisma };
});

vi.mock('@/utils/code-generator', () => ({
  generateBulkUniqueCodes: vi.fn().mockResolvedValue(['AST-1']),
  generateUniqueCode: vi.fn().mockResolvedValue('AST-1'),
}));

vi.mock('../../finance/accounting-config.service', () => ({
  ACCOUNT_MAPPING_KEYS: { CASH: 'CASH', BANK: 'BANK', PROCUREMENT_EXPENSE: 'PROCUREMENT_EXPENSE' },
  getAccountOrFallback: vi.fn().mockResolvedValue({ id: 'acc-x' }),
}));

import { prisma } from '@/lib/prisma';
import { procurementService } from '../procurement.service';

const mocked = prisma as any;

describe('procurement fulfillment budget blocking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.accountCode.findUnique.mockResolvedValue({ id: 'pay-acc' });
    mocked.purchaseRequest.update.mockResolvedValue({ id: 'pr-1' });
  });

  it('blocks fulfillment when aggregated items exceed the shared budget', async () => {
    mocked.purchaseRequest.findUnique.mockResolvedValue({
      id: 'pr-1',
      status: 'APPROVED',
      unitId: 'unit-1',
      code: 'PR-001',
      items: [
        { id: 'item-1', budgetId: 'bud-1', itemName: 'Meja', budget: { accountId: 'acc-1' } },
        { id: 'item-2', budgetId: 'bud-1', itemName: 'Kursi', budget: { accountId: 'acc-1' } },
      ],
    });
    // Budget remaining = 1_000_000; each item alone fits, together they do not
    mocked.budget.findMany.mockResolvedValue([
      { id: 'bud-1', accountId: 'acc-1', amount: 1500000, usedAmount: 500000 },
    ]);

    await expect(
      procurementService.fulfill(
        'pr-1',
        {
          receiptDate: '2026-07-01',
          paymentAccountId: 'pay-acc',
          items: [
            { itemId: 'item-1', quantityReceived: 1, actualPrice: 600000 },
            { itemId: 'item-2', quantityReceived: 1, actualPrice: 600000 },
          ],
        } as any,
        'user-1'
      )
    ).rejects.toThrow(/Anggaran terlampaui/);

    // Nothing must be persisted when blocked
    expect(mocked.purchaseRequest.update).not.toHaveBeenCalled();
    expect(mocked.budget.update).not.toHaveBeenCalled();
  });
});
