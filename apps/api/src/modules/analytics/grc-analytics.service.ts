import { prisma } from '../../lib/prisma';
import { RiskLevel, PlanStatus, ComplianceStatus } from '@prisma/client';

export interface GRCStats {
  plans: {
    activeCount: number;
    averageProgress: number;
  };
  risks: {
    total: number;
    byLevel: Record<RiskLevel, number>;
    criticalCount: number;
  };
  audits: {
    totalFindings: number;
    unresolvedCount: number;
    resolvedCount: number;
    resolutionRate: number;
  };
  sharia: {
    complianceRate: number;
    statusDistribution: Record<ComplianceStatus, number>;
  };
}

export async function getGRCStats(unitId?: string): Promise<GRCStats> {
  const whereClause = unitId ? { unitId } : {};

  const [plans, risks, findings, followUps, compliances] = await Promise.all([
    // 1. Strategic Plans
    prisma.strategicPlan.findMany({
      where: {
        ...whereClause,
        status: { in: [PlanStatus.PROPOSED, PlanStatus.APPROVED, PlanStatus.IN_PROGRESS] },
      },
      select: { progress: true },
    }),

    // 2. Risks
    prisma.risk.findMany({
      where: {
        ...whereClause,
        status: 'OPEN',
      },
      select: { riskLevel: true },
    }),

    // 3. Audit Findings & Follow Ups
    prisma.auditFinding.count({
      where: {
        audit: { unitId: unitId || undefined },
      },
    }),
    prisma.auditFollowUp.count({
      where: {
        finding: { audit: { unitId: unitId || undefined } },
        status: 'VERIFIED',
      },
    }),

    // 4. Sharia Compliance
    prisma.shariaCompliance.findMany({
      where: whereClause,
      select: { score: true, status: true },
    }),
  ]);

  // Plans Processing
  const activePlansCount = plans.length;
  const avgProgress =
    activePlansCount > 0
      ? plans.reduce((sum, p) => sum + (p.progress || 0), 0) / activePlansCount
      : 0;

  // Risks Processing
  const riskDistribution: Record<RiskLevel, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    EXTREME: 0,
  };
  risks.forEach((r) => {
    riskDistribution[r.riskLevel]++;
  });
  const criticalRisks = riskDistribution.HIGH + riskDistribution.EXTREME;

  // Sharia Processing
  const shariaStatusDist: Record<ComplianceStatus, number> = {
    COMPLIANT: 0,
    PARTIALLY: 0,
    NON_COMPLIANT: 0,
    UNDER_REVIEW: 0,
    NOT_APPLICABLE: 0,
  };
  let totalScore = 0;
  compliances.forEach((c) => {
    shariaStatusDist[c.status]++;
    totalScore += c.score || 0;
  });
  const avgShariaScore = compliances.length > 0 ? totalScore / compliances.length : 0;

  return {
    plans: {
      activeCount: activePlansCount,
      averageProgress: Math.round(avgProgress * 100) / 100,
    },
    risks: {
      total: risks.length,
      byLevel: riskDistribution,
      criticalCount: criticalRisks,
    },
    audits: {
      totalFindings: findings,
      resolvedCount: followUps,
      unresolvedCount: findings - followUps,
      resolutionRate: findings > 0 ? Math.round((followUps / findings) * 10000) / 100 : 100,
    },
    sharia: {
      complianceRate: Math.round(avgShariaScore * 100) / 100,
      statusDistribution: shariaStatusDist,
    },
  };
}
