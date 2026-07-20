import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as service from '../../../../src/modules/marketing/marketing.service';
import { prisma } from '../../../../src/lib/prisma';

// Mock prisma
vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    marketingCampaign: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    marketingInteraction: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    registrant: {
      groupBy: vi.fn(),
    },
  },
}));

describe('MarketingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCampaign', () => {
    it('should create a campaign', async () => {
      const input = {
        name: 'Test Campaign',
        code: 'TEST_01',
        startDate: '2024-01-01T00:00:00Z',
      };
      const userId = 'user-1';
      const mockCampaign = { id: 'camp-1', ...input, createdById: userId };

      vi.mocked(prisma.marketingCampaign.create).mockResolvedValue(mockCampaign as any);

      const result = await service.createCampaign(input, userId);

      expect(prisma.marketingCampaign.create).toHaveBeenCalledWith({
        data: { ...input, createdById: userId },
      });
      expect(result).toEqual(mockCampaign);
    });
  });

  describe('getDashboardStats', () => {
    it('should return aggregated stats', async () => {
      // Mock groupBy sources
      vi.mocked(prisma.registrant.groupBy).mockResolvedValue([
        { source: 'FACEBOOK', _count: { _all: 10 } },
        { source: 'INSTAGRAM', _count: { _all: 5 } },
      ] as any);

      // Mock top campaigns
      vi.mocked(prisma.marketingCampaign.findMany).mockResolvedValue([
        {
          id: '1',
          name: 'Camp A',
          code: 'A',
          budget: 1000,
          _count: { registrants: 20 },
        },
      ] as any);

      const result = await service.getDashboardStats();

      expect(result.sources).toHaveLength(2);
      expect(result.topCampaigns).toHaveLength(1);
      expect(result.topCampaigns[0].registrants).toBe(20);
    });
  });
});
