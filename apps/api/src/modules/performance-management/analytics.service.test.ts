import { describe, it, expect, beforeEach, vi } from 'vitest';
import { evaluationService } from './evaluation.service';
import { pkAnalyticsService } from './analytics.service';
import { prisma } from '@/lib/prisma';
import { PlanStatus } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pKEvaluation: {
      findUnique: vi.fn(),
      update: vi.fn(),
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

describe('Performance Management Analytics & Rollback Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should rollback evaluation approval status and feedback when syncToPKAndTalent fails', async () => {
    const mockEval = {
      id: 'eval-1',
      pkId: 'pk-1',
      status: PlanStatus.PROPOSED,
      feedback: 'Original Feedback',
      pk: { userId: 'user-1', supervisorId: 'sup-1' },
    };

    vi.mocked(prisma.pKEvaluation.findUnique).mockResolvedValue(mockEval as any);
    vi.mocked(prisma.pKEvaluation.update).mockResolvedValueOnce({
      ...mockEval,
      status: PlanStatus.APPROVED,
      feedback: 'New Supervisor Feedback',
    } as any);

    // Make syncToPKAndTalent fail
    vi.mocked(prisma.performanceAgreement.findUnique).mockRejectedValue(new Error('Sync failed'));

    await expect(
      evaluationService.approveEvaluation('eval-1', 'sup-1', false, 'New Supervisor Feedback')
    ).rejects.toThrow('Sync failed');

    // Verify rollback call was executed resetting status AND feedback
    expect(prisma.pKEvaluation.update).toHaveBeenLastCalledWith({
      where: { id: 'eval-1' },
      data: {
        status: PlanStatus.PROPOSED,
        feedback: 'Original Feedback',
      },
    });
  });

  it('should aggregate unit performance dashboard metrics correctly', async () => {
    vi.mocked(prisma.unit.findMany).mockResolvedValue([{ id: 'unit-1', name: 'SD IT' }] as any);
    vi.mocked(prisma.performanceAgreement.findMany)
      .mockResolvedValueOnce([]) // foundationPks
      .mockResolvedValueOnce([   // unit allPks
        { status: PlanStatus.APPROVED, overallScore: 87, totalScore: 85, behaviorScore: 90 },
        { status: PlanStatus.APPROVED, overallScore: 91, totalScore: 95, behaviorScore: 85 },
      ] as any)
      .mockResolvedValueOnce([   // approvedPksAll
        { overallScore: 87, totalScore: 85, behaviorScore: 90 },
        { overallScore: 91, totalScore: 95, behaviorScore: 85 },
      ] as any);

    vi.mocked(prisma.pKEvaluation.count)
      .mockResolvedValueOnce(0) // foundationEvCount
      .mockResolvedValueOnce(2); // unit evCount

    const dashboard = await pkAnalyticsService.getUnitPerformanceDashboard();

    expect(dashboard.totalAgreements).toBe(2);
    expect(dashboard.approvedAgreements).toBe(2);
    expect(dashboard.totalEvaluations).toBe(2);
    expect(dashboard.avgPerformanceScore).toBe(90);
    expect(dashboard.avgBehaviorScore).toBe(87.5);
  });
});
