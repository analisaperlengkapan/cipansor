import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { perencanaanService } from './perencanaan.service';

// Mock external dependencies
vi.mock('../../lib/prisma', () => ({
  prisma: {
    strategicPlan: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    planObjective: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    planIndicator: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    planActivity: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    risk: {
      findMany: vi.fn(),
    },
    journalEntry: {
      aggregate: vi.fn(),
    },
  },
}));

describe('Perencanaan Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Strategic Plans', () => {
    it('should create a plan', async () => {
      const dto = {
        title: 'Rencana Jangka Panjang',
        type: 'RENSTRA' as any,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        budget: 50000000,
        unitId: 'unit-1',
        createdById: 'user-1',
      };

      vi.mocked(prisma.strategicPlan.create).mockResolvedValue({ id: 'plan-1', ...dto } as any);

      await perencanaanService.createPlan(dto);

      expect(prisma.strategicPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Rencana Jangka Panjang',
          type: 'RENSTRA',
        }),
        include: expect.any(Object),
      });
    });

    it('should approve plan', async () => {
      vi.mocked(prisma.strategicPlan.update).mockResolvedValue({ id: 'plan-1' } as any);

      await perencanaanService.approvePlan('plan-1', 'user-2');

      expect(prisma.strategicPlan.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: expect.objectContaining({
          status: 'APPROVED',
          approvedBy: { connect: { id: 'user-2' } },
        }),
      });
    });
  });

  describe('Objectives and Progress', () => {
    it('should calculate objective progress and update plan progress', async () => {
      const objData = {
        planId: 'plan-1',
        title: 'Meningkatkan Mutu',
        weight: 60,
      };

      vi.mocked(prisma.planObjective.create).mockResolvedValue({ id: 'obj-1', ...objData } as any);
      
      // Mocks for progress recalculation
      vi.mocked(prisma.planObjective.findMany).mockResolvedValue([
        { weight: 60, progress: 50 },
        { weight: 40, progress: 100 },
      ] as any);
      vi.mocked(prisma.risk.findMany).mockResolvedValue([] as any);

      vi.mocked(prisma.strategicPlan.update).mockResolvedValue({} as any);

      await perencanaanService.createObjective(objData);

      expect(prisma.strategicPlan.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        // (60*50 + 40*100) / 100 = (3000 + 4000) / 100 = 70
        data: { progress: 70 },
      });
    });

    it('should update progress on objective delete', async () => {
      vi.mocked(prisma.planObjective.findUnique).mockResolvedValue({ planId: 'plan-1' } as any);
      vi.mocked(prisma.planObjective.delete).mockResolvedValue({} as any);

      vi.mocked(prisma.planObjective.findMany).mockResolvedValue([
        { weight: 100, progress: 20 },
      ] as any);
      vi.mocked(prisma.risk.findMany).mockResolvedValue([] as any);

      await perencanaanService.deleteObjective('obj-1');

      expect(prisma.strategicPlan.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: { progress: 20 },
      });
    });
  });

  describe('Indicators and Activities', () => {
    it('should create indicator', async () => {
      const dto = {
        objectiveId: 'obj-1',
        name: 'Nilai UN Average',
        unit: 'Score',
        targetValue: 8.5,
      };

      vi.mocked(prisma.planIndicator.create).mockResolvedValue({ id: 'ind-1' } as any);
      // createIndicator recalculates objective progress, loading the objective + indicators.
      vi.mocked(prisma.planObjective.findUnique).mockResolvedValue({
        id: 'obj-1',
        planId: 'plan-1',
        indicators: [],
      } as any);
      vi.mocked(prisma.planObjective.update).mockResolvedValue({} as any);
      vi.mocked(prisma.planObjective.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.risk.findMany).mockResolvedValue([] as any);

      await perencanaanService.createIndicator(dto);

      expect(prisma.planIndicator.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Nilai UN Average',
          targetValue: 8.5,
        }),
      });
    });

    it('should create activity with budget linkage', async () => {
      const dto = {
        objectiveId: 'obj-1',
        title: 'Pemantapan UN',
        priority: 'HIGH' as any,
        budget: 5000000,
        budgetId: 'budget-123',
      };

      vi.mocked(prisma.planActivity.create).mockResolvedValue({ id: 'act-1' } as any);

      await perencanaanService.createActivity(dto);

      expect(prisma.planActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Pemantapan UN',
          priority: 'HIGH',
          budgetRel: { connect: { id: 'budget-123' } },
        }),
        include: expect.objectContaining({
          budgetRel: expect.any(Object),
        }),
      });
    });

    it('should update activity with budget linkage', async () => {
      const dto = {
        title: 'Pemantapan UN Updated',
        budgetId: 'budget-456',
      };

      vi.mocked(prisma.planActivity.update).mockResolvedValue({ id: 'act-1' } as any);

      await perencanaanService.updateActivity('act-1', dto);

      expect(prisma.planActivity.update).toHaveBeenCalledWith({
        where: { id: 'act-1' },
        data: expect.objectContaining({
          title: 'Pemantapan UN Updated',
          budgetRel: { connect: { id: 'budget-456' } },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('Budget Realization', () => {
    it('should calculate budget realization from journal entries', async () => {
      const planId = 'plan-123';
      const mockPlan = {
        id: planId,
        unitId: 'unit-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        objectives: [
          {
            id: 'obj-1',
            activities: [
              {
                id: 'act-1',
                budget: { toNumber: () => 1000000 },
                budgetRel: {
                  accountId: 'acc-1',
                  account: { normalBalance: 'DEBIT' }
                }
              }
            ]
          }
        ]
      };

      vi.mocked(prisma.strategicPlan.findUnique).mockResolvedValue(mockPlan as any);
      vi.mocked(prisma.journalEntry.aggregate).mockResolvedValue({
        _sum: { debit: { toNumber: () => 500000 }, credit: { toNumber: () => 100000 } }
      } as any);

      const result = await perencanaanService.getPlanById(planId);

      expect(result.totalRealization).toBe(400000); // 500k - 100k
      expect(result.financialProgress).toBe(40); // 400k / 1m
      expect(prisma.journalEntry.aggregate).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ accountId: 'acc-1' })
      }));
    });

    it('should not double-count realization when activities share the same budget account', async () => {
      const planId = 'plan-shared';
      const mockPlan = {
        id: planId,
        unitId: 'unit-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        objectives: [
          {
            id: 'obj-1',
            activities: [
              {
                id: 'act-1',
                budget: { toNumber: () => 600000 },
                budgetRel: {
                  accountId: 'acc-shared',
                  account: { normalBalance: 'DEBIT' }
                }
              },
              {
                id: 'act-2',
                budget: { toNumber: () => 400000 },
                budgetRel: {
                  accountId: 'acc-shared',
                  account: { normalBalance: 'DEBIT' }
                }
              }
            ]
          }
        ]
      };

      vi.mocked(prisma.strategicPlan.findUnique).mockResolvedValue(mockPlan as any);
      vi.mocked(prisma.journalEntry.aggregate).mockResolvedValue({
        _sum: { debit: { toNumber: () => 500000 }, credit: { toNumber: () => 0 } }
      } as any);

      const result = await perencanaanService.getPlanById(planId);

      // Journal aggregate should be called only ONCE for the shared account
      expect(prisma.journalEntry.aggregate).toHaveBeenCalledTimes(1);

      // Total realization should equal the account total (500k), NOT 500k * 2
      expect(result.totalRealization).toBe(500000);

      // Realization distributed proportionally: act-1 gets 60%, act-2 gets 40%
      const activities = result.objectives[0].activities;
      expect(activities[0].realization).toBe(300000); // 500k * (600k / 1m)
      expect(activities[1].realization).toBe(200000); // 500k * (400k / 1m)
    });
  });
});
