import { prisma } from '@/lib/prisma';

export const positionService = {
  async create(data: {
    unitId: string;
    departmentId?: string;
    parentId?: string;
    name: string;
    code?: string;
    level?: number;
    description?: string;
  }) {
    return prisma.position.create({
      data: {
        unitId: data.unitId,
        departmentId: data.departmentId,
        parentId: data.parentId,
        name: data.name,
        code: data.code,
        level: data.level || 0,
        description: data.description,
      },
    });
  },

  async update(
    id: string,
    data: {
      departmentId?: string;
      parentId?: string;
      name?: string;
      code?: string;
      level?: number;
      description?: string;
      isActive?: boolean;
    }
  ) {
    // Circular dependency check
    if (data.parentId) {
      if (data.parentId === id) {
        throw new Error("Cannot set parent to self");
      }

      let currentParentId = data.parentId;
      let iterations = 0;
      while (currentParentId && iterations < 100) {
        if (currentParentId === id) {
           throw new Error("Circular dependency detected");
        }
        const parent = await prisma.position.findUnique({
          where: { id: currentParentId },
          select: { parentId: true }
        });
        if (!parent) break;
        currentParentId = parent.parentId || undefined;
        iterations++;
      }
    }

    return prisma.position.update({
      where: { id },
      data: {
        departmentId: data.departmentId,
        parentId: data.parentId,
        name: data.name,
        code: data.code,
        level: data.level,
        description: data.description,
        isActive: data.isActive,
      },
    });
  },

  async delete(id: string) {
    return prisma.position.delete({ where: { id } });
  },

  async getTree(unitId: string) {
    const positions = await prisma.position.findMany({
      where: { unitId },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { staff: true, teachers: true } },
      },
      orderBy: { level: 'asc' },
    });

    const buildTree = (parentId: string | null = null): any[] => {
      return positions
        .filter((pos) => pos.parentId === parentId)
        .map((pos) => ({
          ...pos,
          children: buildTree(pos.id),
        }));
    };

    return buildTree(null);
  },

  async findAll(unitId: string) {
    return prisma.position.findMany({
      where: { unitId },
      include: {
        department: { select: { id: true, name: true } },
      },
      orderBy: { level: 'asc' },
    });
  },

  async findOne(id: string) {
    return prisma.position.findUnique({
      where: { id },
      include: {
        parent: true,
        department: true,
        staff: { select: { id: true, user: { select: { name: true } } } },
        teachers: { select: { id: true, user: { select: { name: true } } } },
      },
    });
  }
};
