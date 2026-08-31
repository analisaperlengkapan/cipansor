import { prisma } from '@/lib/prisma';
import { PlanStatus } from '@prisma/client';

/** Aggregated PK dashboards for unit and foundation leadership. */
export class PKAnalyticsService {
  async getUnitPerformanceDashboard(unitId?: string) {
    const units = unitId
      ? await prisma.unit.findMany({ where: { id: unitId } })
      : await prisma.unit.findMany();

    let totalAgreements = 0;
    let approvedAgreements = 0;
    let totalEvaluations = 0;

    const unitMetrics = await Promise.all(
      units.map(async (unit) => {
        const allPks = await prisma.performanceAgreement.findMany({
          where: { user: { unitId: unit.id } },
          select: { status: true, overallScore: true, totalScore: true, behaviorScore: true },
        });

        const evCount = await prisma.pKEvaluation.count({
          where: { pk: { user: { unitId: unit.id } }, status: PlanStatus.APPROVED },
        });

        totalAgreements += allPks.length;
        totalEvaluations += evCount;

        const approvedPks = allPks.filter((p) => p.status === PlanStatus.APPROVED);
        approvedAgreements += approvedPks.length;

        const avgScore =
          approvedPks.length > 0
            ? approvedPks.reduce((sum, pk) => sum + pk.overallScore, 0) / approvedPks.length
            : 0;

        const avgPerf =
          approvedPks.length > 0
            ? approvedPks.reduce((sum, pk) => sum + pk.totalScore, 0) / approvedPks.length
            : 0;

        const avgBehav =
          approvedPks.length > 0
            ? approvedPks.reduce((sum, pk) => sum + pk.behaviorScore, 0) / approvedPks.length
            : 0;

        return {
          id: unit.id,
          name: unit.name,
          avgScore,
          avgPerformanceScore: avgPerf,
          avgBehaviorScore: avgBehav,
          pkCount: approvedPks.length,
        };
      })
    );

    const approvedPksAll = await prisma.performanceAgreement.findMany({
      where: unitId ? { user: { unitId }, status: PlanStatus.APPROVED } : { status: PlanStatus.APPROVED },
      select: { overallScore: true, totalScore: true, behaviorScore: true },
    });

    const avgPerformanceScore =
      approvedPksAll.length > 0
        ? approvedPksAll.reduce((sum, pk) => sum + pk.totalScore, 0) / approvedPksAll.length
        : 0;

    const avgBehaviorScore =
      approvedPksAll.length > 0
        ? approvedPksAll.reduce((sum, pk) => sum + pk.behaviorScore, 0) / approvedPksAll.length
        : 0;

    const sorted = [...unitMetrics].sort((a, b) => b.avgScore - a.avgScore);

    return {
      totalAgreements,
      approvedAgreements,
      totalEvaluations,
      avgPerformanceScore,
      avgBehaviorScore,
      bestPerformingUnits: sorted.slice(0, 5),
      worstPerformingUnits: [...sorted].reverse().slice(0, 5),
      allUnits: unitMetrics,
    };
  }

  async getUnitDrilldown(unitId: string) {
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    const strategicPlan = await prisma.strategicPlan.findFirst({
      where: { unitId, type: 'RKA' },
      select: { id: true, title: true, progress: true },
      orderBy: { createdAt: 'desc' },
    });

    const agreements = await prisma.performanceAgreement.findMany({
      where: { user: { unitId } },
      include: {
        user: { select: { id: true, name: true } },
        supervisor: { select: { id: true, name: true } },
        indicators: { select: { id: true } },
      },
    });

    return {
      unit: unit ? { id: unit.id, name: unit.name } : null,
      strategicPlan,
      agreements,
    };
  }

  async getConsolidatedReport(period: { month?: number; year: number; unitId?: string }) {
    const units = period.unitId
      ? await prisma.unit.findMany({ where: { id: period.unitId } })
      : await prisma.unit.findMany();

    const unitReports = await Promise.all(
      units.map(async (unit) => {
        const pks = await prisma.performanceAgreement.findMany({
          where: { user: { unitId: unit.id } },
          select: { status: true, overallScore: true, totalScore: true, behaviorScore: true },
        });

        const totalAgreements = pks.length;
        const approvedPks = pks.filter((p) => p.status === PlanStatus.APPROVED);
        const approvedAgreements = approvedPks.length;

        const avgScore =
          approvedPks.length > 0
            ? approvedPks.reduce((sum, pk) => sum + pk.overallScore, 0) / approvedPks.length
            : 0;

        const avgPerf =
          approvedPks.length > 0
            ? approvedPks.reduce((sum, pk) => sum + pk.totalScore, 0) / approvedPks.length
            : 0;

        const avgBehav =
          approvedPks.length > 0
            ? approvedPks.reduce((sum, pk) => sum + pk.behaviorScore, 0) / approvedPks.length
            : 0;

        return {
          id: unit.id,
          name: unit.name,
          totalAgreements,
          approvedAgreements,
          avgOverallScore: avgScore,
          avgPerformanceScore: avgPerf,
          avgBehaviorScore: avgBehav,
        };
      })
    );

    return { units: unitReports };
  }
}

export const pkAnalyticsService = new PKAnalyticsService();
