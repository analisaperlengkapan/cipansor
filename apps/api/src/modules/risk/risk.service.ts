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

  async getRisks(unitId: string, query: { category?: any; riskLevel?: any }): Promise<Risk[]> {
    const where: Prisma.RiskWhereInput = {
      unitId,
    };

    if (query.category) where.category = query.category;
    if (query.riskLevel) where.riskLevel = query.riskLevel;

    return prisma.risk.findMany({
      where,
      include: {
        mitigations: true,
        createdBy: {
          select: { id: true, name: true },
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
  private calculateRiskScore(likelihood: RiskLikelihood, impact: RiskImpact): number {
    const likelihoodMap: Record<string, number> = {
      [RiskLikelihood.RARE]: 1,
      [RiskLikelihood.UNLIKELY]: 2,
      [RiskLikelihood.POSSIBLE]: 3,
      [RiskLikelihood.LIKELY]: 4,
      [RiskLikelihood.ALMOST_CERTAIN]: 5,
    };
    const impactMap: Record<string, number> = {
      [RiskImpact.INSIGNIFICANT]: 1,
      [RiskImpact.MINOR]: 2,
      [RiskImpact.MODERATE]: 3,
      [RiskImpact.MAJOR]: 4,
      [RiskImpact.CATASTROPHIC]: 5,
    };

    const l = likelihoodMap[likelihood] || 1;
    const i = impactMap[impact] || 1;

    return l * i;
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score >= 20) return RiskLevel.EXTREME; // 20, 25
    if (score >= 10) return RiskLevel.HIGH; // 10, 12, 15, 16
    if (score >= 5) return RiskLevel.MEDIUM; // 5, 6, 8, 9
    return RiskLevel.LOW; // 1, 2, 3, 4
  }
}

export const riskService = new RiskService();
