import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getROITrend } from '../roi.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      findMany: vi.fn(),
    },
  },
}));

describe('Marketing ROI Service - Trend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return aggregated ROI trend data', async () => {
    const mockInvoices = [
      {
        paidAmount: 1000,
        createdAt: new Date(),
        student: {
          registrant: {
            campaignId: 'c1',
            campaign: { name: 'Campaign 1' }
          }
        }
      }
    ];

    (prisma.invoice.findMany as any).mockResolvedValue(mockInvoices);

    const result = await getROITrend('unit-1');

    expect(result.months).toHaveLength(6);
    expect(result.campaigns).toHaveLength(1);
    expect(result.campaigns[0].name).toBe('Campaign 1');
  });
});
