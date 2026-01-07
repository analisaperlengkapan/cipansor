import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { UnitType, Prisma, UserRole } from '@prisma/client';
import type { ListUnitsQuery, CreateUnitInput, UpdateUnitInput } from './unit.schema';

export class UnitService {
  /**
   * Get all units with pagination
   */
  async findAll(query: ListUnitsQuery, currentUser: { role: UserRole; unitId: string | null }) {
    const { page, limit, search, type } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UnitWhereInput = {
      deletedAt: null,
    };

    // Non-super-admin can only see their own unit
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      where.id = currentUser.unitId || 'none';
    }

    if (type) {
      where.type = type as UnitType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [units, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              users: { where: { deletedAt: null } },
              students: { where: { deletedAt: null } },
              classes: { where: { deletedAt: null } },
            },
          },
          settings: {
            where: { key: 'HEAD_MASTER_NAME' },
            select: { value: true },
          },
        },
      }),
      prisma.unit.count({ where }),
    ]);

    const mappedUnits = units.map((unit) => ({
      ...unit,
      headName: unit.settings[0]?.value as string | null,
      settings: undefined, // Remove raw settings from response
    }));

    return {
      units: mappedUnits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unit by ID
   */
  async findById(id: string) {
    const unit = await prisma.unit.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            classes: true,
          },
        },
        classes: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            academicYear: {
              select: { id: true, name: true, isActive: true },
            },
          },
        },
        settings: {
          where: { key: 'HEAD_MASTER_NAME' },
          select: { value: true },
        },
      },
    });

    if (!unit) {
      throw Errors.notFound('Unit');
    }

    return {
      ...unit,
      headName: unit.settings[0]?.value as string | null,
      settings: undefined,
    };
  }

  /**
   * Create new unit
   */
  async create(input: CreateUnitInput) {
    const unit = await prisma.unit.create({
      data: {
        name: input.name,
        type: input.type as UnitType,
        address: input.address,
        phone: input.phone,
        email: input.email,
        logoUrl: input.logoUrl,
        settings: input.headName
          ? {
              create: {
                key: 'HEAD_MASTER_NAME',
                value: input.headName,
              },
            }
          : undefined,
      },
    });

    return {
      ...unit,
      headName: input.headName,
    };
  }

  /**
   * Update unit
   */
  async update(id: string, input: UpdateUnitInput) {
    const unit = await prisma.unit.findFirst({
      where: { id, deletedAt: null },
    });

    if (!unit) {
      throw Errors.notFound('Unit');
    }

    const [updated] = await prisma.$transaction([
      prisma.unit.update({
        where: { id },
        data: {
          name: input.name,
          type: input.type as UnitType | undefined,
          address: input.address,
          phone: input.phone,
          email: input.email,
          logoUrl: input.logoUrl,
        },
      }),
      ...(input.headName !== undefined
        ? [
            prisma.setting.upsert({
              where: { unitId_key: { unitId: id, key: 'HEAD_MASTER_NAME' } },
              create: {
                unitId: id,
                key: 'HEAD_MASTER_NAME',
                value: input.headName ?? '',
              },
              update: {
                value: input.headName ?? '',
              },
            }),
          ]
        : []),
    ]);

    return {
      ...updated,
      headName: input.headName,
    };
  }

  /**
   * Delete unit (soft delete)
   */
  async delete(id: string) {
    const unit = await prisma.unit.findFirst({
      where: { id, deletedAt: null },
    });

    if (!unit) {
      throw Errors.notFound('Unit');
    }

    // Check if unit has active users or students
    const counts = await prisma.unit.findFirst({
      where: { id },
      include: {
        _count: {
          select: {
            users: { where: { deletedAt: null } },
            students: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (counts?._count.users || counts?._count.students) {
      throw Errors.conflict('Cannot delete unit with active users or students');
    }

    await prisma.unit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Unit deleted successfully' };
  }
}

export const unitService = new UnitService();
