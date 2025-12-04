import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { Prisma } from '@prisma/client';
import type {
  ListAcademicYearsQuery,
  CreateAcademicYearInput,
  UpdateAcademicYearInput,
} from './academic-year.schema';

export class AcademicYearService {
  /**
   * Get all academic years with pagination
   */
  async findAll(query: ListAcademicYearsQuery) {
    const { page, limit, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AcademicYearWhereInput = {
      deletedAt: null,
    };

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    const [academicYears, total] = await Promise.all([
      prisma.academicYear.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          _count: {
            select: { classes: true },
          },
        },
      }),
      prisma.academicYear.count({ where }),
    ]);

    return {
      academicYears,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get current active academic year
   */
  async findActive() {
    const academicYear = await prisma.academicYear.findFirst({
      where: { isActive: true, deletedAt: null },
    });

    if (!academicYear) {
      throw Errors.notFound('No active academic year');
    }

    return academicYear;
  }

  /**
   * Get academic year by ID
   */
  async findById(id: string) {
    const academicYear = await prisma.academicYear.findFirst({
      where: { id, deletedAt: null },
      include: {
        classes: {
          where: { deletedAt: null },
          include: {
            unit: {
              select: { id: true, name: true },
            },
            _count: {
              select: { enrollments: { where: { status: 'active' } } },
            },
          },
        },
      },
    });

    if (!academicYear) {
      throw Errors.notFound('Academic Year');
    }

    return academicYear;
  }

  /**
   * Create new academic year
   */
  async create(input: CreateAcademicYearInput) {
    // Check name uniqueness
    const existing = await prisma.academicYear.findFirst({
      where: { name: input.name, deletedAt: null },
    });

    if (existing) {
      throw Errors.conflict('Academic year with this name already exists');
    }

    // If setting as active, deactivate other years
    if (input.isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        isActive: input.isActive,
      },
    });

    return academicYear;
  }

  /**
   * Update academic year
   */
  async update(id: string, input: UpdateAcademicYearInput) {
    const academicYear = await prisma.academicYear.findFirst({
      where: { id, deletedAt: null },
    });

    if (!academicYear) {
      throw Errors.notFound('Academic Year');
    }

    // Check name uniqueness if changing
    if (input.name && input.name !== academicYear.name) {
      const existing = await prisma.academicYear.findFirst({
        where: { name: input.name, id: { not: id }, deletedAt: null },
      });
      if (existing) {
        throw Errors.conflict('Academic year name already in use');
      }
    }

    // If setting as active, deactivate other years
    if (input.isActive === true && !academicYear.isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }

    const updated = await prisma.academicYear.update({
      where: { id },
      data: input,
    });

    return updated;
  }

  /**
   * Delete academic year (soft delete)
   */
  async delete(id: string) {
    const academicYear = await prisma.academicYear.findFirst({
      where: { id, deletedAt: null },
    });

    if (!academicYear) {
      throw Errors.notFound('Academic Year');
    }

    // Check if it's the active year
    if (academicYear.isActive) {
      throw Errors.badRequest('Cannot delete active academic year');
    }

    // Check if has classes
    const classCount = await prisma.class.count({
      where: { academicYearId: id, deletedAt: null },
    });

    if (classCount > 0) {
      throw Errors.badRequest('Cannot delete academic year with existing classes');
    }

    await prisma.academicYear.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Academic year deleted successfully' };
  }
}

export const academicYearService = new AcademicYearService();
