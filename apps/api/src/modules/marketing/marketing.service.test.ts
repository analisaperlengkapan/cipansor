import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateCampaignROI, getMarketingFunnel } from './roi.service';
import { getHighPriorityLeads } from './service';
import { prisma } from '../../lib/prisma';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    marketingCampaign: {
      findMany: vi.fn(),
    },
    registrant: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
    },
    marketingInteraction: {
      groupBy: vi.fn(),
    },
  },
}));

describe('Marketing ROI & Lead Scoring Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateCampaignROI', () => {
    it('should calculate ROI correctly with student revenue', async () => {
      const mockCampaigns = [
        { id: 'c1', name: 'Test', code: 'T1', budget: 1000, _count: { registrants: 10 } },
      ];
      (prisma.marketingCampaign.findMany as any).mockResolvedValue(mockCampaigns);
      (prisma.registrant.groupBy as any).mockResolvedValue([{ campaignId: 'c1', _count: { _all: 2 } }]);
      (prisma.invoice.findMany as any).mockResolvedValue([
        { paidAmount: 2000, student: { registrant: { campaignId: 'c1' } } },
      ]);

      const result = await calculateCampaignROI();
      expect(result[0].metrics.roi).toBe(100); // (2000 - 1000) / 1000 * 100
      expect(result[0].metrics.conversionRate).toBe(20);
    });
  });

  describe('getMarketingFunnel', () => {
    it('should calculate conversion rates across stages', async () => {
      (prisma.registrant.groupBy as any).mockResolvedValue([
        { status: 'REGISTERED', _count: { _all: 10 } },
        { status: 'ENROLLED', _count: { _all: 2 } },
      ]);

      const result = await getMarketingFunnel();
      const registered = result.find(s => s.stage === 'REGISTERED');
      const enrolled = result.find(s => s.stage === 'ENROLLED');
      
      expect(registered?.reached).toBe(12);
      expect(enrolled?.reached).toBe(2);
      expect(enrolled?.conversionRate).toBeGreaterThan(0);
    });
  });

  describe('getHighPriorityLeads', () => {
    it('should score leads based on interactions and Quran ability', async () => {
      (prisma.registrant.findMany as any).mockResolvedValue([
        { id: 'l1', fullName: 'Lead 1', quranAbility: 'TAHFIDZ', memorizedJuz: 5 },
      ]);
      (prisma.marketingInteraction.groupBy as any).mockResolvedValue([
        { registrantId: 'l1', _count: { _all: 4 } },
      ]);

      const result = await getHighPriorityLeads();
      expect(result[0].leadScore).toBeGreaterThan(50);
      expect(result[0].engagementLevel).toBe('MEDIUM');
    });
  });
});
