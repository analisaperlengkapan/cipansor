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
        budget: data.budget ? (data.budget as any) : undefined,
        priority: data.priority,
      },
      include: {
        pic: { select: { id: true, name: true } },
      },
    });
  }

  async updateActivity(id: string, data: any) {
    const { picId, ...rest } = data;
    const updateData: any = { ...rest };

    if (picId) updateData.pic = { connect: { id: picId } };
    else if (picId === null) updateData.pic = { disconnect: true };

    if (rest.startDate) updateData.startDate = new Date(rest.startDate);
    if (rest.endDate) updateData.endDate = new Date(rest.endDate);
    if (rest.budget !== undefined) updateData.budget = (rest.budget as any);

    return prisma.planActivity.update({
      where: { id },
      data: updateData,
      include: { pic: { select: { id: true, name: true } } },
    });
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
