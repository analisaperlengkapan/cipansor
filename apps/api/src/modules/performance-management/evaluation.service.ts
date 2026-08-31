import { prisma } from '@/lib/prisma';
import { PlanStatus, PerformanceRating } from '@prisma/client';
import { Errors } from '@/middleware/error';
import { pkService } from './pk.service';

/**
 * Monthly PK evaluations: realizations per indicator, SAFTI behavior
 * scores, weighted score roll-ups, and (on approval) YTD sync to the
 * PK plus an automated talent-matrix assessment.
 */
export class EvaluationService {
  // ==================== BEHAVIORAL VALUES (ADMIN) ====================

  async createBehavioralValue(data: { name: string; description?: string; weight: number }) {
    return prisma.behavioralValue.create({ data });
  }

  async getBehavioralValues() {
    return prisma.behavioralValue.findMany({ where: { isActive: true } });
  }

  async updateBehavioralValue(
    id: string,
    data: { name?: string; description?: string; weight?: number; isActive?: boolean }
  ) {
    return prisma.behavioralValue.update({ where: { id }, data });
  }

  async deleteBehavioralValue(id: string) {
    // Soft-deactivate so historical evaluations keep their reference.
    return prisma.behavioralValue.update({ where: { id }, data: { isActive: false } });
  }

  // ==================== EVALUATIONS ====================

  async createEvaluation(
    callerId: string,
    isAdmin: boolean,
    data: { pkId: string; month: number; year: number; feedback?: string; notes?: string }
  ) {
    const pk = await prisma.performanceAgreement.findUnique({
      where: { id: data.pkId },
      include: { indicators: true },
    });

    if (!pk) throw Errors.notFound('PK');
    pkService.assertAccess(pk, callerId, isAdmin);
    if (pk.status !== PlanStatus.APPROVED) {
      throw Errors.badRequest('Cannot evaluate a PK that is not APPROVED');
    }

    // Validate that month and year fall within the PK agreement period
    const evalDate = new Date(data.year, data.month - 1, 1);
    const startMonthDate = new Date(pk.periodStart.getFullYear(), pk.periodStart.getMonth(), 1);
    const endMonthDate = new Date(pk.periodEnd.getFullYear(), pk.periodEnd.getMonth(), 1);

    if (evalDate < startMonthDate || evalDate > endMonthDate) {
      throw Errors.badRequest('Evaluation month and year must fall within the PK agreement period');
    }

    const behaviorValues = await this.getBehavioralValues();
    const period = new Date(data.year, data.month - 1, 1);

    const evaluation = await prisma.$transaction(async (tx) => {
      const created = await tx.pKEvaluation.create({
        data: {
          pkId: data.pkId,
          month: data.month,
          year: data.year,
          period,
          feedback: data.feedback,
          notes: data.notes,
        },
      });

      await tx.pKIndicatorEvaluation.createMany({
        data: pk.indicators.map((ind) => ({
          evaluationId: created.id,
          indicatorId: ind.id,
          realization: 0,
        })),
      });

      await tx.pKBehaviorEvaluation.createMany({
        data: behaviorValues.map((bv) => ({
          evaluationId: created.id,
          behaviorValueId: bv.id,
          score: 0,
        })),
      });

      return created;
    });

    return this.getEvaluationById(evaluation.id);
  }

