import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateDepreciation } from './service';
import { prisma } from '../../lib/prisma';

// Mock prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    asset: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Inventory Service - Depreciation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should calculate depreciation correctly for 1 year', async () => {
    const purchaseDate = new Date('2023-01-01');
    const targetDate = new Date('2024-01-01'); // 12 months later

    // Asset: Cost 12,000,000, Life 12 months, Residual 0
    // Monthly Depr = 1,000,000
    const mockAsset = {
      id: '1',
      purchasePrice: 12000000,
      purchaseDate: purchaseDate,
      usefulLife: 12,
      residualValue: 0,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.asset.findUnique as any).mockResolvedValue(mockAsset);

    const result = await calculateDepreciation('1', targetDate);

    expect(result).toBeDefined();
    expect(result?.monthlyDepreciation).toBe(1000000);
    expect(result?.ageMonths).toBe(12);
    expect(result?.accumulatedDepreciation).toBe(12000000);
    expect(result?.bookValue).toBe(0);
  });

  it('should calculate partial depreciation correctly', async () => {
    const purchaseDate = new Date('2023-01-01');
    const targetDate = new Date('2023-07-01'); // 6 months later

    // Asset: Cost 12,000,000, Life 12 months, Residual 0
    const mockAsset = {
      id: '1',
      purchasePrice: 12000000,
      purchaseDate: purchaseDate,
      usefulLife: 12,
      residualValue: 0,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.asset.findUnique as any).mockResolvedValue(mockAsset);

    const result = await calculateDepreciation('1', targetDate);

    expect(result?.ageMonths).toBe(6);
    expect(result?.accumulatedDepreciation).toBe(6000000);
    expect(result?.bookValue).toBe(6000000);
  });

  it('should handle residual value correctly', async () => {
    const purchaseDate = new Date('2023-01-01');
    const targetDate = new Date('2024-01-01'); // 12 months later

    // Asset: Cost 12M, Residual 2M, Life 10 months.
    // Depreciable Amount = 10M. Monthly = 1M.
    // At 12 months (over life), max accum = 10M. Book value = 2M.
    const mockAsset = {
      id: '1',
      purchasePrice: 12000000,
      purchaseDate: purchaseDate,
      usefulLife: 10,
      residualValue: 2000000,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.asset.findUnique as any).mockResolvedValue(mockAsset);

    const result = await calculateDepreciation('1', targetDate);

    expect(result?.monthlyDepreciation).toBe(1000000);
    expect(result?.accumulatedDepreciation).toBe(10000000); // Capped at Cost - Residual
    expect(result?.bookValue).toBe(2000000); // Residual value
  });
});
