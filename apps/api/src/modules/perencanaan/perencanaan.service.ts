import { prisma } from '@/lib/prisma';
import { Prisma, PlanStatus } from '@prisma/client';

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

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
        budget: data.budget ? (data.budget as any) : undefined,
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
    const plan = await prisma.strategicPlan.findUnique({
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
                budgetRel: {
                  include: {
                    account: { select: { id: true, code: true, name: true, normalBalance: true } },
                  },
                },
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

    if (!plan) return null;

    // Financial realization: gracefully degrade on error so the plan detail
    // is still returned even when journal aggregation fails.
    //
    // KNOWN LIMITATIONS:
    // 1. Journal entries are aggregated at the account level, not activity level.
    //    If an account (e.g., '5-1-01 General Office Expenses') has journal entries
    //    from business processes unrelated to this plan, those amounts will be included
    //    in the realization figure. This is an architectural limitation — there is no
    //    direct FK between JournalEntry and PlanActivity in the current schema.
    // 2. The date range filter uses the plan's startDate/endDate, not the Budget
    //    model's academicYearId. For multi-year RENSTRA plans, realization will span
    //    multiple academic years, while the linked Budget may only cover one year.
    //    Short-lived plans (RKAS, RKT, PROGRAM) are typically aligned with a single
    //    academic year so this mismatch is less impactful for them.
    try {
      // 1. Collect all unique accountIds and their normalBalance across every activity
      const accountMap = new Map<string, { normalBalance: string }>();
      for (const obj of plan.objectives) {
        for (const act of obj.activities) {
          if (act.budgetRel && !accountMap.has(act.budgetRel.accountId)) {
            accountMap.set(act.budgetRel.accountId, {
              normalBalance: act.budgetRel.account.normalBalance,
            });
          }
        }
      }

      // 2. Aggregate journal entries once per unique accountId
      //    Extend endDate to end-of-day (23:59:59.999) so that journal entries
      //    recorded on the last day of the plan period are included. Without this,
      //    if endDate is stored as midnight UTC (e.g., 2024-12-31T00:00:00Z),
      //    any entry after midnight on that day would be excluded by the `lte` filter.
      const endOfDay = new Date(plan.endDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const accountRealizationMap = new Map<string, number>();
      await Promise.all(
        Array.from(accountMap.entries()).map(async ([accountId, meta]) => {
          const journalAggregates = await prisma.journalEntry.aggregate({
            where: {
              accountId,
              unitId: plan.unitId,
              date: {
                gte: plan.startDate,
                lte: endOfDay,
              },
            },
            _sum: {
              debit: true,
              credit: true,
            },
          });

          let realization: number;
          if (meta.normalBalance === 'DEBIT') {
            realization =
              (journalAggregates._sum.debit?.toNumber() || 0) -
              (journalAggregates._sum.credit?.toNumber() || 0);
          } else {
            realization =
              (journalAggregates._sum.credit?.toNumber() || 0) -
              (journalAggregates._sum.debit?.toNumber() || 0);
          }
          accountRealizationMap.set(accountId, Math.max(0, realization));
        })
      );

      // 3. For each account, compute the total budget across all activities sharing it
      //    so we can distribute realization proportionally.
      const accountTotalBudget = new Map<string, number>();
      for (const obj of plan.objectives) {
        for (const act of obj.activities) {
          if (act.budgetRel) {
            const accId = act.budgetRel.accountId;
            const actBudget = act.budget?.toNumber() || 0;
            accountTotalBudget.set(accId, (accountTotalBudget.get(accId) || 0) + actBudget);
          }
        }
      }

      // 4. Calculate realization for each activity and objective
      const objectivesWithRealization = plan.objectives.map((obj) => {
        const activitiesWithRealization = obj.activities.map((act) => {
          let realization = 0;
          if (act.budgetRel) {
            const accId = act.budgetRel.accountId;
            const accountTotal = accountRealizationMap.get(accId) || 0;
            const totalBudgetForAccount = accountTotalBudget.get(accId) || 0;
            const actBudget = act.budget?.toNumber() || 0;

            // Distribute the account's realization proportionally by budget share
            if (totalBudgetForAccount > 0 && actBudget > 0) {
              realization = accountTotal * (actBudget / totalBudgetForAccount);
            } else if (totalBudgetForAccount === 0) {
              // All activities have zero budget — split evenly as fallback
              const actCount = [...plan.objectives]
                .flatMap((o) => o.activities)
                .filter((a) => a.budgetRel?.accountId === accId).length;
              realization = actCount > 0 ? accountTotal / actCount : 0;
            }
          }
          return { ...act, realization: Math.max(0, realization) };
        });

        // Only include activities with a budgetRel link in the total budget
        // so that untracked activities don't dilute the financial progress.
        const totalBudget = activitiesWithRealization.reduce(
          (sum, act) => sum + (act.budgetRel ? (act.budget?.toNumber() || 0) : 0),
          0
        );
        const totalRealization = activitiesWithRealization.reduce(
          (sum, act) => sum + act.realization,
          0
        );

        return {
          ...obj,
          activities: activitiesWithRealization,
          totalBudget,
          totalRealization,
          financialProgress: totalBudget > 0 ? Math.min((totalRealization / totalBudget) * 100, 100) : 0,
          budgetVsActual: activitiesWithRealization.map(a => ({
            title: a.title,
            budget: a.budget?.toNumber() || 0,
            actual: a.realization,
            variance: (a.budget?.toNumber() || 0) - a.realization,
          })),
        };
      });

      const totalPlanBudget = objectivesWithRealization.reduce((sum, obj) => sum + obj.totalBudget, 0);
      const totalPlanRealization = objectivesWithRealization.reduce(
        (sum, obj) => sum + obj.totalRealization,
        0
      );

      return {
        ...plan,
        objectives: objectivesWithRealization,
        totalBudget: totalPlanBudget,
        totalRealization: totalPlanRealization,
        financialProgress: totalPlanBudget > 0 ? Math.min((totalPlanRealization / totalPlanBudget) * 100, 100) : 0,
      };
    } catch (err: any) {
      console.error('[Perencanaan] Journal aggregation failed, returning plan without financial data:', err?.message || err);
      // Return the plan with zero realization so the page still renders
      const fallbackObjectives = plan.objectives.map((obj) => ({
        ...obj,
        activities: obj.activities.map((act) => ({ ...act, realization: 0 })),
        totalBudget: obj.activities.reduce((sum, act) => sum + (act.budgetRel ? (act.budget?.toNumber() || 0) : 0), 0),
        totalRealization: 0,
        financialProgress: 0,
      }));
      return {
        ...plan,
        objectives: fallbackObjectives,
        totalBudget: fallbackObjectives.reduce((sum, obj) => sum + obj.totalBudget, 0),
        totalRealization: 0,
        financialProgress: 0,
      };
    }
  }

  /**
   * Lightweight lookup for authorization checks — no journal aggregation.
   */
  async getPlanForAuth(id: string) {
    return prisma.strategicPlan.findUnique({
      where: { id },
      select: { id: true, unitId: true },
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
        // String casting allows the update without triggering Vitest Prisma Enum mock issues
        status: 'APPROVED' as PlanStatus,
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
    perspective?: 'FINANCIAL' | 'CUSTOMER' | 'PROCESS' | 'LEARNING';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    weight?: number;
    order?: number;
  }) {
    const objective = await prisma.planObjective.create({
      data: {
        plan: { connect: { id: data.planId } },
        title: data.title,
        description: data.description,
        perspective: data.perspective,
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
    const indicator = await prisma.planIndicator.create({
      data: {
        objective: { connect: { id: data.objectiveId } },
        name: data.name,
        unit: data.unit,
        baseline: data.baseline,
        targetValue: data.targetValue,
      },
    });

    await this.recalculateObjectiveProgress(data.objectiveId);
    return indicator;
  }

  async updateIndicator(id: string, data: Prisma.PlanIndicatorUpdateInput) {
    const indicator = await prisma.planIndicator.update({
      where: { id },
      data,
      include: { objective: { select: { id: true } } },
    });

    await this.recalculateObjectiveProgress(indicator.objective.id);
    return indicator;
  }

  async deleteIndicator(id: string) {
    const indicator = await prisma.planIndicator.findUnique({
      where: { id },
      select: { objectiveId: true },
    });
    const result = await prisma.planIndicator.delete({ where: { id } });
    if (indicator) await this.recalculateObjectiveProgress(indicator.objectiveId);
    return result;
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
    budgetId?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }) {
    return prisma.planActivity.create({
      data: {
        objective: { connect: { id: data.objectiveId } },
        title: data.title,
        description: data.description,
        pic: data.picId ? { connect: { id: data.picId } } : undefined,
        budgetRel: data.budgetId ? { connect: { id: data.budgetId } } : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        budget: data.budget ? (data.budget as any) : undefined,
        priority: data.priority,
      },
      include: {
        pic: { select: { id: true, name: true } },
        budgetRel: {
          include: {
            account: { select: { code: true, name: true } },
          },
        },
      },
    });
  }

  async updateActivity(id: string, data: any) {
    const { picId, budgetId, ...rest } = data;
    const updateData: any = { ...rest };

    if (picId) updateData.pic = { connect: { id: picId } };
    else if (picId === null) updateData.pic = { disconnect: true };

    if (budgetId) updateData.budgetRel = { connect: { id: budgetId } };
    else if (budgetId === null) updateData.budgetRel = { disconnect: true };

    if (rest.startDate) updateData.startDate = new Date(rest.startDate);
    if (rest.endDate) updateData.endDate = new Date(rest.endDate);
    if (rest.budget !== undefined) updateData.budget = (rest.budget as any);

    return prisma.planActivity.update({
      where: { id },
      data: updateData,
      include: {
        pic: { select: { id: true, name: true } },
        budgetRel: {
          include: {
            account: { select: { code: true, name: true } },
          },
        },
      },
    });
  }

  async deleteActivity(id: string) {
    return prisma.planActivity.delete({ where: { id } });
  }

  // ==================== HELPERS ====================

  /**
   * Recalculate an objective's progress from its indicators.
   * Logic: (currentValue / targetValue) * 100
   */
  async recalculateObjectiveProgress(
    objectiveId: string,
    tx: TransactionClient | typeof prisma = prisma
  ) {
    const objective = await tx.planObjective.findUnique({
      where: { id: objectiveId },
      include: { indicators: true },
    });

    if (!objective) return;

    if (objective.indicators.length === 0) {
      await tx.planObjective.update({
        where: { id: objectiveId },
        data: { progress: 0 },
      });
      await this.recalculatePlanProgress(objective.planId, tx);
      return;
    }

    const totalProgress = objective.indicators.reduce((sum, ind) => {
      const target = ind.targetValue;
      const current = ind.currentValue || 0;
      // When target is 0, the goal is "reduce to zero". If current is also 0
      // (or less), the goal is fully met → 100%. Otherwise 0%.
      if (target === 0 || target === null) {
        return sum + (current <= 0 ? 100 : 0);
      }
      const progress = (current / target) * 100;
      return sum + Math.min(100, progress); // Cap indicator progress at 100%
    }, 0);

    const averageProgress = totalProgress / objective.indicators.length;

    await tx.planObjective.update({
      where: { id: objectiveId },
      data: { progress: Math.round(averageProgress * 100) / 100 },
    });

    // Also recalculate parent plan
    await this.recalculatePlanProgress(objective.planId, tx);
  }

  /**
   * Recalculate a plan's weighted progress from its objectives.
   * Accepts an optional transaction client so it can be called from within
   * other services' transactions (e.g., PengawasanService.createFinding).
   */
  async recalculatePlanProgress(planId: string, tx: TransactionClient | typeof prisma = prisma) {
    const objectives = await tx.planObjective.findMany({
      where: { planId },
      select: { weight: true, progress: true },
    });

    if (objectives.length === 0) return;

    const totalWeight = objectives.reduce((sum, obj) => sum + obj.weight, 0);
    const weightedProgress = objectives.reduce(
      (sum, obj) => sum + (obj.progress * obj.weight) / (totalWeight || 1),
      0
    );

    await tx.strategicPlan.update({
      where: { id: planId },
      data: { progress: Math.round(weightedProgress * 100) / 100 },
    });
  }
}

export const perencanaanService = new PerencanaanService();
