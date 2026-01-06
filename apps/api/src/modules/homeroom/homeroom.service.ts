import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { UserRole, Prisma, ViolationType } from '@prisma/client';

// User type from JwtPayload
interface AuthenticatedUser {
  sub: string;
  role: UserRole;
  unitId: string | null;
}

export class HomeroomService {
  /**
   * Get classes where user is homeroom teacher
   */
  async getMyClasses(currentUser: AuthenticatedUser) {
    const unitIdFilter = currentUser.role === UserRole.SUPER_ADMIN ? undefined : currentUser.unitId;

    const teacher = await prisma.teacher.findFirst({
      where: {
        userId: currentUser.sub,
        deletedAt: null,
        ...(unitIdFilter ? { unitId: unitIdFilter } : {}),
      },
    });

    if (!teacher) {
      return [];
    }

    const classes = await prisma.class.findMany({
      where: {
        homeroomTeacherId: teacher.id,
        deletedAt: null,
      },
      include: {
        unit: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true, isActive: true } },
        _count: { select: { enrollments: { where: { status: 'active' } } } },
      },
      orderBy: [{ academicYear: { name: 'desc' } }, { name: 'asc' }],
    });

    return classes;
  }

  /**
   * Get class dashboard
   */
  async getClassDashboard(classId: string, currentUser: AuthenticatedUser) {
    const classForAccess = await prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
      select: { id: true, unitId: true },
    });

    if (!classForAccess) throw Errors.notFound('Class not found');
    if (currentUser.role !== UserRole.SUPER_ADMIN && classForAccess.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    const classData = await prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
      include: {
        unit: true,
        academicYear: true,
        homeroomTeacher: {
          include: { user: { select: { name: true, email: true } } },
        },
        enrollments: {
          where: { status: 'active' },
          include: {
            student: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!classData) {
      throw Errors.notFound('Class not found');
    }

    // Get attendance summary for current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const attendanceSummary = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        classId,
        date: { gte: monthStart, lte: monthEnd },
      },
      _count: { status: true },
    });

    return {
      class: classData,
      studentCount: classData.enrollments.length,
      students: classData.enrollments.map((e) => e.student),
      attendanceSummary: attendanceSummary.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
    };
  }

  /**
   * Get students in homeroom class
   */
  async getHomeroomStudents(classId: string, currentUser: AuthenticatedUser) {
    const classData = await prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
    });

    if (!classData) {
      throw Errors.notFound('Class not found');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN && classData.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId, status: 'active' },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { student: { user: { name: 'asc' } } },
    });

    return enrollments.map((e: { student: unknown }) => e.student);
  }

  /**
   * Get attendance summary for class
   */
  async getAttendanceSummary(classId: string, startDate: string, endDate: string, currentUser: AuthenticatedUser) {
    const classData = await prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
    });

    if (!classData) {
      throw Errors.notFound('Class not found');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN && classData.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    const summary = await prisma.attendance.groupBy({
      by: ['studentId', 'status'],
      where: {
        classId,
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      _count: { status: true },
    });

    return summary;
  }

  /**
   * Get academic monitoring
   */
  async getAcademicMonitoring(classId: string, currentUser: AuthenticatedUser) {
    const classForAccess = await prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
      select: { id: true, unitId: true },
    });

    if (!classForAccess) throw Errors.notFound('Class not found');
    if (currentUser.role !== UserRole.SUPER_ADMIN && classForAccess.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    const classData = await prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
      include: {
        enrollments: {
          where: { status: 'active' },
          include: {
            student: {
              include: {
                user: { select: { name: true } },
                tahfidzRecords: {
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!classData) {
      throw Errors.notFound('Class not found');
    }

    return {
      classId,
      students: classData.enrollments.map((e) => ({
        id: e.student.id,
        name: e.student.user.name,
        latestTahfidz: e.student.tahfidzRecords[0] || null,
      })),
    };
  }

  /**
   * Get student detail
   */
  async getStudentDetail(studentId: string, currentUser: AuthenticatedUser) {
    const studentForAccess = await prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      select: { id: true, unitId: true },
    });

    if (!studentForAccess) throw Errors.notFound('Student not found');
    if (currentUser.role !== UserRole.SUPER_ADMIN && studentForAccess.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      include: {
        user: true,
        unit: { select: { id: true, name: true } },
        enrollments: {
          where: { status: 'active' },
          include: { class: { select: { id: true, name: true } } },
        },
        tahfidzRecords: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        attendances: {
          take: 30,
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!student) {
      throw Errors.notFound('Student not found');
    }

    return student;
  }

  /**
   * Get student notes - using violations/rewards as notes system
   */
  async getStudentNotes(studentId: string, currentUser: AuthenticatedUser) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
    });

    if (!student) {
      throw Errors.notFound('Student not found');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN && student.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    // Use violations as behavior notes
    const violations = await prisma.violation.findMany({
      where: { studentId },
      orderBy: { occurredAt: 'desc' },
      take: 20,
    });

    const rewards = await prisma.reward.findMany({
      where: { studentId },
      orderBy: { givenAt: 'desc' },
      take: 20,
    });

    return {
      violations,
      rewards,
    };
  }

  /**
   * Create student note - using violation/reward system
   */
  async createStudentNote(
    input: { studentId: string; type: 'POSITIVE' | 'NEGATIVE'; title: string; description?: string; category?: string },
    currentUser: AuthenticatedUser
  ) {
    const student = await prisma.student.findFirst({
      where: { id: input.studentId, deletedAt: null },
    });

    if (!student) {
      throw Errors.notFound('Student not found');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN && student.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    if (input.type === 'POSITIVE') {
      const reward = await prisma.reward.create({
        data: {
          studentId: input.studentId,
          category: input.category || 'general',
          description: input.description || input.title,
          points: 0,
          givenById: currentUser.sub,
          givenAt: new Date(),
        },
      });
      return { type: 'reward', data: reward };
    } else {
      const violation = await prisma.violation.create({
        data: {
          studentId: input.studentId,
          type: ViolationType.MINOR,
          category: input.category || 'general',
          description: input.description || input.title,
          points: 0,
          reportedById: currentUser.sub,
          occurredAt: new Date(),
        },
      });
      return { type: 'violation', data: violation };
    }
  }

  /**
   * Update student note
   */
  async updateStudentNote(
    noteId: string,
    input: { description?: string; category?: string },
    noteType: 'violation' | 'reward',
    currentUser: AuthenticatedUser
  ) {
    if (noteType === 'violation') {
      const violation = await prisma.violation.findUnique({
        where: { id: noteId },
        include: { student: true },
      });

      if (!violation) {
        throw Errors.notFound('Note not found');
      }

      if (currentUser.role !== UserRole.SUPER_ADMIN && violation.student.unitId !== currentUser.unitId) {
        throw Errors.forbidden('Access denied');
      }

      const updateData: { description?: string; category?: string } = {};
      if (input.description) updateData.description = input.description;
      if (input.category) updateData.category = input.category;

      return prisma.violation.update({
        where: { id: noteId },
        data: updateData,
      });
    } else {
      const reward = await prisma.reward.findUnique({
        where: { id: noteId },
        include: { student: true },
      });

      if (!reward) {
        throw Errors.notFound('Note not found');
      }

      if (currentUser.role !== UserRole.SUPER_ADMIN && reward.student.unitId !== currentUser.unitId) {
        throw Errors.forbidden('Access denied');
      }

      const rewardUpdateData: { description?: string; category?: string } = {};
      if (input.description) rewardUpdateData.description = input.description;
      if (input.category) rewardUpdateData.category = input.category;

      return prisma.reward.update({
        where: { id: noteId },
        data: rewardUpdateData,
      });
    }
  }

  /**
   * Delete student note
   */
  async deleteStudentNote(noteId: string, noteType: 'violation' | 'reward', currentUser: AuthenticatedUser) {
    if (noteType === 'violation') {
      const violation = await prisma.violation.findUnique({
        where: { id: noteId },
        include: { student: { select: { unitId: true } } },
      });

      if (!violation) throw Errors.notFound('Note not found');
      if (currentUser.role !== UserRole.SUPER_ADMIN && violation.student.unitId !== currentUser.unitId) {
        throw Errors.forbidden('Access denied');
      }

      await prisma.violation.delete({ where: { id: noteId } });
    } else {
      const reward = await prisma.reward.findUnique({
        where: { id: noteId },
        include: { student: { select: { unitId: true } } },
      });

      if (!reward) throw Errors.notFound('Note not found');
      if (currentUser.role !== UserRole.SUPER_ADMIN && reward.student.unitId !== currentUser.unitId) {
        throw Errors.forbidden('Access denied');
      }

      await prisma.reward.delete({ where: { id: noteId } });
    }
    return { success: true };
  }

  /**
   * Get behavior records
   */
  async getBehaviorRecords(classId: string, currentUser: AuthenticatedUser) {
    const classData = await prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
    });

    if (!classData) {
      throw Errors.notFound('Class not found');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN && classData.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId, status: 'active' },
      select: { studentId: true },
    });

    const studentIds = enrollments.map((e: { studentId: string }) => e.studentId);

    const [violations, rewards] = await Promise.all([
      prisma.violation.findMany({
        where: { studentId: { in: studentIds } },
        include: { student: { include: { user: { select: { name: true } } } } },
        orderBy: { occurredAt: 'desc' },
        take: 50,
      }),
      prisma.reward.findMany({
        where: { studentId: { in: studentIds } },
        include: { student: { include: { user: { select: { name: true } } } } },
        orderBy: { givenAt: 'desc' },
        take: 50,
      }),
    ]);

    return { violations, rewards };
  }

  /**
   * Record behavior
   */
  async recordBehavior(
    input: { studentId: string; type: 'POSITIVE' | 'NEGATIVE'; title: string; description?: string; category?: string; points?: number },
    currentUser: AuthenticatedUser
  ) {
    return this.createStudentNote(
      { studentId: input.studentId, type: input.type, title: input.title, description: input.description, category: input.category },
      currentUser
    );
  }
}

export const homeroomService = new HomeroomService();
