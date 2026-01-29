import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const shariaService = {
  /**
   * Get all mustahiks with pagination
   */
  async findAllMustahik(params: {
    page: number;
    limit: number;
    unitId?: string;
    type?: string;
    search?: string;
  }) {
    const { page, limit, unitId, type, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.MustahikWhereInput = {
      ...(unitId && { unitId }),
      ...(type && { type }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { nik: { contains: search } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.mustahik.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          unit: { select: { id: true, name: true } },
        },
      }),
      prisma.mustahik.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get mustahik by ID
   */
  async findMustahikById(id: string) {
    return prisma.mustahik.findUnique({
      where: { id },
      include: {
        unit: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Create mustahik
   */
  async createMustahik(data: Prisma.MustahikCreateInput) {
    return prisma.mustahik.create({
      data,
    });
  },

  /**
   * Update mustahik
   */
  async updateMustahik(id: string, data: Prisma.MustahikUpdateInput) {
    return prisma.mustahik.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete mustahik
   */
  async deleteMustahik(id: string) {
    return prisma.mustahik.delete({
      where: { id },
    });
  },
};
