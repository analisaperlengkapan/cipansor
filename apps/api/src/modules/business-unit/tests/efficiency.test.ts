import { describe, it, expect, vi, beforeEach } from 'vitest';
import { businessUnitService } from '../service';
import { prisma } from '../../../lib/prisma';
import { BusinessUnitType } from '@prisma/client';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    businessUnit: {
      findFirst: vi.fn(),
    },
    laundryTransaction: {
      aggregate: vi.fn(),
    },
  },
}));

describe('BusinessUnitService - Efficiency (Laundry)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate laundry efficiency correctly', async () => {
    const mockBU = {
      id: 'bu-1',
      unitId: 'unit-1',
      type: BusinessUnitType.LAUNDRY,
    };

    (prisma.businessUnit.findFirst as any).mockResolvedValue(mockBU);
    (prisma.laundryTransaction.aggregate as any).mockResolvedValue({
      _sum: { weight: 15, total: 150000 },
      _count: { id: 3 },
    });

    const result = await businessUnitService.getBusinessEfficiency('bu-1', 'unit-1');

    expect(result.type).toBe('LAUNDRY');
    expect(result.overallEfficiency).toBe(100); // (15/3) / 5 * 100 = 100%
    expect(result.metrics).toEqual({
      totalWeight: 15,
      totalRevenue: 150000,
      transactionCount: 3,
      averageWeightPerTransaction: 5,
      revenuePerKg: 10000,
    });
  });

  it('should handle zero transactions gracefully', async () => {
    const mockBU = {
      id: 'bu-1',
      unitId: 'unit-1',
      type: BusinessUnitType.LAUNDRY,
    };

    (prisma.businessUnit.findFirst as any).mockResolvedValue(mockBU);
    (prisma.laundryTransaction.aggregate as any).mockResolvedValue({
      _sum: { weight: 0, total: 0 },
      _count: { id: 0 },
    });

    const result = await businessUnitService.getBusinessEfficiency('bu-1', 'unit-1');

    expect(result.overallEfficiency).toBe(0);
    expect(result.metrics.averageWeightPerTransaction).toBe(0);
  });
});
