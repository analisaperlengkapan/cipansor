import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { UserRole, Prisma } from '@prisma/client';
import type {
  ListClassesQuery,
  CreateClassInput,
  UpdateClassInput,
  EnrollStudentInput,
  UpdateEnrollmentInput,
} from './class.schema';

export class ClassService {
  /**
   * Get all classes with pagination
   */
  async findAll(query: ListClassesQuery, currentUser: { role: UserRole; unitId: string | null }) {
    const { page, limit, search, unitId, academicYearId, level } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ClassWhereInput = {
      deletedAt: null,
    };

    // Filter by unit
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      where.unitId = currentUser.unitId || 'none';
    } else if (unitId) {
      where.unitId = unitId;
    }

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    if (level) {
      where.level = level;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
        include: {
          unit: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          academicYear: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              isActive: true,
            },
          },
          homeroomTeacher: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      }),
      prisma.class.count({ where }),
    ]);

    return {
      classes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get class by ID
   */
  async findById(id: string) {
    const classData = await prisma.class.findFirst({
      where: { id, deletedAt: null },
      include: {
        unit: true,
        academicYear: true,
        homeroomTeacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        enrollments: {
          where: { status: 'active' },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!classData) {
      throw Errors.notFound('Class');
    }

    return classData;
  }

  /**
   * Create new class
   */
  async create(input: CreateClassInput) {
    // Check unit exists
    const unit = await prisma.unit.findFirst({
      where: { id: input.unitId, deletedAt: null },
    });

    if (!unit) {
      throw Errors.notFound('Unit');
    }

    // Check academic year exists
    const academicYear = await prisma.academicYear.findFirst({
      where: { id: input.academicYearId, deletedAt: null },
    });

    if (!academicYear) {
      throw Errors.notFound('Academic Year');
    }

    // Check class name uniqueness within unit and academic year
    const existing = await prisma.class.findFirst({
      where: {
        name: input.name,
        unitId: input.unitId,
        academicYearId: input.academicYearId,
        deletedAt: null,
      },
    });

    if (existing) {
      throw Errors.conflict('Class with this name already exists for this unit and academic year');
    }

    // Verify homeroom teacher if provided
    if (input.homeroomTeacherId) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: input.homeroomTeacherId, unitId: input.unitId },
      });
      if (!teacher) {
        throw Errors.notFound('Teacher');
      }
    }

    const classData = await prisma.class.create({
      data: {
        name: input.name,
        unitId: input.unitId,
        academicYearId: input.academicYearId,
        level: input.level,
        capacity: input.capacity,
        homeroomTeacherId: input.homeroomTeacherId,
      },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return classData;
  }

  /**
   * Update class
   */
  async update(id: string, input: UpdateClassInput) {
    const classData = await prisma.class.findFirst({
      where: { id, deletedAt: null },
    });

    if (!classData) {
      throw Errors.notFound('Class');
    }

    // Check name uniqueness if changing
    if (input.name && input.name !== classData.name) {
      const existing = await prisma.class.findFirst({
        where: {
          name: input.name,
          unitId: classData.unitId,
          academicYearId: classData.academicYearId,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (existing) {
        throw Errors.conflict('Class name already in use');
      }
    }

    // Verify homeroom teacher if changing
    if (input.homeroomTeacherId) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: input.homeroomTeacherId, unitId: classData.unitId },
      });
      if (!teacher) {
        throw Errors.notFound('Teacher');
      }
    }

    // Build update data
    const updateData: Prisma.ClassUpdateInput = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.level !== undefined) updateData.level = input.level;
    if (input.capacity !== undefined) updateData.capacity = input.capacity;
    if (input.homeroomTeacherId !== undefined) {
      updateData.homeroomTeacher = input.homeroomTeacherId 
        ? { connect: { id: input.homeroomTeacherId } }
        : { disconnect: true };
    }

    const updated = await prisma.class.update({
      where: { id },
      data: updateData,
      include: {
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete class (soft delete)
   */
  async delete(id: string) {
    const classData = await prisma.class.findFirst({
      where: { id, deletedAt: null },
    });

    if (!classData) {
      throw Errors.notFound('Class');
    }

    // Check if class has active enrollments
    const activeEnrollments = await prisma.classEnrollment.count({
      where: { classId: id, status: 'active' },
    });

    if (activeEnrollments > 0) {
      throw Errors.badRequest('Cannot delete class with active enrollments');
    }

    await prisma.class.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Class deleted successfully' };
  }

  /**
   * Enroll student in class
   */
  async enrollStudent(classId: string, input: EnrollStudentInput) {
    const classData = await prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
      include: {
        _count: { select: { enrollments: { where: { status: 'active' } } } },
      },
    });

    if (!classData) {
      throw Errors.notFound('Class');
    }

    // Check capacity
    if (classData._count.enrollments >= classData.capacity) {
      throw Errors.badRequest('Class is at full capacity');
    }

    const student = await prisma.student.findFirst({
      where: { id: input.studentId, deletedAt: null, unitId: classData.unitId },
    });

    if (!student) {
      throw Errors.notFound('Student');
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.classEnrollment.findFirst({
      where: {
        studentId: input.studentId,
        classId,
        status: 'active',
      },
    });

    if (existingEnrollment) {
      throw Errors.conflict('Student already enrolled in this class');
    }

    const enrollment = await prisma.classEnrollment.create({
      data: {
        studentId: input.studentId,
        classId,
        status: 'active',
      },
      include: {
        student: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return enrollment;
  }

  /**
   * Update enrollment status
   */
  async updateEnrollment(classId: string, studentId: string, input: UpdateEnrollmentInput) {
    const enrollment = await prisma.classEnrollment.findFirst({
      where: { classId, studentId },
    });

    if (!enrollment) {
      throw Errors.notFound('Enrollment');
    }

    const updated = await prisma.classEnrollment.update({
      where: { id: enrollment.id },
      data: { status: input.status },
    });

    return updated;
  }

  /**
   * Remove student from class
   */
  async removeStudent(classId: string, studentId: string) {
    const enrollment = await prisma.classEnrollment.findFirst({
      where: { classId, studentId },
    });

    if (!enrollment) {
      throw Errors.notFound('Enrollment');
    }

    await prisma.classEnrollment.delete({
      where: { id: enrollment.id },
    });

    return { message: 'Student removed from class' };
  }
}

export const classService = new ClassService();
