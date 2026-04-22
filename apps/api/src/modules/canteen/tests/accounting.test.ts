import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transactionService } from '../service';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { JournalReferenceType } from '@cipansor/shared';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    canteenItem: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    canteenTransaction: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    journalEntry: {
      create: vi.fn(),
    },
    santriWallet: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    walletTransaction: {
      create: vi.fn(),
    },
    canteenStockMovement: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

vi.mock('../../finance/accounting-config.service', () => ({
  getAccountOrFallback: vi.fn().mockResolvedValue({ id: 'acc-1' }),
  ACCOUNT_MAPPING_KEYS: {
    CASH: 'CASH',
    INVENTORY_ASSET: 'INVENTORY_ASSET',
  },
}));

describe('Canteen Transaction Accounting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create journal entries on transaction', async () => {
    const mockItems = [
      { id: 'item-1', price: new Prisma.Decimal(10000), costPrice: new Prisma.Decimal(7000), stock: 10, name: 'Item 1' }
    ];
    (prisma.canteenItem.findMany as any).mockResolvedValue(mockItems);
    (prisma.canteenTransaction.create as any).mockResolvedValue({ id: 'tx-1', transactionNo: 'TX-001' });

    await transactionService.create('unit-1', 'cashier-1', {
      items: [{ itemId: 'item-1', quantity: 2 }],
      paymentMethod: 'CASH',
      discount: 0,
    });

    // 2 Revenue journals (Debit Cash, Credit Revenue) + 2 COGS journals (Debit COGS, Credit Inventory)
    expect(prisma.journalEntry.create).toHaveBeenCalledTimes(4);
  });
});
