import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';

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
        manager: data.managerId ? { connect: { id: data.managerId } } : undefined,
        parent: data.parentId ? { connect: { id: data.parentId } } : undefined,
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
        throw Errors.badRequest("Cannot set parent to self");
      }

      // Check if 'id' is an ancestor of 'data.parentId'
      let currentParentId = data.parentId;
      let iterations = 0;
      while (currentParentId && iterations < 100) { // Safety break
        if (currentParentId === id) {
           throw Errors.badRequest("Circular dependency detected");
        }
        const parent = await prisma.department.findUnique({
          where: { id: currentParentId },
          select: { parentId: true }
        });
        if (!parent) break;
        currentParentId = parent.parentId || "";
        iterations++;
      }
    }

    return prisma.department.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        manager: data.managerId
          ? { connect: { id: data.managerId } }
          : data.managerId === null
            ? { disconnect: true }
            : undefined,
        parent: data.parentId
          ? { connect: { id: data.parentId } }
          : data.parentId === null
            ? { disconnect: true }
            : undefined,
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
