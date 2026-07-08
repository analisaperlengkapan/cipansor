import { prisma } from '@/lib/prisma';

export class PKAnalyticsService {
  async getUnitPerformanceDashboard(unitId: string) {
    // 1. Get all units for foundation view or just one unit
    const units = unitId
      ? await prisma.unit.findMany({ where: { id: unitId } })
      : await prisma.unit.findMany();

    const unitMetrics = await Promise.all(
      units.map(async (unit) => {
        // Average PK score for this unit
        const pks = await prisma.performanceAgreement.findMany({
          where: {
            user: { unitId: unit.id },
            status: 'APPROVED',
          },
          select: { overallScore: true },
        });

        const avgScore = pks.length > 0
          ? pks.reduce((sum, pk) => sum + pk.overallScore, 0) / pks.length
          : 0;

        return {
          id: unit.id,
          name: unit.name,
          avgScore,
          pkCount: pks.length,
        };
      })
    );

    // Sort by performance
    const sorted = [...unitMetrics].sort((a, b) => b.avgScore - a.avgScore);

    return {
      bestPerformingUnits: sorted.slice(0, 5),
      worstPerformingUnits: sorted.reverse().slice(0, 5),
      allUnits: unitMetrics,
    };
  }

  async getUnitDrilldown(unitId: string) {
    const individuals = await prisma.performanceAgreement.findMany({
      where: {
        user: { unitId },
        status: 'APPROVED',
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return individuals.map((pk) => ({
      userId: pk.user.id,
      name: pk.user.name,
      overallScore: pk.overallScore,
      performanceScore: pk.totalScore,
      behaviorScore: pk.behaviorScore,
    })).sort((a, b) => b.overallScore - a.overallScore);
  }

  async getConsolidatedReport(period: { month?: number; year: number }) {
    const where: any = { year: period.year };
    if (period.month) where.month = period.month;

    const evaluations = await prisma.pkEvaluation.findMany({
      where: {
        ...where,
        status: 'APPROVED',
      },
      include: {
        pk: {
          include: {
            user: { select: { id: true, name: true, unitId: true, unit: { select: { name: true } } } },
          },
        },
      },
    });

    // Group by unit
    const unitGroups: Record<string, any> = {};
    evaluations.forEach((ev) => {
      const unitId = ev.pk.user.unitId || 'Yayasan';
      const unitName = ev.pk.user.unit?.name || 'Yayasan';

      if (!unitGroups[unitId]) {
        unitGroups[unitId] = { name: unitName, totalScore: 0, count: 0 };
      }

      unitGroups[unitId].totalScore += ev.overallScore;
      unitGroups[unitId].count += 1;
    });

    return Object.entries(unitGroups).map(([id, data]) => ({
      unitId: id,
      unitName: data.name,
      avgScore: data.totalScore / data.count,
      evaluationCount: data.count,
    }));
  }
}

export const pkAnalyticsService = new PKAnalyticsService();
