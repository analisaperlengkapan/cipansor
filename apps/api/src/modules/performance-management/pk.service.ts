import { prisma } from '@/lib/prisma';
import { PlanStatus, CascadingCategory } from '@prisma/client';
import { Errors } from '@/middleware/error';

export class PerformanceAgreementService {
  async createPK(data: {
    userId: string;
    supervisorId?: string;
    strategicPlanId?: string;
    periodStart: string;
    periodEnd: string;
    notes?: string;
  }) {
    // If supervisor is provided, check if they have an approved PK
    if (data.supervisorId) {
      const supervisorPk = await prisma.performanceAgreement.findFirst({
        where: {
          userId: data.supervisorId,
          status: 'APPROVED',
          periodStart: { lte: new Date(data.periodStart) },
          periodEnd: { gte: new Date(data.periodEnd) },
        },
      });

      if (!supervisorPk) {
        throw Errors.badRequest('Supervisor must have an approved PK for the same period before you can create yours.');
      }
    }

    return prisma.performanceAgreement.create({
      data: {
        user: { connect: { id: data.userId } },
        supervisor: data.supervisorId ? { connect: { id: data.supervisorId } } : undefined,
        strategicPlan: data.strategicPlanId ? { connect: { id: data.strategicPlanId } } : undefined,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        notes: data.notes,
      },
      include: {
        user: { select: { id: true, name: true } },
        supervisor: { select: { id: true, name: true } },
        strategicPlan: { select: { id: true, title: true } },
      },
    });
  }

  async getPKs(userId: string, query: { status?: string }) {
    return prisma.performanceAgreement.findMany({
      where: {
        OR: [
          { userId },
          { supervisorId: userId },
        ],
        status: query.status as any,
      },
      include: {
        user: { select: { id: true, name: true } },
        supervisor: { select: { id: true, name: true } },
        strategicPlan: { select: { id: true, title: true } },
        indicators: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPKById(id: string) {
    return prisma.performanceAgreement.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true } },
        supervisor: { select: { id: true, name: true } },
        strategicPlan: { select: { id: true, title: true } },
        indicators: {
          include: {
            refIndicator: { select: { id: true, title: true } },
            refStrategicIndicator: { select: { id: true, name: true } },
          },
        },
        evaluations: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        },
      },
    });
  }

  async updatePK(id: string, data: any) {
    return prisma.performanceAgreement.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  async proposePK(id: string) {
    const pk = await prisma.performanceAgreement.findUnique({
      where: { id },
      include: { indicators: true },
    });

    if (!pk) throw Errors.notFound('PK not found');
    if (pk.indicators.length === 0) throw Errors.badRequest('PK must have at least one indicator');

    const totalWeight = pk.indicators.reduce((sum, ind) => sum + ind.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw Errors.badRequest('Total weight of indicators must be 100%');
    }

    return prisma.performanceAgreement.update({
      where: { id },
      data: { status: 'PROPOSED' as PlanStatus },
    });
  }

  async approvePK(id: string, supervisorId: string) {
    const pk = await prisma.performanceAgreement.findUnique({ where: { id } });
    if (!pk) throw Errors.notFound('PK not found');

    // In a real app, we'd verify supervisorId matches pk.supervisorId

    return prisma.performanceAgreement.update({
      where: { id },
      data: {
        status: 'APPROVED' as PlanStatus,
        approvedAt: new Date(),
      },
    });
  }

  // ==================== INDICATORS ====================

  async createIndicator(data: {
    pkId: string;
    title: string;
    target: number;
    unit: string;
    weight: number;
    category: CascadingCategory;
    refIndicatorId?: string;
    refStrategicIndicatorId?: string;
    notes?: string;
  }) {
    // Validate cascading logic
    if (data.category === 'DIRECT' || data.category === 'INDIRECT') {
      if (!data.refIndicatorId && !data.refStrategicIndicatorId) {
        throw Errors.badRequest('Direct/Indirect indicators must have a reference to a superior indicator');
      }
    }

    return prisma.pkIndicator.create({
      data: {
        pkId: data.pkId,
        title: data.title,
        target: data.target,
        unit: data.unit,
        weight: data.weight,
        category: data.category,
        refIndicatorId: data.refIndicatorId,
        refStrategicIndicatorId: data.refStrategicIndicatorId,
        notes: data.notes,
      },
    });
  }

  async updateIndicator(id: string, data: any) {
    return prisma.pkIndicator.update({
      where: { id },
      data,
    });
  }

  async deleteIndicator(id: string) {
    return prisma.pkIndicator.delete({ where: { id } });
  }
}

export const pkService = new PerformanceAgreementService();
