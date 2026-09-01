import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pkAnalyticsService } from '@/modules/performance-management/analytics.service';
import { pkService } from '@/modules/performance-management/pk.service';
import { evaluationService } from '@/modules/performance-management/evaluation.service';
import { prisma } from '@/lib/prisma';
import { PlanStatus, RoleCode } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback(prisma)),
    user: {
      findMany: vi.fn(),
    },
    pKEvaluation: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
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

describe('Performance Management Analytics & Supervisor Allowlist Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should query eligible supervisors excluding students, parents, alumni, and komite', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'user-sup1', name: 'Ahmad Guru', unit: { id: 'u-1', name: 'SD IT' } },
    ] as any);

    const supervisors = await pkService.getSupervisors();

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          userRoles: expect.objectContaining({
            some: expect.objectContaining({
              isActive: true,
              role: expect.objectContaining({
                code: expect.objectContaining({
                  in: expect.arrayContaining([
                    'SUPER_ADMIN',
                    'SDIT_KEPALA_SEKOLAH',
                    'SDIT_GURU',
                  ]),
                }),
              }),
            }),
          }),
        }),
      })
    );
    expect(supervisors).toHaveLength(1);
    expect(supervisors[0].name).toBe('Ahmad Guru');
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

  it('should scope unit drilldown to the specified unit', async () => {
    vi.mocked(prisma.unit.findUnique).mockResolvedValue({ id: 'unit-1', name: 'SD IT' } as any);
    vi.mocked(prisma.strategicPlan.findFirst).mockResolvedValue({ id: 'sp-1', title: 'RKA SD IT', progress: 75 } as any);
    vi.mocked(prisma.performanceAgreement.findMany).mockResolvedValue([
      { id: 'pk-1', user: { id: 'u-1', name: 'Guru SD' }, overallScore: 88 },
    ] as any);

    const drilldown = await pkAnalyticsService.getUnitDrilldown('unit-1');

    expect(drilldown.unit?.name).toBe('SD IT');
    expect(drilldown.strategicPlan?.title).toBe('RKA SD IT');
    expect(drilldown.agreements).toHaveLength(1);
  });
});
