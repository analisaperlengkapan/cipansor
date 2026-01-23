import { prisma } from '../../lib/prisma';
import { EmployeeDocumentType } from '@prisma/client';

export const employeeDocumentService = {
  async create(data: {
    userId: string;
    name: string;
    type: EmployeeDocumentType;
    fileUrl: string;
    expiryDate?: Date;
    notes?: string;
  }) {
    return prisma.employeeDocument.create({
      data: {
        userId: data.userId,
        name: data.name,
        type: data.type,
        fileUrl: data.fileUrl,
        expiryDate: data.expiryDate,
        notes: data.notes,
      },
    });
  },

  async findAll(userId: string) {
    return prisma.employeeDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async delete(id: string) {
    return prisma.employeeDocument.delete({
      where: { id },
    });
  },
};
