import { prisma } from '@/lib/prisma';

/**
 * Marketing ROI Service
 * Optimized implementation to avoid N+1 queries.
 */
export async function calculateCampaignROI(unitId?: string) {
  const campaigns = await prisma.marketingCampaign.findMany({
    where: unitId ? { unitId } : {},
    select: {
      id: true,
      name: true,
      code: true,
      budget: true,
      _count: {
        select: { registrants: true },
      },
    },
  });

  if (campaigns.length === 0) return [];

  const campaignIds = campaigns.map(c => c.id);

  // 1. Get converted counts in one query
  const conversions = await prisma.registrant.groupBy({
    by: ['campaignId'],
    where: {
      campaignId: { in: campaignIds },
      studentId: { not: null },
    },
    _count: { _all: true },
  });

  const conversionMap = new Map(
    conversions.map(c => [c.campaignId, c._count._all])
  );

  // 2. Get revenue in one query
  // Support both Registrant -> Student -> Invoice AND Registrant -> Invoice directly
  const [studentRevenueData, registrantRevenueData] = await Promise.all([
    // Path: Registrant -> Student -> Invoice
    prisma.invoice.findMany({
      where: {
        student: {
          registrant: {
            campaignId: { in: campaignIds },
          },
        },
        status: 'PAID',
      },
      select: {
        paidAmount: true,
        student: {
          select: {
            registrant: {
              select: { campaignId: true }
            }
          }
        }
      }
    }),
    // Path: Registrant -> Invoice (for registration fees paid before promotion to student)
    // Note: This requires an optional registrantId on the Invoice model
    (prisma.invoice as any).findMany({
      where: {
        registrant: {
          campaignId: { in: campaignIds },
        },
        status: 'PAID',
      },
      select: {
        paidAmount: true,
        registrant: {
          select: { campaignId: true }
        }
      }
    }).catch(() => []) // Gracefully handle if registrantId isn't on Invoice yet
  ]);

  const revenueMap = new Map<string, number>();

  // Add revenue from students
  studentRevenueData.forEach(inv => {
    const cid = inv.student?.registrant?.campaignId;
    if (cid) {
      revenueMap.set(cid, (revenueMap.get(cid) || 0) + Number(inv.paidAmount));
    }
  });

  // Add revenue from direct registrants (e.g. registration fees)
  registrantRevenueData.forEach((inv: any) => {
    const cid = inv.registrant?.campaignId;
    if (cid) {
      revenueMap.set(cid, (revenueMap.get(cid) || 0) + Number(inv.paidAmount));
    }
  });

  const results = campaigns.map((campaign) => {
    const convertedCount = conversionMap.get(campaign.id) || 0;
    const revenue = revenueMap.get(campaign.id) || 0;
    const cost = Number(campaign.budget || 0);

    const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
    const conversionRate = campaign._count.registrants > 0
      ? (convertedCount / campaign._count.registrants) * 100
      : 0;

    return {
      campaignId: campaign.id,
      name: campaign.name,
      code: campaign.code,
      metrics: {
        totalLeads: campaign._count.registrants,
        convertedStudents: convertedCount,
        conversionRate: Math.round(conversionRate * 100) / 100,
        cost,
        revenue,
        roi: Math.round(roi * 100) / 100,
        costPerLead: campaign._count.registrants > 0 ? cost / campaign._count.registrants : 0,
        costPerAcquisition: convertedCount > 0 ? cost / convertedCount : 0,
      }
    };
  });

  return results.sort((a, b) => b.metrics.roi - a.metrics.roi);
}
