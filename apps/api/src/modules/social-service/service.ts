import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

export const socialService = {
  async findAll(unitId?: string) {
    return prisma.socialServiceOrder.findMany({
      where: { ...(unitId && { unitId }) },
      include: {
        assignments: { include: { user: { select: { id: true, name: true } } } },
        materials: { include: { asset: { select: { id: true, name: true } } } },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  },

  async createOrder(data: any) {
    return prisma.socialServiceOrder.create({
      data: {
        ...data,
        totalCost: new Prisma.Decimal(data.totalCost || 0),
        scheduledAt: new Date(data.scheduledAt),
      },
    });
  },

  async assignTeam(data: { orderId: string; userId: string; role?: string }) {
    return prisma.socialServiceTeam.create({
      data,
    });
  },

  async useMaterial(data: { orderId: string; assetId: string; quantity: number; notes?: string }) {
    return prisma.$transaction(async (tx) => {
      const material = await tx.socialServiceMaterial.create({
        data,
      });
      return material;
    });
  },

  async completeOrder(id: string) {
    return prisma.socialServiceOrder.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  },
};
