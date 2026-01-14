import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const leaveBalanceService = {
  async getBalance(userId: string, academicYearId: string, leaveType: any) {
    return prisma.leaveBalance.findUnique({
      where: {
        userId_academicYearId_leaveType: {
          userId,
          academicYearId,
          leaveType,
        }
      }
    });
  },

  async getAllBalances(userId: string, academicYearId: string) {
    return prisma.leaveBalance.findMany({
      where: {
        userId,
        academicYearId
      }
    });
  },

  async initializeBalance(data: { userId: string; unitId: string; academicYearId: string; leaveType: any; totalDays: number }) {
    return prisma.leaveBalance.create({
      data: {
        unit: { connect: { id: data.unitId } },
        user: { connect: { id: data.userId } },
        academicYear: { connect: { id: data.academicYearId } },
        leaveType: data.leaveType,
        totalDays: data.totalDays,
        remainingDays: data.totalDays,
        usedDays: 0,
      }
    });
  },

  async updateBalance(id: string, totalDays: number) {
    const current = await prisma.leaveBalance.findUnique({ where: { id } });
    if (!current) throw new Error('Balance not found');

    // Recalculate remaining
    const remaining = totalDays - current.usedDays;

    return prisma.leaveBalance.update({
      where: { id },
      data: {
        totalDays,
        remainingDays: remaining,
      }
    });
  }
};
