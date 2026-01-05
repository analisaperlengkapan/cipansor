import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { UserRole, Prisma } from '@prisma/client';
import type {
  ListClassesQuery,
} from './class.schema';
import { CreateClassInput, UpdateClassInput, ClassEnrollmentInput, UpdateEnrollmentInput, Class, ClassEnrollment, EnrollStudentInput } from '@cipansor/shared';

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

    // Map to Shared Type if necessary, or ensure structure matches.
    // The shared 'Class' type has 'grade' (number) and 'level' (string).
    // The DB has 'level'. We should probably map 'grade' if the FE expects it,
    // but looking at `use-classes.ts` in the *original* file, it had `grade: number`.
    // My shared type has both. I will map level to grade (parse int) just in case.

    const mappedClasses = classes.map(c => ({
      ...c,
      grade: parseInt(c.level) || 0, // Best effort mapping
      studentCount: c._count.enrollments,
      // Ensure unit matches expected shape (optional fields)
      unit: c.unit ? { id: c.unit.id, name: c.unit.name } : undefined, // Shared type is simpler
    })) as unknown as Class[];

    return {
      classes: mappedClasses,
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
  async findById(id: string): Promise<Class> {
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
              select: {
                id: true,
                nis: true,
                gender: true,
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
        _count: {
            select: {
              enrollments: true,
            },
        },
      },
    });

    if (!classData) {
      throw Errors.notFound('Class');
    }

    return {
        ...classData,
        grade: parseInt(classData.level) || 0,
        studentCount: classData._count.enrollments,
        // The shared type expects homeroomTeacher to have { id, user: { id, name, email } }
        // The query returns exactly that structure.
        homeroomTeacher: classData.homeroomTeacher ? {
            id: classData.homeroomTeacher.id,
            user: classData.homeroomTeacher.user
        } : null,
        // The shared type for Class includes basic unit info
        unit: {
            id: classData.unit.id,
            name: classData.unit.name
        },
        // We need to cast because 'enrollments' in shared type Class might be different or excluded
        // The shared type 'Class' definition I created earlier didn't explicitly include 'enrollments' array
        // but it did include '_count'.
        // Wait, looking at my `class.ts` creation:
        // interface Class { ... _count?: { enrollments: number }; studentCount?: number; ... }
        // It did NOT include `enrollments: ClassEnrollment[]`.
        // However, the `findById` in the *original* controller returned `data` which *might* have had enrollments if the FE expected it.
        // The original `use-classes.ts` had `useClassEnrollments` as a separate hook.
        // `useClass` just fetched the class.
        // So `findById` returning the class object is correct.
    } as unknown as Class;
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

    // Set default capacity if not provided
    const capacity = input.capacity ?? 30;

    const classData = await prisma.class.create({
      data: {
        name: input.name,
        unitId: input.unitId,
        academicYearId: input.academicYearId,
        level: input.level,
        capacity,
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
  async enrollStudent(classId: string, input: EnrollStudentInput): Promise<ClassEnrollment> {
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
          select: {
            id: true,
            nis: true,
            gender: true,
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return enrollment as unknown as ClassEnrollment;
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

    // Use Prisma.ClassEnrollmentUpdateInput to be safe, or just object
    // Cast input.status to the correct Enum from @prisma/client if needed
    // But since UpdateEnrollmentInput.status is string, and DB is enum...
    // The shared type should match the DB enum ideally.
    // Assuming 'active' | 'completed' etc match.

    const updated = await prisma.classEnrollment.update({
      where: { id: enrollment.id },
      data: { status: input.status as any }, // Cast to any or correct Enum type
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

  /**
   * Get enrollments for a class
   */
  async getEnrollments(classId: string): Promise<ClassEnrollment[]> {
    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        classId,
        status: 'active',
        student: { deletedAt: null },
      },
      include: {
        student: {
          select: {
            id: true,
            nis: true,
            gender: true,
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
      orderBy: {
        student: {
          user: {
            name: 'asc',
          },
        },
      },
    });

    return enrollments.map((enrollment) => ({
      ...enrollment,
      student: {
        ...enrollment.student,
        name: enrollment.student.user.name,
      },
    })) as unknown as ClassEnrollment[];
  }
}

export const classService = new ClassService();
