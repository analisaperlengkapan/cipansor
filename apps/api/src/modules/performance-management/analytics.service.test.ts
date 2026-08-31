import { describe, it, expect, beforeEach, vi } from 'vitest';
import { evaluationService } from './evaluation.service';
import { pkAnalyticsService } from './analytics.service';
import { prisma } from '@/lib/prisma';
import { PlanStatus } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback(prisma)),
    pKEvaluation: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    performanceAgreement: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    pKIndicator: {
      update: vi.fn(),
    },
    pKIndicatorEvaluation: {
      createMany: vi.fn(),
    },
    pKBehaviorEvaluation: {
      createMany: vi.fn(),
    },
    behavioralValue: {
      findMany: vi.fn(),
    },
    talentProfile: {
      findUnique: vi.fn(),
    },
    unit: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    strategicPlan: {
      findFirst: vi.fn(),
    },
  },
}));

describe('Performance Management Analytics & Atomic Rollback Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject evaluation creation outside the PK agreement period', async () => {
    const mockPk = {
      id: 'pk-1',
      userId: 'user-1',
      status: PlanStatus.APPROVED,
      periodStart: new Date(2026, 0, 1), // Jan 1, 2026
      periodEnd: new Date(2026, 11, 31), // Dec 31, 2026
      indicators: [],
    };

    vi.mocked(prisma.performanceAgreement.findUnique).mockResolvedValue(mockPk as any);

    // Attempt creation for Jan 2025 (out of period)
    await expect(
      evaluationService.createEvaluation('user-1', false, {
        pkId: 'pk-1',
        month: 1,
        year: 2025,
      })
    ).rejects.toThrow('Evaluation month and year must fall within the PK agreement period');
  });

  it('should execute approval and sync atomically within a single transaction', async () => {
    const mockEval = {
      id: 'eval-1',
      pkId: 'pk-1',
      status: PlanStatus.PROPOSED,
      feedback: 'Original Feedback',
      pk: { id: 'pk-1', userId: 'user-1', supervisorId: 'sup-1', periodStart: new Date(2026, 0, 1) },
    };

    vi.mocked(prisma.pKEvaluation.findUnique).mockResolvedValue(mockEval as any);
    vi.mocked(prisma.pKEvaluation.update).mockResolvedValueOnce({
      ...mockEval,
      status: PlanStatus.APPROVED,
      feedback: 'New Supervisor Feedback',
    } as any);

    vi.mocked(prisma.performanceAgreement.findUnique).mockResolvedValue({
      id: 'pk-1',
      userId: 'user-1',
      supervisorId: 'sup-1',
      periodStart: new Date(2026, 0, 1),
      indicators: [],
      evaluations: [{ performanceScore: 90, behaviorScore: 90, overallScore: 90 }],
    } as any);

    await evaluationService.approveEvaluation('eval-1', 'sup-1', false, 'New Supervisor Feedback');

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.pKEvaluation.update).toHaveBeenCalledWith({
      where: { id: 'eval-1' },
      data: {
        status: PlanStatus.APPROVED,
        feedback: 'New Supervisor Feedback',
      },
    });
  });
});
