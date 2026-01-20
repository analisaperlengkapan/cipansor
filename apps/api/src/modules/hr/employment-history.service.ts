import { prisma } from "../../lib/prisma";
import { EmploymentAction } from "@prisma/client";

export const employmentHistoryService = {
  async create(data: { userId: string; action: EmploymentAction; previousPosition?: string; newPosition: string; previousDepartment?: string; newDepartment?: string; effectiveDate: Date; notes?: string }) {
    return prisma.employmentHistory.create({
      data: {
        userId: data.userId,
        action: data.action,
        previousPosition: data.previousPosition,
        newPosition: data.newPosition,
        previousDepartment: data.previousDepartment,
        newDepartment: data.newDepartment,
        effectiveDate: data.effectiveDate,
        notes: data.notes,
      },
    });
  },

  async findAll(userId: string) {
    return prisma.employmentHistory.findMany({
      where: { userId },
      orderBy: { effectiveDate: 'desc' },
    });
  }
};
