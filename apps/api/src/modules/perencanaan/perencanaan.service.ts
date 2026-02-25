import { prisma } from '@/lib/prisma';
import { Prisma, PlanStatus } from '@prisma/client';

export class PerencanaanService {
  // ==================== STRATEGIC PLANS ====================

  async createPlan(data: {
    title: string;
    description?: string;
    type: 'RENSTRA' | 'RKAS' | 'RKT' | 'PROGRAM';
    startDate: string;
    endDate: string;
    budget?: number;
    unitId: string;
    createdById: string;
  }) {
    return prisma.strategicPlan.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        budget: data.budget ? new Prisma.Decimal(data.budget) : undefined,
        unit: { connect: { id: data.unitId } },
        createdBy: { connect: { id: data.createdById } },
      },
      include: {
        unit: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        objectives: true,
      },
    });
  }

  async getPlans(unitId: string, query: { type?: string; status?: string }) {
    const where: Prisma.StrategicPlanWhereInput = { unitId };
    if (query.type) where.type = query.type as any;
    if (query.status) where.status = query.status as any;

    return prisma.strategicPlan.findMany({
      where,
      include: {
        unit: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        objectives: {
          include: {
            indicators: true,
            activities: { select: { id: true, status: true } },
          },
          orderBy: { order: 'asc' },
        },
        risks: { select: { id: true, riskLevel: true, status: true } },
        internalAudits: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPlanById(id: string) {
    return prisma.strategicPlan.findUnique({
      where: { id },
      include: {
        unit: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        objectives: {
          include: {
            indicators: true,
            activities: {
              include: {
                pic: { select: { id: true, name: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        risks: true,
        internalAudits: true,
      },
    });
  }

  async updatePlan(id: string, data: Prisma.StrategicPlanUpdateInput) {
    return prisma.strategicPlan.update({
      where: { id },
      data,
      include: {
        unit: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        objectives: true,
      },
    });
  }

  async approvePlan(id: string, approvedById: string) {
    return prisma.strategicPlan.update({
      where: { id },
      data: {
        status: PlanStatus.APPROVED,
        approvedBy: { connect: { id: approvedById } },
        approvedAt: new Date(),
      },
    });
  }

  async deletePlan(id: string) {
    return prisma.strategicPlan.delete({ where: { id } });
  }

  // ==================== OBJECTIVES ====================

  async createObjective(data: {
    planId: string;
    title: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    weight?: number;
    order?: number;
  }) {
    const objective = await prisma.planObjective.create({
      data: {
        plan: { connect: { id: data.planId } },
        title: data.title,
        description: data.description,
        priority: data.priority,
        weight: data.weight,
        order: data.order,
      },
      include: { indicators: true, activities: true },
    });

    // Recalculate plan progress
    await this.recalculatePlanProgress(data.planId);
    return objective;
  }

  async updateObjective(id: string, data: Prisma.PlanObjectiveUpdateInput) {
    const objective = await prisma.planObjective.update({
      where: { id },
      data,
      include: { plan: { select: { id: true } } },
    });

    await this.recalculatePlanProgress(objective.plan.id);
    return objective;
  }

  async deleteObjective(id: string) {
    const objective = await prisma.planObjective.findUnique({
      where: { id },
      select: { planId: true },
    });
    const result = await prisma.planObjective.delete({ where: { id } });
    if (objective) await this.recalculatePlanProgress(objective.planId);
    return result;
  }

  // ==================== INDICATORS ====================

  async createIndicator(data: {
    objectiveId: string;
    name: string;
    unit: string;
    baseline?: number;
    targetValue: number;
  }) {
    return prisma.planIndicator.create({
      data: {
        objective: { connect: { id: data.objectiveId } },
        name: data.name,
        unit: data.unit,
        baseline: data.baseline,
        targetValue: data.targetValue,
      },
    });
  }

  async updateIndicator(id: string, data: Prisma.PlanIndicatorUpdateInput) {
    return prisma.planIndicator.update({ where: { id }, data });
  }

  async deleteIndicator(id: string) {
    return prisma.planIndicator.delete({ where: { id } });
  }

  // ==================== ACTIVITIES ====================

  async createActivity(data: {
    objectiveId: string;
    title: string;
    description?: string;
    picId?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    accountCodeId?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }) {
    return prisma.planActivity.create({
      data: {
        objective: { connect: { id: data.objectiveId } },
        title: data.title,
        description: data.description,
        pic: data.picId ? { connect: { id: data.picId } } : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        budget: data.budget ? new Prisma.Decimal(data.budget) : undefined,
        priority: data.priority,
        account: data.accountCodeId ? { connect: { id: data.accountCodeId } } : undefined,
      },
      include: {
        pic: { select: { id: true, name: true } },
        account: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async updateActivity(id: string, data: any) {
    const { picId, accountCodeId, ...rest } = data;
    const updateData: any = { ...rest };

    if (picId) updateData.pic = { connect: { id: picId } };
    else if (picId === null) updateData.pic = { disconnect: true };

    if (accountCodeId) updateData.account = { connect: { id: accountCodeId } };
    else if (accountCodeId === null) updateData.account = { disconnect: true };

    if (rest.startDate) updateData.startDate = new Date(rest.startDate);
    if (rest.endDate) updateData.endDate = new Date(rest.endDate);
    if (rest.budget !== undefined) updateData.budget = new Prisma.Decimal(rest.budget);

    return prisma.planActivity.update({
      where: { id },
      data: updateData,
      include: {
        pic: { select: { id: true, name: true } },
        account: { select: { id: true, code: true, name: true } },
      },
    });
  }

  // ==================== REALIZATION ====================

  async getPlanRealization(planId: string) {
    // 1. Get Plan details
    const plan = await prisma.strategicPlan.findUnique({
      where: { id: planId },
      include: {
        objectives: {
          include: {
            activities: {
              where: { accountCodeId: { not: null } },
              include: { account: true },
            },
          },
        },
      },
    });

    if (!plan) return null;

    const startDate = plan.startDate;
    const endDate = plan.endDate;
    const unitId = plan.unitId;

    // 2. Extract relevant account IDs
    const activitiesWithAccounts = plan.objectives.flatMap((o) => o.activities);
    const accountIds = [...new Set(activitiesWithAccounts.map((a) => a.accountCodeId as string))];

    if (accountIds.length === 0) {
      return {
        planTotalBudget: plan.budget?.toNumber() || 0,
        activitiesTotalBudget: 0,
        realizedAmount: 0,
        details: [],
      };
    }

    // 3. Aggregate Journal Entries for these accounts in the plan period
    const aggregations = await prisma.journalEntry.groupBy({
      by: ['accountId'],
      where: {
        unitId,
        accountId: { in: accountIds },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    // 4. Map results
    const realizationMap = new Map<string, number>();

    aggregations.forEach((agg) => {
      // For expenses (Debit normal), used = debit - credit
      // Assuming these are expense accounts. If revenue, it would be credit - debit.
      // We'll assume standard expense behavior for budgeting.
      const used = (agg._sum.debit?.toNumber() || 0) - (agg._sum.credit?.toNumber() || 0);
      realizationMap.set(agg.accountId, used);
    });

    // 5. Construct details per activity
    const details = activitiesWithAccounts.map((activity) => {
      const realized = realizationMap.get(activity.accountCodeId!) || 0;
      return {
        activityId: activity.id,
        activityTitle: activity.title,
        accountId: activity.accountCodeId,
        accountName: activity.account?.name,
        accountCode: activity.account?.code,
        plannedBudget: activity.budget?.toNumber() || 0,
        realizedAmount: realized,
        variance: (activity.budget?.toNumber() || 0) - realized,
      };
    });

    const activitiesTotalBudget = details.reduce((sum, d) => sum + d.plannedBudget, 0);
    const totalRealized = details.reduce((sum, d) => sum + d.realizedAmount, 0);

    return {
      planTotalBudget: plan.budget?.toNumber() || 0,
      activitiesTotalBudget,
      realizedAmount: totalRealized,
      details,
    };
  }

  async deleteActivity(id: string) {
    return prisma.planActivity.delete({ where: { id } });
  }

  // ==================== HELPERS ====================

  private async recalculatePlanProgress(planId: string) {
    const objectives = await prisma.planObjective.findMany({
      where: { planId },
      select: { weight: true, progress: true },
    });

    if (objectives.length === 0) return;

    const totalWeight = objectives.reduce((sum, obj) => sum + obj.weight, 0);
    const weightedProgress = objectives.reduce(
      (sum, obj) => sum + (obj.progress * obj.weight) / (totalWeight || 1),
      0
    );

    await prisma.strategicPlan.update({
      where: { id: planId },
      data: { progress: Math.round(weightedProgress * 100) / 100 },
    });
  }
}

export const perencanaanService = new PerencanaanService();
