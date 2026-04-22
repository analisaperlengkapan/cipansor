import { prisma } from '../../lib/prisma';
import { Prisma, BusinessUnitType } from '@prisma/client';
import { Errors } from '@/middleware/error';

export const businessUnitService = {
  async list(params: { unitId: string; type?: BusinessUnitType; isActive?: boolean }) {
    const where: Prisma.BusinessUnitWhereInput = {
      unitId: params.unitId,
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
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: string) {
    const bu = await prisma.businessUnit.findUnique({
      where: { id },
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
      where: { code: data.code },
    });

    if (existing) {
      throw Errors.badRequest('Business unit code already exists');
    }

    return prisma.businessUnit.create({
      data,
      include: { unit: { select: { name: true } } },
    });
  },

  async update(id: string, data: Partial<{
    name: string;
    code: string;
    type: BusinessUnitType;
    description: string;
    managerId: string;
    isActive: boolean;
  }>) {
    if (data.code) {
      const existing = await prisma.businessUnit.findUnique({
        where: { code: data.code },
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

  async delete(id: string) {
    const bu = await prisma.businessUnit.findUnique({
      where: { id },
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

  async getPerformance(id: string, startDate: Date, endDate: Date) {
    const bu = await prisma.businessUnit.findUnique({ where: { id } });
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
  }
};
