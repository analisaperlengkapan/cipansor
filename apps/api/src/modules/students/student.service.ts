import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { Errors } from '@/middleware/error';
import { UserRole, Gender, Prisma } from '@prisma/client';
import type { ListStudentsQuery, CreateStudentInput, UpdateStudentInput } from './student.schema';

export class StudentService {
  /**
   * Get all students with pagination
   */
  async findAll(query: ListStudentsQuery, currentUser: { role: UserRole; unitId: string | null }) {
    const { page, limit, search, unitId, classId, gender } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {
      deletedAt: null,
    };

    // Filter by unit
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      where.unitId = currentUser.unitId || 'none';
    } else if (unitId) {
      where.unitId = unitId;
    }

    if (gender) {
      where.gender = gender as Gender;
    }

    if (classId) {
      where.enrollments = {
        some: {
          classId,
          status: 'active',
        },
      };
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { nis: { contains: search, mode: 'insensitive' } },
        { nisn: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          enrollments: {
            where: { status: 'active' },
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                },
              },
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    // Map response to match shared types/frontend expectations
    // Specifically ensuring currentClass has 'grade' mapped from 'level'
    const mappedStudents = students.map((student) => {
      const currentEnrollment = student.enrollments[0]; // active enrollment due to filter
      const currentClass = currentEnrollment?.class
        ? {
            id: currentEnrollment.class.id,
            name: currentEnrollment.class.name,
            grade: parseInt(currentEnrollment.class.level) || 0,
            level: currentEnrollment.class.level,
          }
        : null;

      return {
        ...student,
        currentClass,
        // Flatten user properties if needed, but existing FE likely expects nested user
      };
    });

    return {
      students: mappedStudents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get student by ID
   */
  async findById(id: string) {
    const student = await prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
        unit: true,
        enrollments: {
          include: {
            class: {
              include: {
                academicYear: true,
              },
            },
          },
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        tahfidzRecords: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!student) {
      throw Errors.notFound('Student');
    }

    // Find active enrollment for current class
    const currentEnrollment = student.enrollments.find(e => e.status === 'active');
    const currentClass = currentEnrollment?.class
      ? {
          id: currentEnrollment.class.id,
          name: currentEnrollment.class.name,
          grade: parseInt(currentEnrollment.class.level) || 0,
          level: currentEnrollment.class.level,
          academicYear: currentEnrollment.class.academicYear,
        }
      : null;

    return {
      ...student,
      currentClass,
    };
  }

  /**
   * Create new student (with user account)
   */
  async create(input: CreateStudentInput) {
    // Check if NIS already exists
    const existingNis = await prisma.student.findFirst({
      where: { nis: input.nis },
    });

    if (existingNis) {
      throw Errors.conflict('NIS already exists');
    }

    // Check if email exists
    const existingEmail = await prisma.user.findFirst({
      where: { email: input.email },
    });

    if (existingEmail) {
      throw Errors.conflict('Email already registered');
    }

    // Check unit exists
    const unit = await prisma.unit.findFirst({
      where: { id: input.unitId, deletedAt: null },
    });

    if (!unit) {
      throw Errors.notFound('Unit');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user and student in transaction
    const student = await prisma.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: UserRole.STUDENT,
          unitId: input.unitId,
          isActive: true,
        },
      });

      // Create student profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          unitId: input.unitId,
          nis: input.nis,
          nisn: input.nisn,
          gender: input.gender as Gender,
          birthPlace: input.birthPlace,
          birthDate: input.birthDate,
          address: input.address,
          parentName: input.parentName,
          parentPhone: input.parentPhone,
          parentEmail: input.parentEmail,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Enroll in class if provided
      if (input.classId) {
        const classExists = await tx.class.findFirst({
          where: { id: input.classId, deletedAt: null, unitId: input.unitId },
        });

        if (classExists) {
          await tx.classEnrollment.create({
            data: {
              studentId: student.id,
              classId: input.classId,
              status: 'active',
            },
          });
        }
      }

      return student;
    });

    return student;
  }

  /**
   * Update student
   */
  async update(id: string, input: UpdateStudentInput) {
    const student = await prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: { user: true },
    });

    if (!student) {
      throw Errors.notFound('Student');
    }

    // Check NIS uniqueness if changing
    if (input.nis && input.nis !== student.nis) {
      const existingNis = await prisma.student.findFirst({
        where: { nis: input.nis, id: { not: id } },
      });
      if (existingNis) {
        throw Errors.conflict('NIS already in use');
      }
    }

    // Update in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update user name if provided
      if (input.name) {
        await tx.user.update({
          where: { id: student.userId },
          data: { name: input.name },
        });
      }

      // Update student
      return tx.student.update({
        where: { id },
        data: {
          nis: input.nis,
          nisn: input.nisn,
          gender: input.gender as Gender | undefined,
          birthPlace: input.birthPlace,
          birthDate: input.birthDate,
          address: input.address,
          parentName: input.parentName,
          parentPhone: input.parentPhone,
          parentEmail: input.parentEmail,
          photoUrl: input.photoUrl,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    return updated;
  }

  /**
   * Delete student (soft delete)
   */
  async delete(id: string) {
    const student = await prisma.student.findFirst({
      where: { id, deletedAt: null },
    });

    if (!student) {
      throw Errors.notFound('Student');
    }

    // Soft delete both student and user
    await prisma.$transaction([
      prisma.student.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: student.userId },
        data: { deletedAt: new Date() },
      }),
    ]);

    return { message: 'Student deleted successfully' };
  }
}

export const studentService = new StudentService();
