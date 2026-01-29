import { prisma } from '@/lib/prisma';
import httpStatus from 'http-status'; // Need to make sure we throw errors that controller catches or just generic errors

// Define a custom error or just use Error
class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const departmentService = {
  async create(data: {
    unitId: string;
    code: string;
    name: string;
    description?: string;
    managerId?: string;
    parentId?: string;
  }) {
    return prisma.department.create({
      data: {
        unitId: data.unitId,
        code: data.code,
        name: data.name,
        description: data.description,
        managerId: data.managerId || null,
        parentId: data.parentId || null,
      },
    });
  },

  async update(
    id: string,
    data: {
      code?: string;
      name?: string;
      description?: string;
      managerId?: string;
      parentId?: string;
      isActive?: boolean;
    }
  ) {
    // Circular dependency check
    if (data.parentId) {
      if (data.parentId === id) {
        throw new Error("Cannot set parent to self"); // Controller should handle 500 or we need standard Error class
      }

      // Check if 'id' is an ancestor of 'data.parentId'
      let currentParentId = data.parentId;
      let iterations = 0;
      while (currentParentId && iterations < 100) { // Safety break
        if (currentParentId === id) {
           throw new Error("Circular dependency detected");
        }
        const parent = await prisma.department.findUnique({
          where: { id: currentParentId },
          select: { parentId: true }
        });
        if (!parent) break;
        currentParentId = parent.parentId || undefined;
        iterations++;
      }
    }

    return prisma.department.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        managerId: data.managerId || null,
        parentId: data.parentId || null,
        isActive: data.isActive,
      },
    });
  },

  async delete(id: string) {
    return prisma.department.delete({ where: { id } });
  },

  async getTree(unitId: string) {
    const departments = await prisma.department.findMany({
      where: { unitId },
      include: {
        manager: { select: { id: true, name: true } },
        _count: { select: { staff: true, teachers: true, positions: true } },
      },
      orderBy: { code: 'asc' },
    });

    const buildTree = (parentId: string | null = null): any[] => {
      return departments
        .filter((dept) => dept.parentId === parentId)
        .map((dept) => ({
          ...dept,
          children: buildTree(dept.id),
        }));
    };

    return buildTree(null);
  },

  async findAll(unitId: string) {
    return prisma.department.findMany({
      where: { unitId },
      orderBy: { code: 'asc' },
    });
  },

  async findOne(id: string) {
    return prisma.department.findUnique({
      where: { id },
      include: {
        parent: true,
        manager: true,
        positions: true,
      },
    });
  }
};