  async getEvaluationById(id: string) {
    return prisma.pKEvaluation.findUnique({
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

  /** Loads an evaluation and checks it is still editable by the caller. */
  private async loadEditableEvaluation(evaluationId: string, callerId: string, isAdmin: boolean) {
    const evaluation = await prisma.pKEvaluation.findUnique({
      where: { id: evaluationId },
      include: { pk: true },
    });
    if (!evaluation) throw Errors.notFound('Evaluation');
    pkService.assertAccess(evaluation.pk, callerId, isAdmin);
    if (evaluation.status === PlanStatus.APPROVED) {
      throw Errors.badRequest('An approved evaluation can no longer be edited');
    }
    return evaluation;
  }

  async updateIndicatorRealization(
    evaluationId: string,
    indicatorId: string,
    callerId: string,
    isAdmin: boolean,
    data: { realization: number; activities?: string }
  ) {
    await this.loadEditableEvaluation(evaluationId, callerId, isAdmin);

    const detail = await prisma.pKIndicatorEvaluation.findUnique({
      where: { evaluationId_indicatorId: { evaluationId, indicatorId } },
      include: { indicator: true },
    });
    if (!detail) throw Errors.notFound('Indicator detail for this evaluation');

    // Score the month: realization vs target, capped at 100.
    const target = detail.indicator.target;
    let score = 0;
    if (target > 0) {
      score = Math.min(100, (data.realization / target) * 100);
    } else if (target === 0 && data.realization === 0) {
      score = 100;
    }

    const updated = await prisma.pKIndicatorEvaluation.update({
      where: { id: detail.id },
      data: {
        realization: data.realization,
        activities: data.activities,
        score,
      },
      include: { indicator: true },
    });

    await this.recalculateEvaluationScores(evaluationId);
    return updated;
  }

  async updateBehaviorScore(
    evaluationId: string,
    behaviorValueId: string,
    callerId: string,
    isAdmin: boolean,
    data: { score: number; notes?: string }
  ) {
    await this.loadEditableEvaluation(evaluationId, callerId, isAdmin);

    const detail = await prisma.pKBehaviorEvaluation.findUnique({
      where: { evaluationId_behaviorValueId: { evaluationId, behaviorValueId } },
    });
    if (!detail) throw Errors.notFound('Behavior detail for this evaluation');

    const updated = await prisma.pKBehaviorEvaluation.update({
      where: { id: detail.id },
      data: { score: data.score, notes: data.notes },
    });

    await this.recalculateEvaluationScores(evaluationId);
    return updated;
  }

  async recalculateEvaluationScores(evaluationId: string) {
    const evaluation = await prisma.pKEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        indicatorDetails: { include: { indicator: true } },
        behaviorDetails: { include: { behaviorValue: true } },
      },
    });

    if (!evaluation) return;

    // Performance: weighted by indicator weight (weights total 100).
    const performanceScore = evaluation.indicatorDetails.reduce(
      (sum, det) => sum + (det.score * det.indicator.weight) / 100,
      0
    );

    // Behavior: weighted by BehavioralValue.weight (simple average when
    // all weights are equal, which is the SAFTI default).
    const totalBehaviorWeight = evaluation.behaviorDetails.reduce(
      (sum, det) => sum + det.behaviorValue.weight,
      0
    );
    const behaviorScore =
      totalBehaviorWeight > 0
        ? evaluation.behaviorDetails.reduce(
            (sum, det) => sum + det.score * det.behaviorValue.weight,
            0
          ) / totalBehaviorWeight
        : 0;

    // Overall: 60% performance, 40% behavior (as per Cipansor SAFTI standard).
    const overallScore = performanceScore * 0.6 + behaviorScore * 0.4;

    await prisma.pKEvaluation.update({
      where: { id: evaluationId },
      data: { performanceScore, behaviorScore, overallScore },
    });
  }

  async approveEvaluation(id: string, callerId: string, isAdmin: boolean, feedback?: string) {
    return prisma.$transaction(async (tx) => {
      const evaluation = await tx.pKEvaluation.findUnique({
        where: { id },
        include: { pk: true },
      });
      if (!evaluation) throw Errors.notFound('Evaluation');
      pkService.assertAccess(evaluation.pk, callerId, isAdmin, { supervisorOnly: true });
      if (evaluation.status === PlanStatus.APPROVED) {
        throw Errors.conflict('Evaluation already approved');
      }

      const updated = await tx.pKEvaluation.update({
        where: { id },
        data: {
          status: PlanStatus.APPROVED,
          feedback: feedback !== undefined ? feedback : evaluation.feedback,
        },
      });

      await this.syncToPKAndTalentInTx(tx, evaluation.pkId);
      return updated;
    });
  }

