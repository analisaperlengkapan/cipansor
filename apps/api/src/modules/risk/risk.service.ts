import { prisma } from '@/lib/prisma';
import {
  Risk,
  RiskMitigation,
  RiskLikelihood,
  RiskImpact,
  RiskLevel,
  Prisma,
} from '@prisma/client';

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export class RiskService {
  async createRisk(data: Prisma.RiskCreateInput): Promise<Risk> {
    const riskScore = this.calculateRiskScore(data.likelihood, data.impact);
    const riskLevel = this.determineRiskLevel(riskScore);

    return prisma.risk.create({
      data: {
        ...data,
        riskScore,
        riskLevel,
      },
    });
  }

  async getRisks(unitId: string, query: { category?: any; riskLevel?: any; strategicPlanId?: string }): Promise<Risk[]> {
    const where: Prisma.RiskWhereInput = {
      unitId,
    };

    if (query.category) where.category = query.category;
    if (query.riskLevel) where.riskLevel = query.riskLevel;
    if (query.strategicPlanId) where.strategicPlanId = query.strategicPlanId;

    return prisma.risk.findMany({
      where,
      include: {
        mitigations: true,
        createdBy: {
          select: { id: true, name: true },
        },
        strategicPlan: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRiskById(id: string): Promise<Risk | null> {
    return prisma.risk.findUnique({
      where: { id },
      include: {
        mitigations: {
          include: {
            pic: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        strategicPlan: {
          select: { id: true, title: true },
        },
      },
    });
  }

  async updateRisk(id: string, data: Prisma.RiskUpdateInput): Promise<Risk> {
    const current = await this.getRiskById(id);
    if (!current) throw new Error('Risk not found');

    // Use current values if not provided in update
    const likelihood = (data.likelihood as RiskLikelihood) || current.likelihood;
    const impact = (data.impact as RiskImpact) || current.impact;

    const riskScore = this.calculateRiskScore(likelihood, impact);
    const riskLevel = this.determineRiskLevel(riskScore);

    return prisma.$transaction(async (tx) => {
      await tx.risk.update({
        where: { id },
        data: {
          ...data,
          riskScore,
          riskLevel,
        },
      });

      // Recalculate residual risk when inherent likelihood/impact changes
      await this.recalculateResidualRisk(id, tx);

      // Re-fetch to include the freshly-calculated residual risk fields
      const freshRisk = await tx.risk.findUniqueOrThrow({ where: { id } });
      return freshRisk;
    });
  }

  async deleteRisk(id: string): Promise<Risk> {
    return prisma.risk.delete({ where: { id } });
  }

  async createMitigation(data: Prisma.RiskMitigationCreateInput): Promise<RiskMitigation> {
    return prisma.$transaction(async (tx) => {
      const mitigation = await tx.riskMitigation.create({
        data,
      });

      // After creating mitigation, recalculate residual risk
      await this.recalculateResidualRisk(mitigation.riskId, tx);

      return mitigation;
    });
  }

  async getMitigationById(id: string): Promise<(RiskMitigation & { risk: Risk }) | null> {
    return prisma.riskMitigation.findUnique({
      where: { id },
      include: { risk: true },
    });
  }

  async updateMitigation(
    id: string,
    data: Prisma.RiskMitigationUpdateInput
  ): Promise<RiskMitigation> {
    return prisma.$transaction(async (tx) => {
      const mitigation = await tx.riskMitigation.update({
        where: { id },
        data,
      });

      // After updating mitigation, recalculate residual risk
      await this.recalculateResidualRisk(mitigation.riskId, tx);

      return mitigation;
    });
  }

  async deleteMitigation(id: string): Promise<RiskMitigation> {
    return prisma.$transaction(async (tx) => {
      const mitigation = await tx.riskMitigation.delete({ where: { id } });

      // After deleting mitigation, recalculate residual risk
      await this.recalculateResidualRisk(mitigation.riskId, tx);

      return mitigation;
    });
  }

  // Helpers
  private async recalculateResidualRisk(riskId: string, tx: TransactionClient = prisma) {
    const risk = await tx.risk.findUnique({
      where: { id: riskId },
      include: { mitigations: true },
    });

    if (!risk) return;

    // If no mitigations exist, clear residual fields (null = no assessment performed)
    if (risk.mitigations.length === 0) {
      await tx.risk.update({
        where: { id: riskId },
        data: {
          residualLikelihood: null,
          residualImpact: null,
          residualScore: null,
          residualLevel: null,
        },
      });
      return;
    }

    // Logic: Mitigation progress reduces likelihood and impact
    // Avg progress of all mitigations
    const avgProgress = risk.mitigations.reduce((sum, m) => sum + (m.progress || 0), 0) / risk.mitigations.length;

    // Reduction factor: 0% progress = 1.0, 100% progress = 0.4 (capped reduction)
    const factor = 1 - (avgProgress / 100) * 0.6;

    const lVal = this.getEnumWeight(risk.likelihood);
    const iVal = this.getEnumWeight(risk.impact);

    const residualLVal = Math.max(1, Math.round(lVal * factor));
    const residualIVal = Math.max(1, Math.round(iVal * factor));

    const residualLikelihood = this.getWeightToLikelihood(residualLVal);
    const residualImpact = this.getWeightToImpact(residualIVal);
    const residualScore = residualLVal * residualIVal;
    const residualLevel = this.determineRiskLevel(residualScore);

    await tx.risk.update({
      where: { id: riskId },
      data: {
        residualLikelihood,
        residualImpact,
        residualScore,
        residualLevel,
      },
    });
  }

  private getEnumWeight(val: string): number {
    const map: Record<string, number> = {
      RARE: 1, INSIGNIFICANT: 1,
      UNLIKELY: 2, MINOR: 2,
      POSSIBLE: 3, MODERATE: 3,
      LIKELY: 4, MAJOR: 4,
      ALMOST_CERTAIN: 5, CATASTROPHIC: 5,
    };
    return map[val] || 1;
  }

  private getWeightToLikelihood(w: number): RiskLikelihood {
    const map: Record<number, RiskLikelihood> = {
      1: 'RARE', 2: 'UNLIKELY', 3: 'POSSIBLE', 4: 'LIKELY', 5: 'ALMOST_CERTAIN',
    };
    return map[w] || 'RARE';
  }

  private getWeightToImpact(w: number): RiskImpact {
    const map: Record<number, RiskImpact> = {
      1: 'INSIGNIFICANT', 2: 'MINOR', 3: 'MODERATE', 4: 'MAJOR', 5: 'CATASTROPHIC',
    };
    return map[w] || 'INSIGNIFICANT';
  }

  private calculateRiskScore(likelihood: RiskLikelihood, impact: RiskImpact): number {
    // Note: We use a string key lookup here (`likelihood as string`) instead of directly
    // referencing Prisma Enums as object keys to prevent Vitest mocking issues during testing,
    // while still maintaining the strong typings for the method parameters in production code.
    const likelihoodMap: Record<string, number> = {
      RARE: 1,
      UNLIKELY: 2,
      POSSIBLE: 3,
      LIKELY: 4,
      ALMOST_CERTAIN: 5,
    };
    const impactMap: Record<string, number> = {
      INSIGNIFICANT: 1,
      MINOR: 2,
      MODERATE: 3,
      MAJOR: 4,
      CATASTROPHIC: 5,
    };

    const l = likelihoodMap[likelihood as string] || 1;
    const i = impactMap[impact as string] || 1;

    return l * i;
  }

  private determineRiskLevel(score: number): RiskLevel {
    // Using string casting to 'RiskLevel' to satisfy Prisma types in production
    // without triggering enum initialization crashes in vitest mocks.
    if (score >= 20) return 'EXTREME' as RiskLevel; // 20, 25
    if (score >= 10) return 'HIGH' as RiskLevel; // 10, 12, 15, 16
    if (score >= 5) return 'MEDIUM' as RiskLevel; // 5, 6, 8, 9
    return 'LOW' as RiskLevel; // 1, 2, 3, 4
  }
}

export const riskService = new RiskService();
