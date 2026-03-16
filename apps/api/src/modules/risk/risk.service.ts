import { prisma } from '@/lib/prisma';
import {
  Risk,
  RiskMitigation,
  RiskLikelihood,
  RiskImpact,
  RiskLevel,
  Prisma,
} from '@prisma/client';

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

    return prisma.risk.update({
      where: { id },
      data: {
        ...data,
        riskScore,
        riskLevel,
      },
    });
  }

  async deleteRisk(id: string): Promise<Risk> {
    return prisma.risk.delete({ where: { id } });
  }

  async createMitigation(data: Prisma.RiskMitigationCreateInput): Promise<RiskMitigation> {
    return prisma.riskMitigation.create({
      data,
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
    return prisma.riskMitigation.update({
      where: { id },
      data,
    });
  }

  async deleteMitigation(id: string): Promise<RiskMitigation> {
    return prisma.riskMitigation.delete({ where: { id } });
  }

  // Helpers
  private calculateRiskScore(likelihood: string, impact: string): number {
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
    if (score >= 20) return 'EXTREME' as RiskLevel; // 20, 25
    if (score >= 10) return 'HIGH' as RiskLevel; // 10, 12, 15, 16
    if (score >= 5) return 'MEDIUM' as RiskLevel; // 5, 6, 8, 9
    return 'LOW' as RiskLevel; // 1, 2, 3, 4
  }
}

export const riskService = new RiskService();