  /**
   * After an evaluation is approved: roll YTD realizations up into the
   * PK indicators, refresh the PK's aggregate scores, and mirror the
   * result into the talent matrix when a talent profile exists. Executed
   * within the approval Prisma transaction client for full atomicity.
   */
  private async syncToPKAndTalentInTx(tx: any, pkId: string) {
    const pk = await tx.performanceAgreement.findUnique({
      where: { id: pkId },
      include: {
        indicators: {
          include: {
            evaluations: {
              where: { evaluation: { status: PlanStatus.APPROVED } },
            },
          },
        },
        evaluations: {
          where: { status: PlanStatus.APPROVED },
        },
      },
    });

    if (!pk) return;

    // 1. YTD realization per indicator (sum of approved monthly entries).
    for (const indicator of pk.indicators) {
      const totalRealization = indicator.evaluations.reduce(
        (sum: number, ev: any) => sum + ev.realization,
        0
      );
      await tx.pKIndicator.update({
        where: { id: indicator.id },
        data: { realization: totalRealization },
      });
    }

    // 2. PK aggregate scores = average of approved monthly evaluations.
    const approvedCount = pk.evaluations.length;
    if (approvedCount === 0) return;

    const avgPerformance =
      pk.evaluations.reduce((sum: number, ev: any) => sum + ev.performanceScore, 0) / approvedCount;
    const avgBehavior =
      pk.evaluations.reduce((sum: number, ev: any) => sum + ev.behaviorScore, 0) / approvedCount;
    const avgOverall =
      pk.evaluations.reduce((sum: number, ev: any) => sum + ev.overallScore, 0) / approvedCount;

    await tx.performanceAgreement.update({
      where: { id: pkId },
      data: {
        totalScore: avgPerformance,
        behaviorScore: avgBehavior,
        overallScore: avgOverall,
      },
    });

    // 3. Mirror into the talent matrix. Requires a real assessor — skip
    //    when the PK has no supervisor rather than inventing one.
    if (!pk.supervisorId) return;

    const talentProfile = await tx.talentProfile.findUnique({
      where: { userId: pk.userId },
      include: { assessments: { orderBy: { assessedAt: 'desc' }, take: 1 } },
    });
    if (!talentProfile) return;

    let rating: PerformanceRating;
    if (avgOverall >= 90) rating = PerformanceRating.OUTSTANDING;
    else if (avgOverall >= 80) rating = PerformanceRating.EXCEEDS;
    else if (avgOverall >= 70) rating = PerformanceRating.MEETS;
    else if (avgOverall >= 60) rating = PerformanceRating.BELOW;
    else rating = PerformanceRating.UNSATISFACTORY;

    const period = `PK Sync ${pk.periodStart.getFullYear()} (${pkId.slice(0, 8)})`;
    const assessmentData = {
      performanceRating: rating,
      potentialRating: talentProfile.assessments[0]?.potentialRating ?? PerformanceRating.MEETS,
      overallScore: avgOverall,
      feedback:
        `Automated sync from Perjanjian Kinerja. Performance: ${avgPerformance.toFixed(2)}, ` +
        `Behavior (SAFTI): ${avgBehavior.toFixed(2)}. Potential rating carried forward — review manually.`,
      assessedAt: new Date(),
    };

    const existing = await tx.talentAssessment.findFirst({
      where: { talentId: talentProfile.id, period },
    });
    if (existing) {
      await tx.talentAssessment.update({ where: { id: existing.id }, data: assessmentData });
    } else {
      await tx.talentAssessment.create({
        data: {
          talentId: talentProfile.id,
          assessorId: pk.supervisorId,
          period,
          ...assessmentData,
        },
      });
    }
  }
}

export const evaluationService = new EvaluationService();
