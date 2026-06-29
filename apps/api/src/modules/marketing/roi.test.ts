import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateCampaignROI } from './roi.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    marketingCampaign: {
      findMany: vi.fn(),
    },
    registrant: {
      groupBy: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
    },
  },
}));

describe('Marketing ROI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate ROI and funnel data correctly', async () => {
    const mockCampaigns = [
      {
        id: 'camp-1',
        name: 'FB Ads',
        code: 'FB01',
        budget: 1000,
        _count: { registrants: 100 },
      },
    ];

    (prisma.marketingCampaign.findMany as any).mockResolvedValue(mockCampaigns);
    (prisma.registrant.groupBy as any)
      .mockResolvedValueOnce([{ campaignId: 'camp-1', _count: { _all: 10 } }]) // conversions
      .mockResolvedValueOnce([
        { campaignId: 'camp-1', status: 'TESTED', _count: { _all: 20 } },
        { campaignId: 'camp-1', status: 'ACCEPTED', _count: { _all: 15 } },
      ]); // funnel

    (prisma.invoice.findMany as any).mockResolvedValue([
      {
        paidAmount: 5000,
        student: { registrant: { campaignId: 'camp-1' } },
      },
    ]);

    const results = await calculateCampaignROI();

    expect(results).toHaveLength(1);
    expect(results[0].metrics.totalLeads).toBe(100);
    expect(results[0].metrics.revenue).toBe(5000);
    expect(results[0].metrics.roi).toBe(400); // (5000 - 1000) / 1000 * 100
    expect(results[0].funnel.tested).toBe(20);
    expect(results[0].funnel.enrolled).toBe(10);
  });
});
