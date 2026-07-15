import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import marketingService from './service';

// Mock all external dependencies
vi.mock('../../lib/prisma', () => ({
  prisma: {
    marketingCampaign: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    marketingInteraction: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    registrant: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('Marketing Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCampaign', () => {
    it('should create a new campaign', async () => {
      const dto = {
        name: 'Early Bird 2026',
        code: 'EB2026',
        description: 'Diskon 10%',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-31'),
        unitId: 'unit-1',
        budget: 5000000,
        expectedLeads: 100,
      };

      const mockCampaign = { id: 'camp-1', ...dto, createdById: 'user-1' };
      vi.mocked(prisma.marketingCampaign.create).mockResolvedValue(mockCampaign as any);

      const result = await marketingService.createCampaign(dto as any, 'user-1');

      expect(prisma.marketingCampaign.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          createdById: 'user-1',
        },
      });
      expect(result).toEqual(mockCampaign);
    });
  });

  describe('logInteraction', () => {
    it('should log a marketing interaction', async () => {
      const dto = {
        registrantId: 'reg-1',
        type: 'PHONE_CALL' as any,
        date: new Date(),
        notes: 'Follow up payment',
        nextAction: 'Kirim invoice',
        nextActionDate: new Date('2026-03-01'),
      };

      const mockInteraction = { id: 'int-1', ...dto, recordedById: 'user-1' };
      vi.mocked(prisma.marketingInteraction.create).mockResolvedValue(mockInteraction as any);

      const result = await marketingService.logInteraction(dto as any, 'user-1');

      expect(prisma.marketingInteraction.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          recordedById: 'user-1',
        },
      });
      expect(result).toEqual(mockInteraction);
    });
  });

  describe('getDashboardStats', () => {
    it('should aggregate statistics correctly', async () => {
      vi.mocked(prisma.registrant.groupBy).mockResolvedValue([
        { source: 'FACEBOOK', _count: { _all: 50 } },
        { source: 'INSTAGRAM', _count: { _all: 30 } },
      ] as any);

      vi.mocked(prisma.marketingCampaign.findMany).mockResolvedValue([
        { name: 'Camp 1', code: 'C1', budget: 1000, _count: { registrants: 20 } },
      ] as any);

      const result = await marketingService.getDashboardStats('unit-1');

      expect(prisma.registrant.groupBy).toHaveBeenCalled();
      expect(prisma.marketingCampaign.findMany).toHaveBeenCalled();
      
      expect(result).toEqual({
        sources: [
          { source: 'FACEBOOK', count: 50 },
          { source: 'INSTAGRAM', count: 30 },
        ],
        topCampaigns: [
          { name: 'Camp 1', code: 'C1', budget: 1000, registrants: 20 },
        ],
      });
    });
  });

  describe('getUpcomingFollowUps', () => {
    it('should fetch interactions with future nextActionDate', async () => {
      vi.mocked(prisma.marketingInteraction.findMany).mockResolvedValue([
        { id: 'int-1', nextActionDate: new Date('2026-03-01') },
      ] as any);

      await marketingService.getUpcomingFollowUps('unit-1', 5);

      expect(prisma.marketingInteraction.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          nextActionDate: { gte: expect.any(Date) },
          registrant: { admissionPeriod: { unitId: 'unit-1' } },
        }),
        orderBy: { nextActionDate: 'asc' },
        take: 5,
        include: expect.any(Object),
      });
    });
  });
});
