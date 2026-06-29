import { prisma } from '../../lib/prisma';
import { Prisma, BusinessUnitType } from '@prisma/client';
import { Errors } from '@/middleware/error';

export const businessUnitService = {
  async list(params: { unitId?: string; type?: BusinessUnitType; isActive?: boolean }) {
    const where: Prisma.BusinessUnitWhereInput = {
      ...(params.unitId && { unitId: params.unitId }),
      ...(params.type && { type: params.type }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
    };

    return prisma.businessUnit.findMany({
      where,
      include: {
        unit: { select: { id: true, name: true } },
        _count: {
          select: {
            canteenItems: true,
            canteenTransactions: true,
            laundryTransactions: true,
            laundryPricings: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: string, unitId?: string) {
    const where: Prisma.BusinessUnitWhereInput = { id };
    if (unitId) where.unitId = unitId;

    const bu = await prisma.businessUnit.findFirst({
      where,
      include: {
        unit: { select: { id: true, name: true } },
        _count: true,
      },
    });

    if (!bu) throw Errors.notFound('Business Unit');
    return bu;
  },

  async create(data: {
    unitId: string;
    name: string;
    code: string;
    type: BusinessUnitType;
    description?: string;
    managerId?: string;
  }) {
    const existing = await prisma.businessUnit.findUnique({
      where: { unitId_code: { unitId: data.unitId, code: data.code } },
    });

    if (existing) {
      throw Errors.badRequest('Business unit code already exists');
    }

    return prisma.businessUnit.create({
      data,
      include: { unit: { select: { name: true } } },
    });
  },

  async update(id: string, unitId: string | undefined, data: Partial<{
    name: string;
    code: string;
    type: BusinessUnitType;
    description: string;
    managerId: string;
    isActive: boolean;
  }>) {
    // Verify the business unit exists (and belongs to this unit when unitId is provided)
    const where: Prisma.BusinessUnitWhereInput = { id };
    if (unitId) where.unitId = unitId;

    const bu = await prisma.businessUnit.findFirst({ where });
    if (!bu) throw Errors.notFound('Business Unit');

    if (data.code) {
      const existing = await prisma.businessUnit.findUnique({
        where: { unitId_code: { unitId: bu.unitId, code: data.code } },
      });

      if (existing && existing.id !== id) {
        throw Errors.badRequest('Business unit code already exists');
      }
    }

    return prisma.businessUnit.update({
      where: { id },
      data,
    });
  },

  async delete(id: string, unitId?: string) {
    const where: Prisma.BusinessUnitWhereInput = { id };
    if (unitId) where.unitId = unitId;

    const bu = await prisma.businessUnit.findFirst({
      where,
      include: {
        _count: {
          select: {
            canteenCategories: true,
            canteenItems: true,
            canteenTransactions: true,
            laundryPricings: true,
            laundryTransactions: true,
          },
        },
      },
    });

    if (!bu) throw Errors.notFound('Business Unit');

    if (bu._count.canteenTransactions > 0 || bu._count.laundryTransactions > 0) {
      throw Errors.badRequest('Cannot delete business unit with existing transactions');
    }

    if (bu._count.canteenCategories > 0 || bu._count.canteenItems > 0 || bu._count.laundryPricings > 0) {
      throw Errors.badRequest('Cannot delete business unit with linked categories, items, or pricings. Remove them first.');
    }

    return prisma.businessUnit.delete({ where: { id } });
  },

  async getPerformance(id: string, unitId: string | undefined, startDate: Date, endDate: Date) {
    const where: Prisma.BusinessUnitWhereInput = { id };
    if (unitId) where.unitId = unitId;

    const bu = await prisma.businessUnit.findFirst({ where });
    if (!bu) throw Errors.notFound('Business Unit');

    if (bu.type === 'CANTEEN') {
      const stats = await prisma.canteenTransaction.aggregate({
        where: {
          businessUnitId: id,
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { total: true },
        _count: { id: true },
      });

      return {
        revenue: Number(stats._sum.total || 0),
        transactionCount: stats._count.id,
      };
    }

    if (bu.type === 'LAUNDRY') {
      const stats = await prisma.laundryTransaction.aggregate({
        where: {
          businessUnitId: id,
          status: 'DELIVERED',
          paymentStatus: 'PAID',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { total: true },
        _count: { id: true },
      });

      return {
        revenue: Number(stats._sum.total || 0),
        transactionCount: stats._count.id,
      };
    }

    return { revenue: 0, transactionCount: 0 };
  },

  /**
   * Get business efficiency metrics.
   * Best Practice: Analyzing operational performance beyond simple revenue.
   */
  async getBusinessEfficiency(id: string, unitId: string | undefined) {
    const where: Prisma.BusinessUnitWhereInput = { id };
    if (unitId) where.unitId = unitId;

    const bu = await prisma.businessUnit.findFirst({
      where,
      include: {
        canteenItems: {
          select: {
            id: true,
            name: true,
            stock: true,
            _count: { select: { transactionItems: true } },
          },
        },
      },
    });

    if (!bu) throw Errors.notFound('Business Unit');

    if (bu.type === 'CANTEEN') {
      const itemEfficiency = bu.canteenItems.map((item) => {
        const turnover = item._count.transactionItems;
        // Efficiency Score: (Turnover / Stock) * 100 - simple proxy for stock velocity
        const score = item.stock > 0 ? (turnover / item.stock) * 100 : turnover > 0 ? 100 : 0;
        return {
          id: item.id,
          name: item.name,
          stock: item.stock,
          turnover,
          efficiencyScore: Math.round(score * 10) / 10,
        };
      });

      const avgEfficiency = itemEfficiency.length > 0
        ? itemEfficiency.reduce((sum, i) => sum + i.efficiencyScore, 0) / itemEfficiency.length
        : 0;

      return {
        unitId: bu.unitId,
        type: bu.type,
        overallEfficiency: Math.round(avgEfficiency * 10) / 10,
        topItems: itemEfficiency.sort((a, b) => b.efficiencyScore - a.efficiencyScore).slice(0, 5),
        lowItems: itemEfficiency.sort((a, b) => a.efficiencyScore - b.efficiencyScore).slice(0, 5),
      };
    }

    if (bu.type === 'LAUNDRY') {
      const stats = await prisma.laundryTransaction.aggregate({
        where: { businessUnitId: id, status: 'DELIVERED' },
        _sum: { weight: true, total: true },
        _count: { id: true },
      });

      const totalWeight = Number(stats._sum.weight || 0);
      const totalRevenue = Number(stats._sum.total || 0);
      const count = stats._count.id;

      const avgWeight = count > 0 ? totalWeight / count : 0;
      const revPerKg = totalWeight > 0 ? totalRevenue / totalWeight : 0;

      // Simple operational score based on average weight per load (optimized load)
      // Assuming 5kg is an optimal domestic load
      const efficiencyScore = Math.min(100, (avgWeight / 5) * 100);

      return {
        unitId: bu.unitId,
        type: bu.type,
        overallEfficiency: Math.round(efficiencyScore * 10) / 10,
        metrics: {
          totalWeight,
          totalRevenue,
          transactionCount: count,
          averageWeightPerTransaction: Math.round(avgWeight * 100) / 100,
          revenuePerKg: Math.round(revPerKg * 100) / 100,
        }
      };
    }

    return {
      unitId: bu.unitId,
      type: bu.type,
      overallEfficiency: 100,
      message: `Efficiency metrics for ${bu.type} are not yet detailed.`
    };
  }
};
