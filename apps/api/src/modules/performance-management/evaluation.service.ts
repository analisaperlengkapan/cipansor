import { prisma } from '@/lib/prisma';
import { PlanStatus } from '@prisma/client';
import { Errors } from '@/middleware/error';

export class EvaluationService {
  // ==================== BEHAVIORAL VALUES (ADMIN) ====================

  async createBehavioralValue(data: { name: string; description?: string; weight: number }) {
    return prisma.behavioralValue.create({ data });
  }

  async getBehavioralValues() {
    return prisma.behavioralValue.findMany({ where: { isActive: true } });
  }

  async updateBehavioralValue(id: string, data: any) {
    return prisma.behavioralValue.update({ where: { id }, data });
  }

  async deleteBehavioralValue(id: string) {
    return prisma.behavioralValue.update({ where: { id }, data: { isActive: false } });
  }

  // ==================== EVALUATIONS ====================

  async createEvaluation(data: { pkId: string; month: number; year: number; feedback?: string; notes?: string }) {
    const pk = await prisma.performanceAgreement.findUnique({
      where: { id: data.pkId },
      include: { indicators: true },
    });

    if (!pk) throw Errors.notFound('PK not found');
    if (pk.status !== 'APPROVED') throw Errors.badRequest('Cannot evaluate a PK that is not APPROVED');

    const period = new Date(data.year, data.month - 1, 1);

    // Create the evaluation
    const evaluation = await prisma.pkEvaluation.create({
      data: {
        pkId: data.pkId,
        month: data.month,
        year: data.year,
        period,
        feedback: data.feedback,
        notes: data.notes,
      },
    });

    // Initialize indicator details
    const indicatorDetails = pk.indicators.map((ind) => ({
      evaluationId: evaluation.id,
      indicatorId: ind.id,
      realization: 0,
    }));

    await prisma.pkIndicatorEvaluation.createMany({ data: indicatorDetails });

    // Initialize behavior details with SAFTI or whatever is configured
    const behaviorValues = await this.getBehavioralValues();
    const behaviorDetails = behaviorValues.map((bv) => ({
      evaluationId: evaluation.id,
      behaviorValueId: bv.id,
      score: 0,
    }));

    await prisma.pkBehaviorEvaluation.createMany({ data: behaviorDetails });

    return this.getEvaluationById(evaluation.id);
  }

  async getEvaluationById(id: string) {
    return prisma.pkEvaluation.findUnique({
      where: { id },
      include: {
        pk: {
          include: {
            user: { select: { id: true, name: true } },
            supervisor: { select: { id: true, name: true } },
          },
        },
        indicatorDetails: {
          include: { indicator: true },
        },
        behaviorDetails: {
          include: { behaviorValue: true },
        },
      },
    });
  }

  async updateIndicatorRealization(id: string, detailId: string, data: { realization: number; activities?: string }) {
    const detail = await prisma.pkIndicatorEvaluation.update({
      where: { id: detailId },
      data: {
        realization: data.realization,
        activities: data.activities,
      },
      include: { indicator: true },
    });

    // Calculate score for this indicator in this month
    const target = detail.indicator.target;
    let score = 0;
    if (target > 0) {
      score = Math.min(100, (data.realization / target) * 100);
    } else if (target === 0 && data.realization === 0) {
      score = 100;
    }

    await prisma.pkIndicatorEvaluation.update({
      where: { id: detailId },
      data: { score },
    });

    await this.recalculateEvaluationScores(detail.evaluationId);
    return detail;
  }

  async updateBehaviorScore(id: string, detailId: string, data: { score: number; notes?: string }) {
    const detail = await prisma.pkBehaviorEvaluation.update({
      where: { id: detailId },
      data: {
        score: data.score,
        notes: data.notes,
      },
    });

    await this.recalculateEvaluationScores(detail.evaluationId);
    return detail;
  }

