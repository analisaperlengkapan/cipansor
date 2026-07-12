import { prisma } from '@/lib/prisma';
import { PlanStatus } from '@prisma/client';

/** Aggregated PK dashboards for unit and foundation leadership. */
export class PKAnalyticsService {
  async getUnitPerformanceDashboard(unitId?: string) {
    const units = unitId
      ? await prisma.unit.findMany({ where: { id: unitId } })
      : await prisma.unit.findMany();

    const unitMetrics = await Promise.all(
      units.map(async (unit) => {
        const pks = await prisma.performanceAgreement.findMany({
          where: {
            user: { unitId: unit.id },
            status: PlanStatus.APPROVED,
          },
          select: { overallScore: true },
        });

        const avgScore =
          pks.length > 0
            ? pks.reduce((sum, pk) => sum + pk.overallScore, 0) / pks.length
            : 0;

        return { id: unit.id, name: unit.name, avgScore, pkCount: pks.length };
      })
    );

    const sorted = [...unitMetrics].sort((a, b) => b.avgScore - a.avgScore);

    return {
      bestPerformingUnits: sorted.slice(0, 5),
      worstPerformingUnits: [...sorted].reverse().slice(0, 5),
      allUnits: unitMetrics,
    };
  }

  async getUnitDrilldown(unitId: string) {
    const individuals = await prisma.performanceAgreement.findMany({
      where: {
        user: { unitId },
        status: PlanStatus.APPROVED,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return individuals
      .map((pk) => ({
        userId: pk.user.id,
        name: pk.user.name,
        overallScore: pk.overallScore,
        performanceScore: pk.totalScore,
        behaviorScore: pk.behaviorScore,
      }))
      .sort((a, b) => b.overallScore - a.overallScore);
  }

  async getConsolidatedReport(period: { month?: number; year: number }) {
    const evaluations = await prisma.pKEvaluation.findMany({
      where: {
        year: period.year,
        month: period.month,
        status: PlanStatus.APPROVED,
      },
      include: {
        pk: {
          include: {
            user: {
              select: { id: true, name: true, unitId: true, unit: { select: { name: true } } },
            },
          },
        },
      },
    });

    const unitGroups: Record<string, { name: string; totalScore: number; count: number }> = {};
    for (const ev of evaluations) {
      const unitId = ev.pk.user.unitId || 'yayasan';
      const unitName = ev.pk.user.unit?.name || 'Yayasan';

      unitGroups[unitId] ??= { name: unitName, totalScore: 0, count: 0 };
      unitGroups[unitId].totalScore += ev.overallScore;
      unitGroups[unitId].count += 1;
    }

    return Object.entries(unitGroups).map(([id, data]) => ({
      unitId: id,
      unitName: data.name,
      avgScore: data.totalScore / data.count,
      evaluationCount: data.count,
    }));
  }
}

export const pkAnalyticsService = new PKAnalyticsService();
