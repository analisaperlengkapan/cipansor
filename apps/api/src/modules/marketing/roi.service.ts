import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Marketing ROI Service
 * Provides analysis on marketing campaign effectiveness and conversion
 */

export async function calculateCampaignROI(unitId?: string) {
  const campaigns = await prisma.marketingCampaign.findMany({
    where: unitId ? { unitId } : {},
    include: {
      _count: {
        select: { registrants: true },
      },
    },
  });

  const results = await Promise.all(campaigns.map(async (campaign) => {
    const convertedCount = await prisma.registrant.count({
      where: {
        campaignId: campaign.id,
        studentId: { not: null },
      },
    });

    const studentInvoices = await prisma.invoice.aggregate({
      where: {
        student: {
          registrant: {
            campaignId: campaign.id,
          },
        },
        status: 'PAID',
      },
      _sum: {
        paidAmount: true,
      },
    });

    const revenue = Number(studentInvoices._sum.paidAmount || 0);
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
  }));

  return results.sort((a, b) => b.metrics.roi - a.metrics.roi);
}
