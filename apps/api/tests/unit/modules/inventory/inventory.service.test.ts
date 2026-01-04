import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks before imports
vi.mock("../../../../../src/lib/prisma", () => ({
  prisma: {
    asset: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
    assetCategory: {
      findMany: vi.fn(),
    },
    assetMaintenance: {
      count: vi.fn(),
    },
  },
}));

import {
  createItem,
  getItems,
  getInventoryStats
} from "../../../../../src/modules/inventory/service";
import { prisma } from "../../../../../src/lib/prisma";
import { AssetStatus, AssetCondition } from "@cipansor/shared";

describe("Inventory Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createItem", () => {
    it("should create an item successfully", async () => {
      const input = {
        unitId: "unit-123",
        categoryId: "cat-123",
        code: "ASSET-001",
        name: "Laptop",
        condition: AssetCondition.EXCELLENT,
        status: AssetStatus.ACTIVE,
      };

      const mockCreatedItem = {
        id: "item-123",
        ...input,
        category: { id: "cat-123", name: "Electronics", code: "ELEC" },
        unit: { id: "unit-123", name: "Main Unit" },
      };

      // Ensure mock is accessed correctly
      vi.mocked(prisma.asset.create).mockResolvedValue(mockCreatedItem as any);

      const result = await createItem(input);

      expect(prisma.asset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: "ASSET-001",
          name: "Laptop",
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCreatedItem);
    });
  });

  describe("getItems", () => {
    it("should return paginated items", async () => {
      const mockItems = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ];
      const mockTotal = 2;

      vi.mocked(prisma.asset.findMany).mockResolvedValue(mockItems as any);
      vi.mocked(prisma.asset.count).mockResolvedValue(mockTotal);

      const result = await getItems({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockItems);
      expect(result.meta.total).toBe(mockTotal);
    });
  });

  describe("getInventoryStats", () => {
    it("should return stats", async () => {
      vi.mocked(prisma.asset.count).mockResolvedValue(100);

      const groupByMock = vi.mocked(prisma.asset.groupBy);
      groupByMock.mockResolvedValueOnce([{ status: AssetStatus.ACTIVE, _count: 80 }] as any); // byStatus
      groupByMock.mockResolvedValueOnce([{ condition: AssetCondition.GOOD, _count: 90 }] as any); // byCondition
      groupByMock.mockResolvedValueOnce([{ categoryId: "cat-1", _count: 50 }] as any); // byCategory

      vi.mocked(prisma.assetMaintenance.count).mockResolvedValue(5);

      // Helper to mock Decimal
      class MockDecimal {
        constructor(public val: number) {}
        toNumber() { return this.val; }
        toString() { return String(this.val); }
      }

      vi.mocked(prisma.asset.aggregate).mockResolvedValue({ _sum: { purchasePrice: new MockDecimal(1000000) } } as any);
      vi.mocked(prisma.assetCategory.findMany).mockResolvedValue([{ id: "cat-1", name: "Electronics" }] as any);

      const result = await getInventoryStats();

      expect(result.totalItems).toBe(100);
      expect(result.byStatus).toHaveLength(1);
      expect(result.totalValue).toBe(1000000);
    });
  });
});
