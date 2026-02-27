import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Setup mocks inside vi.hoisted to allow access in mock factory
const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  groupBy: vi.fn(),
  aggregate: vi.fn(),
  maintenanceCount: vi.fn(),
  categoryFindMany: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  disconnect: vi.fn(),
  transaction: vi.fn(),
}));

// 2. Mock @prisma/client using a class for the constructor
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      asset = {
        findMany: mocks.findMany,
        count: mocks.count,
        findUnique: mocks.findUnique,
        create: mocks.create,
        update: mocks.update,
        groupBy: mocks.groupBy,
        aggregate: mocks.aggregate,
      };
      assetCategory = {
        findMany: mocks.categoryFindMany,
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findUnique: vi.fn(),
      };
      assetMaintenance = {
        count: mocks.maintenanceCount,
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      $disconnect = mocks.disconnect;
      $transaction = mocks.transaction;
    },
    // Mock Enums
    AssetStatus: {
      ACTIVE: 'ACTIVE',
      MAINTENANCE: 'MAINTENANCE',
      DAMAGED: 'DAMAGED',
      DISPOSED: 'DISPOSED',
    },
    AssetCondition: {
      EXCELLENT: 'EXCELLENT',
      GOOD: 'GOOD',
      FAIR: 'FAIR',
      POOR: 'POOR',
      BROKEN: 'BROKEN',
    },
  };
});

// 3. Mock the prisma lib instance to force usage of our mocked client
vi.mock('../../../../../src/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client');
  return {
    prisma: new PrismaClient(),
  };
});

import {
  createItem,
  getItems,
  getInventoryStats,
} from '../../../../../src/modules/inventory/service';
import { prisma } from '../../../../../src/lib/prisma';
import { AssetStatus, AssetCondition } from '@cipansor/shared';

describe('Inventory Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createItem', () => {
    it('should create an item successfully', async () => {
      const input = {
        unitId: 'unit-123',
        categoryId: 'cat-123',
        code: 'ASSET-001',
        name: 'Laptop',
        condition: AssetCondition.EXCELLENT,
        status: AssetStatus.ACTIVE,
      };

      const mockCreatedItem = {
        id: 'item-123',
        ...input,
        category: { id: 'cat-123', name: 'Electronics', code: 'ELEC' },
        unit: { id: 'unit-123', name: 'Main Unit' },
      };

      // Mock transaction implementation to just run the callback
      mocks.transaction.mockImplementation(async (callback) => {
        // Pass a mock tx object that has the same shape as needed
        const tx = {
          asset: {
            create: mocks.create,
          },
        };
        return callback(tx);
      });

      mocks.create.mockResolvedValue(mockCreatedItem);

      const result = await createItem(input);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedItem);
    });
  });

  describe('getItems', () => {
    it('should return paginated items', async () => {
      const mockItems = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];
      const mockTotal = 2;

      mocks.findMany.mockResolvedValue(mockItems);
      mocks.count.mockResolvedValue(mockTotal);

      const result = await getItems({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockItems);
      expect(result.meta.total).toBe(mockTotal);
    });
  });

  describe('getInventoryStats', () => {
    it('should return stats', async () => {
      mocks.count.mockResolvedValue(100);

      mocks.groupBy
        .mockResolvedValueOnce([{ status: AssetStatus.ACTIVE, _count: 80 }]) // byStatus
        .mockResolvedValueOnce([{ condition: AssetCondition.GOOD, _count: 90 }]) // byCondition
        .mockResolvedValueOnce([{ categoryId: 'cat-1', _count: 50 }]); // byCategory

      mocks.maintenanceCount.mockResolvedValue(5);

      // Simplify the decimal mock to just satisfy the service logic which likely does Number(val) or similar
      const mockDecimalValue = 1000000;

      mocks.aggregate.mockResolvedValue({ _sum: { purchasePrice: mockDecimalValue } });

      mocks.categoryFindMany.mockResolvedValue([{ id: 'cat-1', name: 'Electronics' }]);

      const result = await getInventoryStats();

      expect(result.totalItems).toBe(100);
      expect(result.byStatus).toHaveLength(1);
      expect(result.totalValue).toBe(1000000);
    });
  });
});
