import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { lingkunganService } from './lingkungan.service';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    wasteManagement: {
      findMany: vi.fn(),
    },
  },
}));

describe('Lingkungan Service - Carbon Footprint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate carbon savings correctly based on waste categories', async () => {
    const mockRecords = [
      { category: 'ORGANIC', weight: 100, method: 'COMPOSTING' },
      { category: 'INORGANIC', weight: 50, method: 'RECYCLING' },
      { category: 'B3', weight: 10, method: 'SPECIAL_TREATMENT' },
    ];

    vi.mocked(prisma.wasteManagement.findMany).mockResolvedValue(mockRecords as any);

    const result = await lingkunganService.getWasteSummary('unit-1');

    // Organic: 100 * 0.2 = 20
    // Inorganic: 50 * 0.1 = 5
    // B3: 10 * 0.5 = 5
    // Total: 30
    expect(result.estimatedCarbonSavings).toBe(30);
    expect(result.totalWeight).toBe(160);
  });

  it('should return 0 savings if no records exist', async () => {
    vi.mocked(prisma.wasteManagement.findMany).mockResolvedValue([]);
    const result = await lingkunganService.getWasteSummary('unit-1');
    expect(result.estimatedCarbonSavings).toBe(0);
  });
});
