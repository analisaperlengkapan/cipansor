import { prisma } from '../../lib/prisma';
import { LeaveType } from '@prisma/client';
import { CreateLeaveBalanceInput } from './schema';

export const leaveBalanceService = {
  getBalance: async (userId: string, academicYearId: string, leaveType: LeaveType) => {
    return prisma.leaveBalance.findUnique({
      where: {
        userId_academicYearId_leaveType: {
          userId,
          academicYearId,
          leaveType,
        },
      },
    });
  },

  getAllBalances: async (userId: string, academicYearId: string) => {
    return prisma.leaveBalance.findMany({
      where: {
        userId,
        academicYearId,
      },
    });
  },

  findAll: async (unitId: string, academicYearId: string, params: { page: number; limit: number; search?: string }) => {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      unitId,
      academicYearId,
    };

    if (search) {
      where.user = {
        name: { contains: search, mode: 'insensitive' },
      };
    }

    const [data, total] = await Promise.all([
      prisma.leaveBalance.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        skip,
        take: limit,
      }),
      prisma.leaveBalance.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  initializeBalance: async (data: any) => {
    // Check if exists
    const existing = await prisma.leaveBalance.findUnique({
      where: {
        userId_academicYearId_leaveType: {
          userId: data.userId,
          academicYearId: data.academicYearId,
          leaveType: data.leaveType,
        },
      },
    });

    if (existing) {
      throw new Error('Leave balance already exists');
    }

    return prisma.leaveBalance.create({
      data: {
        userId: data.userId,
        academicYearId: data.academicYearId,
        leaveType: data.leaveType,
        totalDays: data.totalDays,
        remainingDays: data.totalDays, // Initially same as total
        usedDays: 0,
        unitId: data.unitId,
      },
    });
  },

  updateBalance: async (id: string, totalDays: number) => {
    const balance = await prisma.leaveBalance.findUnique({ where: { id } });
    if (!balance) throw new Error('Balance not found');

    const diff = totalDays - balance.totalDays;

    return prisma.leaveBalance.update({
      where: { id },
      data: {
        totalDays,
        remainingDays: { increment: diff },
      },
    });
  },
};
