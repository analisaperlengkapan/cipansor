import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    performanceAgreement: { findUnique: vi.fn(), update: vi.fn() },
    pKEvaluation: { findUnique: vi.fn(), update: vi.fn() },
    pKIndicator: { update: vi.fn() },
    pKIndicatorEvaluation: { findUnique: vi.fn(), update: vi.fn() },
    pKBehaviorEvaluation: { findUnique: vi.fn(), update: vi.fn() },
    behavioralValue: { findMany: vi.fn() },
    talentProfile: { findUnique: vi.fn() },
    talentAssessment: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { evaluationService } from './evaluation.service';

const mocked = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>> & {
  $transaction: ReturnType<typeof vi.fn>;
};

describe('EvaluationService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('recalculateEvaluationScores', () => {
    it('computes weighted performance, weighted SAFTI behavior, and 70/30 overall', async () => {
      mocked.pKEvaluation.findUnique.mockResolvedValue({
        id: 'ev-1',
        pkId: 'pk-1',
        status: 'DRAFT',
        indicatorDetails: [
          { score: 100, indicator: { weight: 60 } },
          { score: 50, indicator: { weight: 40 } },
        ],
        behaviorDetails: [
          { score: 90, behaviorValue: { weight: 1 } },
          { score: 70, behaviorValue: { weight: 1 } },
        ],
      });
      mocked.pKEvaluation.update.mockResolvedValue({});

      await evaluationService.recalculateEvaluationScores('ev-1');

      const args = mocked.pKEvaluation.update.mock.calls[0][0];
      // performance = 100*0.6 + 50*0.4 = 80; behavior = (90+70)/2 = 80
      expect(args.data.performanceScore).toBe(80);
      expect(args.data.behaviorScore).toBe(80);
      expect(args.data.overallScore).toBeCloseTo(80);
    });

    it('respects unequal behavioral-value weights', async () => {
      mocked.pKEvaluation.findUnique.mockResolvedValue({
        id: 'ev-1',
        pkId: 'pk-1',
        status: 'DRAFT',
        indicatorDetails: [],
        behaviorDetails: [
          { score: 100, behaviorValue: { weight: 3 } },
          { score: 0, behaviorValue: { weight: 1 } },
        ],
      });
      mocked.pKEvaluation.update.mockResolvedValue({});

      await evaluationService.recalculateEvaluationScores('ev-1');

      const args = mocked.pKEvaluation.update.mock.calls[0][0];
      expect(args.data.behaviorScore).toBe(75);
    });
  });

  describe('createEvaluation', () => {
    it('refuses to evaluate a PK that is not APPROVED', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        id: 'pk-1',
        userId: 'u-1',
        supervisorId: null,
        status: 'DRAFT',
        indicators: [],
      });

      await expect(
        evaluationService.createEvaluation('u-1', false, { pkId: 'pk-1', month: 1, year: 2026 })
      ).rejects.toThrow(/APPROVED/);
      expect(mocked.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('approveEvaluation', () => {
    it('only the supervisor may approve and double approval conflicts', async () => {
      mocked.pKEvaluation.findUnique.mockResolvedValue({
        id: 'ev-1',
        pkId: 'pk-1',
        status: 'DRAFT',
        pk: { userId: 'u-1', supervisorId: 'u-boss' },
      });

      await expect(evaluationService.approveEvaluation('ev-1', 'u-1', false)).rejects.toThrow();

      mocked.pKEvaluation.findUnique.mockResolvedValue({
        id: 'ev-1',
        pkId: 'pk-1',
        status: 'APPROVED',
        pk: { userId: 'u-1', supervisorId: 'u-boss' },
      });
      await expect(
        evaluationService.approveEvaluation('ev-1', 'u-boss', false)
      ).rejects.toThrow(/already approved/i);
    });

    it('approves and rolls YTD + PK aggregates up, skipping talent sync without supervisor', async () => {
      mocked.pKEvaluation.findUnique.mockResolvedValue({
        id: 'ev-1',
        pkId: 'pk-1',
        status: 'DRAFT',
        pk: { userId: 'u-1', supervisorId: 'u-boss' },
      });
      mocked.pKEvaluation.update.mockResolvedValue({ id: 'ev-1', status: 'APPROVED' });
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        id: 'pk-1',
        userId: 'u-1',
        supervisorId: null, // supervisor removed since — no talent sync
        periodStart: new Date('2026-01-01'),
        indicators: [
          { id: 'ind-1', evaluations: [{ realization: 3 }, { realization: 4 }] },
        ],
        evaluations: [
          { performanceScore: 80, behaviorScore: 90, overallScore: 83 },
          { performanceScore: 60, behaviorScore: 70, overallScore: 63 },
        ],
      });
      mocked.pKIndicator.update.mockResolvedValue({});
      mocked.performanceAgreement.update.mockResolvedValue({});

      await evaluationService.approveEvaluation('ev-1', 'u-boss', false);

      expect(mocked.pKIndicator.update).toHaveBeenCalledWith({
        where: { id: 'ind-1' },
        data: { realization: 7 },
      });
      const pkUpdate = mocked.performanceAgreement.update.mock.calls[0][0];
      expect(pkUpdate.data.totalScore).toBe(70);
      expect(pkUpdate.data.behaviorScore).toBe(80);
      expect(pkUpdate.data.overallScore).toBe(73);
      expect(mocked.talentProfile.findUnique).not.toHaveBeenCalled();
    });

    it('updates the existing talent assessment instead of stacking new rows', async () => {
      mocked.pKEvaluation.findUnique.mockResolvedValue({
        id: 'ev-1',
        pkId: 'pk-1',
        status: 'DRAFT',
        pk: { userId: 'u-1', supervisorId: 'u-boss' },
      });
      mocked.pKEvaluation.update.mockResolvedValue({ id: 'ev-1', status: 'APPROVED' });
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        id: 'pk-1',
        userId: 'u-1',
        supervisorId: 'u-boss',
        periodStart: new Date('2026-01-01'),
        indicators: [],
        evaluations: [{ performanceScore: 95, behaviorScore: 90, overallScore: 93.5 }],
      });
      mocked.performanceAgreement.update.mockResolvedValue({});
      mocked.talentProfile.findUnique.mockResolvedValue({
        id: 'tp-1',
        assessments: [{ potentialRating: 'EXCEEDS' }],
      });
      mocked.talentAssessment.findFirst.mockResolvedValue({ id: 'ta-existing' });
      mocked.talentAssessment.update.mockResolvedValue({});

      await evaluationService.approveEvaluation('ev-1', 'u-boss', false);

      expect(mocked.talentAssessment.create).not.toHaveBeenCalled();
      const taUpdate = mocked.talentAssessment.update.mock.calls[0][0];
      expect(taUpdate.where).toEqual({ id: 'ta-existing' });
      expect(taUpdate.data.performanceRating).toBe('OUTSTANDING');
      // Potential is carried forward from the latest human assessment.
      expect(taUpdate.data.potentialRating).toBe('EXCEEDS');
    });
  });
});