  async recalculateEvaluationScores(evaluationId: string) {
    const evaluation = await prisma.pkEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        indicatorDetails: { include: { indicator: true } },
        behaviorDetails: { include: { behaviorValue: true } },
      },
    });

    if (!evaluation) return;

    // Performance Score: Weighted average of indicators
    const performanceScore = evaluation.indicatorDetails.reduce((sum, det) => {
      return sum + (det.score * det.indicator.weight) / 100;
    }, 0);

    // Behavior Score: Average of behavioral values
    const behaviorScore = evaluation.behaviorDetails.length > 0
      ? evaluation.behaviorDetails.reduce((sum, det) => sum + det.score, 0) / evaluation.behaviorDetails.length
      : 0;

    // Overall Score: 70% performance, 30% behavior (standard best practice)
    const overallScore = (performanceScore * 0.7) + (behaviorScore * 0.3);

    await prisma.pkEvaluation.update({
      where: { id: evaluationId },
      data: {
        performanceScore,
        behaviorScore,
        overallScore,
      },
    });

    // If approved, update YTD realization in indicators and sync to Talent module
    if (evaluation.status === 'APPROVED') {
      await this.syncToPKAndTalent(evaluation.pkId);
    }
  }

  async approveEvaluation(id: string) {
    const evaluation = await prisma.pkEvaluation.update({
      where: { id },
      data: { status: 'APPROVED' as PlanStatus },
    });

    await this.syncToPKAndTalent(evaluation.pkId);
    return evaluation;
  }

  private async syncToPKAndTalent(pkId: string) {
    const pk = await prisma.performanceAgreement.findUnique({
      where: { id: pkId },
      include: {
        indicators: {
          include: {
            evaluations: {
              where: { evaluation: { status: 'APPROVED' } },
            },
          },
        },
        evaluations: {
          where: { status: 'APPROVED' },
        },
      },
    });

    if (!pk) return;

    // 1. Update YTD realization for each indicator
    for (const indicator of pk.indicators) {
      const totalRealization = indicator.evaluations.reduce((sum, ev) => sum + ev.realization, 0);
      await prisma.pkIndicator.update({
        where: { id: indicator.id },
        data: { realization: totalRealization },
      });
    }

    // 2. Update PK total scores (average of approved monthly evaluations)
    const approvedCount = pk.evaluations.length;
    if (approvedCount > 0) {
      const avgPerformance = pk.evaluations.reduce((sum, ev) => sum + ev.performanceScore, 0) / approvedCount;
      const avgBehavior = pk.evaluations.reduce((sum, ev) => sum + ev.behaviorScore, 0) / approvedCount;
      const avgOverall = pk.evaluations.reduce((sum, ev) => sum + ev.overallScore, 0) / approvedCount;

      await prisma.performanceAgreement.update({
        where: { id: pkId },
        data: {
          totalScore: avgPerformance,
          behaviorScore: avgBehavior,
          overallScore: avgOverall,
        },
      });

      // 3. Sync to Talent Matrix if profile exists
      const talentProfile = await prisma.talentProfile.findUnique({ where: { userId: pk.userId } });
      if (talentProfile) {
        let rating: 'OUTSTANDING' | 'EXCEEDS' | 'MEETS' | 'BELOW' | 'UNSATISFACTORY';
        if (avgOverall >= 90) rating = 'OUTSTANDING';
        else if (avgOverall >= 80) rating = 'EXCEEDS';
        else if (avgOverall >= 70) rating = 'MEETS';
        else if (avgOverall >= 60) rating = 'BELOW';
        else rating = 'UNSATISFACTORY';

        // Add a new talent assessment automatically
        await prisma.talentAssessment.create({
          data: {
            talentId: talentProfile.id,
            assessorId: pk.supervisorId || '00000000-0000-0000-0000-000000000000',
            period: `PK Performance Sync ${new Date().getFullYear()}`,
            performanceRating: rating,
            potentialRating: 'MEETS', // Default, needs manual adjustment
            overallScore: avgOverall,
            feedback: `Automated sync from Performance Agreement (PK). Performance: ${avgPerformance.toFixed(2)}, Behavior: ${avgBehavior.toFixed(2)}`,
            assessedAt: new Date(),
          },
        });
      }
    }
  }
}

export const evaluationService = new EvaluationService();
