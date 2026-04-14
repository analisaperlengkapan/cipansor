import { prisma } from '../../lib/prisma';
import { RiskLevel, PlanStatus, ComplianceStatus } from '@prisma/client';
import { pengawasanService } from '../pengawasan/pengawasan.service';

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
  auditSuggestions?: {
    riskId: string;
    riskCode: string;
    riskLevel: string;
    suggestedTitle: string;
    suggestedDescription: string;
    strategicPlanId?: string | null;
    strategicPlanTitle?: string;
    priority: string;
  }[];
}

export async function getGRCStats(unitId?: string): Promise<GRCStats> {
  const whereClause = unitId ? { unitId } : {};

  const [plans, risks, findings, resolvedFindings, compliances, auditSuggestions] = await Promise.all([
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

    // 3. Audit Findings & Resolved Findings
    // Note: AuditFinding has no direct unitId — filter through the audit relation
    prisma.auditFinding.count({
      where: {
        ...(unitId ? { audit: { unitId } } : {}),
      },
    }),
    // Count distinct findings that have at least one verified follow-up
    prisma.auditFinding.count({
      where: {
        ...(unitId ? { audit: { unitId } } : {}),
        followUps: { some: { status: 'VERIFIED' } },
      },
    }),

    // 4. Sharia Compliance
    prisma.shariaCompliance.findMany({
      where: whereClause,
      select: { score: true, status: true },
    }),

    // 5. Audit Suggestions (parallelized, gracefully degrades on error)
    // When unitId is provided, suggest for that unit; otherwise aggregate across all units
    unitId ? pengawasanService.suggestAuditSchedules(unitId).catch((err) => {
      console.error('[GRC] suggestAuditSchedules failed, returning empty suggestions:', err?.message || err);
      return [];
    }) : (async () => {
      try {
        // Limit to first 20 units to avoid unbounded O(2N) DB queries
        const allUnits = await prisma.unit.findMany({ select: { id: true }, take: 20, orderBy: { createdAt: 'asc' } });
        const allSuggestions = await Promise.all(
          allUnits.map((u) => pengawasanService.suggestAuditSchedules(u.id).catch(() => []))
        );
        // Deduplicate by riskId — the same risk can appear from multiple unit queries
        const seen = new Set<string>();
        return allSuggestions.flat().filter((s) => {
          if (seen.has(s.riskId)) return false;
          seen.add(s.riskId);
          return true;
        });
      } catch (err: any) {
        console.error('[GRC] suggestAuditSchedules (all units) failed:', err?.message || err);
        return [];
      }
    })(),
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
  let scoredCount = 0;
  compliances.forEach((c) => {
    shariaStatusDist[c.status]++;
    if (c.score != null) {
      totalScore += c.score;
      scoredCount++;
    }
  });
  const avgShariaScore = scoredCount > 0 ? totalScore / scoredCount : 0;

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
      resolvedCount: Math.min(resolvedFindings, findings),
      unresolvedCount: Math.max(0, findings - resolvedFindings),
      resolutionRate: findings > 0 ? Math.min(100, Math.round((resolvedFindings / findings) * 10000) / 100) : 100,
    },
    sharia: {
      complianceRate: Math.round(avgShariaScore * 100) / 100,
      statusDistribution: shariaStatusDist,
    },
    auditSuggestions,
  };
}
