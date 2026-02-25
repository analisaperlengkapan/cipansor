import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { perencanaanService } from './perencanaan.service';
import { Prisma } from '@prisma/client';

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
    journalEntry: {
      groupBy: vi.fn(),
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

      await perencanaanService.createIndicator(dto);

      expect(prisma.planIndicator.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Nilai UN Average',
          targetValue: 8.5,
        }),
      });
    });

    it('should create activity', async () => {
      const dto = {
        objectiveId: 'obj-1',
        title: 'Pemantapan UN',
        priority: 'HIGH' as any,
        budget: 5000000,
      };

      vi.mocked(prisma.planActivity.create).mockResolvedValue({ id: 'act-1' } as any);

      await perencanaanService.createActivity(dto);

      expect(prisma.planActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Pemantapan UN',
          priority: 'HIGH',
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('Realization', () => {
    it('should calculate plan realization from journal entries', async () => {
      const planId = 'plan-1';
      const plan = {
        id: planId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        unitId: 'unit-1',
        budget: new Prisma.Decimal(1000),
        objectives: [
          {
            activities: [
              {
                id: 'act-1',
                title: 'Activity 1',
                budget: new Prisma.Decimal(500),
                accountCodeId: 'acc-1',
                account: { name: 'Expense 1', code: '501' },
              },
            ],
          },
        ],
      };

      vi.mocked(prisma.strategicPlan.findUnique).mockResolvedValue(plan as any);

      vi.mocked(prisma.journalEntry.groupBy).mockResolvedValue([
        {
          accountId: 'acc-1',
          _sum: { debit: new Prisma.Decimal(200), credit: new Prisma.Decimal(0) },
        },
      ] as any);

      const result = await perencanaanService.getPlanRealization(planId);

      expect(result).toEqual({
        planTotalBudget: 1000,
        activitiesTotalBudget: 500,
        realizedAmount: 200,
        details: [
          expect.objectContaining({
            activityId: 'act-1',
            realizedAmount: 200,
            variance: 300,
          }),
        ],
      });
    });

    it('should pro-rate realized amount when multiple activities share the same account', async () => {
      const planId = 'plan-shared';
      const plan = {
        id: planId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        unitId: 'unit-1',
        budget: new Prisma.Decimal(1000),
        objectives: [
          {
            activities: [
              {
                id: 'act-1',
                title: 'Activity 1',
                budget: new Prisma.Decimal(600), // 60% of account budget
                accountCodeId: 'acc-shared',
                account: { name: 'Shared Expense', code: '502' },
              },
              {
                id: 'act-2',
                title: 'Activity 2',
                budget: new Prisma.Decimal(400), // 40% of account budget
                accountCodeId: 'acc-shared',
                account: { name: 'Shared Expense', code: '502' },
              },
            ],
          },
        ],
      };

      vi.mocked(prisma.strategicPlan.findUnique).mockResolvedValue(plan as any);

      // Total realized for account 'acc-shared' is 200
      vi.mocked(prisma.journalEntry.groupBy).mockResolvedValue([
        {
          accountId: 'acc-shared',
          _sum: { debit: new Prisma.Decimal(200), credit: new Prisma.Decimal(0) },
        },
      ] as any);

      const result = await perencanaanService.getPlanRealization(planId);

      // Expected:
      // Act 1: 600/1000 * 200 = 120
      // Act 2: 400/1000 * 200 = 80
      // Total Realized: 200 (not 400)

      expect(result?.realizedAmount).toBe(200);

      const act1 = result?.details.find(d => d.activityId === 'act-1');
      const act2 = result?.details.find(d => d.activityId === 'act-2');

      expect(act1?.realizedAmount).toBe(120);
      expect(act2?.realizedAmount).toBe(80);
    });
  });
});
