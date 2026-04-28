import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateCampaignROI } from "../roi.service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    marketingCampaign: {
      findMany: vi.fn(),
    },
    registrant: {
      count: vi.fn(),
    },
    invoice: {
      aggregate: vi.fn(),
    },
  },
}));

describe("Marketing ROI Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate ROI correctly for multiple campaigns", async () => {
    const mockCampaigns = [
      { id: "c1", name: "Facebook Ads", code: "FB01", budget: 1000, _count: { registrants: 100 } },
      { id: "c2", name: "Search Ads", code: "G01", budget: 500, _count: { registrants: 50 } },
    ];

    vi.mocked(prisma.marketingCampaign.findMany).mockResolvedValue(mockCampaigns as any);

    vi.mocked(prisma.registrant.count)
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(10);

    vi.mocked(prisma.invoice.aggregate)
      .mockResolvedValueOnce({ _sum: { paidAmount: 5000 } } as any)
      .mockResolvedValueOnce({ _sum: { paidAmount: 1000 } } as any);

    const result = await calculateCampaignROI();

    expect(result).toHaveLength(2);
    const fbAds = result.find(r => r.code === "FB01");
    expect(fbAds?.metrics.roi).toBe(400);
    expect(fbAds?.metrics.conversionRate).toBe(20);
  });

  it("should return empty array when no campaigns exist", async () => {
    vi.mocked(prisma.marketingCampaign.findMany).mockResolvedValue([]);
    const result = await calculateCampaignROI();
    expect(result).toEqual([]);
  });
});