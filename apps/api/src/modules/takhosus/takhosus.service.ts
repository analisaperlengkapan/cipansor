import { prisma } from '@/lib/prisma';
import { TakhosusStatus, HalaqohDay } from '@prisma/client';
import {
  CreateHalaqohInput,
  UpdateHalaqohInput,
  CreateEnrollmentInput,
  UpdateEnrollmentInput,
  CreateSanadInput,
  UpdateSanadInput,
} from './takhosus.schema';
import { targetService } from './target.service';

// =====================================
// HALAQOH SERVICE
// =====================================

export const halaqohService = {
  /**
   * Get all halaqoh with pagination
   */
  async findAll(params: {
    page: number;
    limit: number;
    unitId?: string;
    teacherId?: string;
    isActive?: boolean;
    level?: number;
  }) {
    const { page, limit, unitId, teacherId, isActive, level } = params;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(unitId && { unitId }),
      ...(teacherId && { teacherId }),
      ...(isActive !== undefined && { isActive }),
      ...(level && { level }),
    };

    const [data, total] = await Promise.all([
      prisma.halaqoh.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          unit: { select: { id: true, name: true } },
          teacher: { select: { id: true, name: true } },
          _count: { select: { enrollments: true } },
        },
      }),
      prisma.halaqoh.count({ where }),
    ]);

    return {
      data: data.map((h) => ({
        ...h,
        studentCount: h._count.enrollments,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get halaqoh by ID
   */
  async findById(id: string) {
    return prisma.halaqoh.findUnique({
      where: { id },
      include: {
        unit: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true, email: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
  },

  /**
   * Create halaqoh
   */
  async create(input: CreateHalaqohInput) {
    return prisma.halaqoh.create({
      data: {
        ...input,
        scheduleDay: input.scheduleDay as HalaqohDay[],
      } as any,
      include: {
        unit: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Update halaqoh
   */
  async update(id: string, input: UpdateHalaqohInput) {
    return prisma.halaqoh.update({
      where: { id },
      data: {
        ...input,
        ...(input.scheduleDay && { scheduleDay: input.scheduleDay as HalaqohDay[] }),
      },
      include: {
        unit: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Soft delete halaqoh
   */
  async delete(id: string) {
    return prisma.halaqoh.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};

// =====================================
// ENROLLMENT SERVICE
// =====================================

export const enrollmentService = {
  /**
   * Get all enrollments with pagination
   */
  async findAll(params: {
    page: number;
    limit: number;
    halaqohId?: string;
    status?: string;
    studentId?: string;
  }) {
    const { page, limit, halaqohId, status, studentId } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(halaqohId && { halaqohId }),
      ...(status && { status: status as TakhosusStatus }),
      ...(studentId && { studentId }),
    };

    const [data, total] = await Promise.all([
      prisma.takhosusEnrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true } },
              unit: { select: { id: true, name: true } },
            },
          },
          halaqoh: {
            select: { id: true, name: true, code: true },
          },
          _count: { select: { sanadRecords: true } },
        },
      }),
      prisma.takhosusEnrollment.count({ where }),
    ]);

    // OPTIMIZATION: Bulk fetch targets and progress to avoid N+1 queries
    const studentIds = data.map((e) => e.studentId);

    // 1. Get active academic year
    const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });

    // 2. Bulk fetch targets
    const targets = activeYear
      ? await prisma.tahfidzTarget.findMany({
          where: {
            studentId: { in: studentIds },
            academicYearId: activeYear.id,
          },
        })
      : [];

    // 3. Bulk fetch completed juz counts (distinct juz with score >= 60)
    // Note: Prisma doesn't support complex distinct count in groupBy easily, so we use findMany with distinct
    const completedJuzRecords = await prisma.tahfidzRecord.findMany({
      where: {
        studentId: { in: studentIds },
        activityType: { in: ['ASSESSMENT', 'TASMI'] },
        score: { gte: 60 },
      },
      select: { studentId: true, juz: true },
      distinct: ['studentId', 'juz'],
    });

    return {
      data: data.map((e) => {
        const target = targets.find((t) => t.studentId === e.studentId);
        const completedJuzCount = completedJuzRecords.filter(
          (r) => r.studentId === e.studentId
        ).length;

        // Use live target if available, otherwise fallback to enrollment data
        const finalTargetJuz = target?.targetJuz ?? e.targetJuz;
        // Use live completed count
        const finalCompletedJuz = completedJuzCount; // Prefer calculation over stored value in enrollment for accuracy

        const progressPercentage = Math.min(
          100,
          Math.round((finalCompletedJuz / finalTargetJuz) * 100)
        );
        const isOnTrack = finalCompletedJuz >= finalTargetJuz;

        return {
          ...e,
          sanadCount: e._count.sanadRecords,
          progressPercentage,
          targetJuz: finalTargetJuz,
          completedJuz: finalCompletedJuz,
          isOnTrack,
          enrollments: [], // Shim for missing property
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get enrollment by ID
   */
  async findById(id: string) {
    return prisma.takhosusEnrollment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            unit: { select: { id: true, name: true } },
          },
        },
        halaqoh: {
          include: {
            teacher: { select: { id: true, name: true } },
          },
        },
        sanadRecords: {
          include: {
            teacher: { select: { id: true, name: true } },
          },
          orderBy: { juz: 'asc' },
        },
      },
    });
  },

  /**
   * Get enrollment by student ID
   */
  async findByStudentId(studentId: string) {
    return prisma.takhosusEnrollment.findUnique({
      where: { studentId },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        halaqoh: {
          include: {
            teacher: { select: { id: true, name: true } },
          },
        },
        sanadRecords: {
          include: {
            teacher: { select: { id: true, name: true } },
          },
          orderBy: { juz: 'asc' },
        },
      },
    });
  },

  /**
   * Create enrollment
   */
  async create(input: CreateEnrollmentInput) {
    // Check if student already enrolled
    const existing = await prisma.takhosusEnrollment.findUnique({
      where: { studentId: input.studentId },
    });

    if (existing) {
      throw new Error('Student is already enrolled in Takhosus program');
    }

    return prisma.takhosusEnrollment.create({
      data: {
        ...input,
        targetCompletionDate: input.targetCompletionDate
          ? new Date(input.targetCompletionDate)
          : undefined,
        // Assuming currentJuz is required or has default, if error persists check schema
      } as any,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        halaqoh: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Update enrollment
   */
  async update(id: string, input: UpdateEnrollmentInput) {
    const data: any = { ...input };

    if (input.targetCompletionDate) {
      data.targetCompletionDate = new Date(input.targetCompletionDate);
    }

    if (input.status === 'COMPLETED' && !data.completedAt) {
      data.completedAt = new Date();
    }

    return prisma.takhosusEnrollment.update({
      where: { id },
      data,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        halaqoh: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Delete enrollment
   */
  async delete(id: string) {
    return prisma.takhosusEnrollment.delete({
      where: { id },
    });
  },

  /**
   * Get enrollment statistics
   */
  async getStats(unitId?: string) {
    const where = unitId ? { student: { unitId } } : {};

    const [total, active, completed, dropped] = await Promise.all([
      prisma.takhosusEnrollment.count({ where }),
      prisma.takhosusEnrollment.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.takhosusEnrollment.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.takhosusEnrollment.count({ where: { ...where, status: 'DROPPED' } }),
    ]);

    // Get average progress
    const avgProgress = await prisma.takhosusEnrollment.aggregate({
      where: { ...where, status: 'ACTIVE' },
      _avg: { completedJuz: true },
    });

    return {
      total,
      active,
      completed,
      dropped,
      averageProgress: Math.round(((avgProgress._avg.completedJuz || 0) / 30) * 100),
    };
  },
};

// =====================================
// SANAD SERVICE
// =====================================

export const sanadService = {
  /**
   * Get all sanad records with pagination
   */
  async findAll(params: {
    page: number;
    limit: number;
    enrollmentId?: string;
    teacherId?: string;
  }) {
    const { page, limit, enrollmentId, teacherId } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(enrollmentId && { enrollmentId }),
      ...(teacherId && { teacherId }),
    };

    const [data, total] = await Promise.all([
      prisma.sanadRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ enrollmentId: 'asc' }, { juz: 'asc' }],
        include: {
          enrollment: {
            include: {
              student: {
                include: {
                  user: { select: { id: true, name: true } },
                },
              },
            },
          },
          teacher: { select: { id: true, name: true } },
        },
      }),
      prisma.sanadRecord.count({ where }),
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
   * Get sanad by ID
   */
  async findById(id: string) {
    return prisma.sanadRecord.findUnique({
      where: { id },
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
        teacher: { select: { id: true, name: true, email: true } },
      },
    });
  },

  /**
   * Create sanad record
   */
  async create(input: CreateSanadInput) {
    // Check if sanad for this juz already exists
    const existing = await prisma.sanadRecord.findUnique({
      where: {
        enrollmentId_juz: {
          enrollmentId: input.enrollmentId,
          juz: input.juz,
        },
      },
    });

    if (existing) {
      throw new Error(`Sanad for Juz ${input.juz} already exists`);
    }

    const sanad = await prisma.sanadRecord.create({
      data: {
        ...input,
        certifiedAt: input.certifiedAt ? new Date(input.certifiedAt) : new Date(),
      } as any,
      include: {
        enrollment: true,
        teacher: { select: { id: true, name: true } },
      },
    });

    // Update enrollment progress
    await this.updateEnrollmentProgress(input.enrollmentId);

    return sanad;
  },

  /**
   * Update sanad record
   */
  async update(id: string, input: UpdateSanadInput) {
    const sanad = await prisma.sanadRecord.update({
      where: { id },
      data: {
        ...input,
        ...(input.certifiedAt && { certifiedAt: new Date(input.certifiedAt) }),
      },
      include: {
        enrollment: true,
        teacher: { select: { id: true, name: true } },
      },
    });

    // Update enrollment progress
    await this.updateEnrollmentProgress(sanad.enrollmentId);

    return sanad;
  },

  /**
   * Delete sanad record
   */
  async delete(id: string) {
    const sanad = await prisma.sanadRecord.delete({
      where: { id },
    });

    // Update enrollment progress
    await this.updateEnrollmentProgress(sanad.enrollmentId);

    return sanad;
  },

  /**
   * Update enrollment progress based on sanad records
   */
  async updateEnrollmentProgress(enrollmentId: string) {
    const sanadCount = await prisma.sanadRecord.count({
      where: { enrollmentId },
    });

    const enrollment = await prisma.takhosusEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) return;

    const completedJuz = sanadCount;
    const status = completedJuz >= enrollment.targetJuz ? 'COMPLETED' : enrollment.status;

    await prisma.takhosusEnrollment.update({
      where: { id: enrollmentId },
      data: {
        completedJuz,
        status,
        ...(status === 'COMPLETED' && !enrollment.completedAt && { completedAt: new Date() }),
      },
    });
  },
};

// =====================================
// PROGRESS SERVICE
// =====================================

export const progressService = {
  /**
   * Get student's takhosus progress
   */
  async getStudentProgress(studentId: string) {
    const enrollment = await prisma.takhosusEnrollment.findUnique({
      where: { studentId },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        halaqoh: {
          include: {
            teacher: { select: { id: true, name: true } },
          },
        },
        sanadRecords: {
          include: {
            teacher: { select: { id: true, name: true } },
          },
          orderBy: { juz: 'asc' },
        },
      },
    });

    if (!enrollment) {
      return null;
    }

    // Get tahfidz records for this student
    const tahfidzRecords = await prisma.tahfidzRecord.findMany({
      where: { studentId },
      orderBy: { recordedAt: 'desc' },
      take: 10,
    });

    // Get Target Info
    const targetInfo = await targetService.getProgress(studentId);

    // Calculate progress by juz
    const juzProgress = Array.from({ length: 30 }, (_, i) => {
      const juz = i + 1;
      const sanad = enrollment.sanadRecords.find((s) => s.juz === juz);
      return {
        juz,
        certified: !!sanad,
        certifiedAt: sanad?.certifiedAt,
        grade: sanad?.grade,
        teacherName: sanad?.teacher?.name,
      };
    });

    return {
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        targetJuz: enrollment.targetJuz,
        completedJuz: enrollment.completedJuz,
        currentJuz: enrollment.currentJuz,
        progressPercentage: Math.round((enrollment.completedJuz / enrollment.targetJuz) * 100),
        targetCompletionDate: enrollment.targetCompletionDate,
        completedAt: enrollment.completedAt,
      },
      target: targetInfo,
      student: enrollment.student,
      halaqoh: enrollment.halaqoh,
      juzProgress,
      recentActivity: tahfidzRecords.map((r) => ({
        id: r.id,
        type: r.activityType,
        surah: r.surahName,
        ayahStart: r.ayahStart,
        ayahEnd: r.ayahEnd,
        juz: r.juz,
        score: r.score,
        recordedAt: r.recordedAt,
      })),
    };
  },

  /**
   * Get halaqoh progress summary
   */
  async getHalaqohProgress(halaqohId: string) {
    const halaqoh = await prisma.halaqoh.findUnique({
      where: { id: halaqohId },
      include: {
        teacher: { select: { id: true, name: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
            sanadRecords: true,
          },
        },
      },
    });

    if (!halaqoh) {
      return null;
    }

    const students = halaqoh.enrollments.map((e) => ({
      id: e.student.id,
      name: e.student.user.name,
      enrolledAt: e.enrolledAt,
      targetJuz: e.targetJuz,
      completedJuz: e.completedJuz,
      currentJuz: e.currentJuz,
      progressPercentage: Math.round((e.completedJuz / e.targetJuz) * 100),
      sanadCount: e.sanadRecords.length,
    }));

    const totalProgress = students.reduce((acc, s) => acc + s.progressPercentage, 0);
    const averageProgress = students.length > 0 ? Math.round(totalProgress / students.length) : 0;

    return {
      halaqoh: {
        id: halaqoh.id,
        name: halaqoh.name,
        code: halaqoh.code,
        level: halaqoh.level,
        scheduleDay: halaqoh.scheduleDay,
        scheduleTime: halaqoh.scheduleTime,
        location: halaqoh.location,
      },
      teacher: halaqoh.teacher,
      studentCount: students.length,
      averageProgress,
      students: students.sort((a, b) => b.progressPercentage - a.progressPercentage),
    };
  },
};

// =====================================
// DASHBOARD SERVICE
// =====================================

export const dashboardService = {
  async getStats(unitId?: string) {
    const enrollmentWhere = {
      ...(unitId && { student: { unitId } }),
      status: 'ACTIVE' as TakhosusStatus,
    };

    const halaqohWhere = {
      ...(unitId && { unitId }),
      isActive: true,
    };

    const [
      totalActiveStudents,
      totalHalaqohs,
      totalSanads,
      progressAgg,
      recentSanads,
      topHalaqohs,
    ] = await Promise.all([
      prisma.takhosusEnrollment.count({ where: enrollmentWhere }),
      prisma.halaqoh.count({ where: halaqohWhere }),
      prisma.sanadRecord.count({
        where: unitId ? { enrollment: { student: { unitId } } } : {},
      }),
      prisma.takhosusEnrollment.aggregate({
        where: enrollmentWhere,
        _sum: { completedJuz: true },
        _avg: { completedJuz: true },
      }),
      prisma.sanadRecord.findMany({
        where: unitId ? { enrollment: { student: { unitId } } } : {},
        take: 5,
        orderBy: { certifiedAt: 'desc' },
        include: {
          enrollment: {
            include: {
              student: {
                // @ts-ignore
                include: { user: { select: { name: true } } },
              },
            },
          },
        },
      }),
      prisma.halaqoh.findMany({
        where: halaqohWhere,
        take: 5,
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            select: { completedJuz: true },
          },
          teacher: { select: { name: true } },
        },
      }) as any, // Cast to avoid inference errors on deep nesting
    ]);

    // Process top halaqohs by avg progress
    const halaqohPerformance = topHalaqohs
      .map((h) => {
        const totalJuz = h.enrollments.reduce((sum, e) => sum + e.completedJuz, 0);
        const avgJuz = h.enrollments.length > 0 ? totalJuz / h.enrollments.length : 0;
        return {
          id: h.id,
          name: h.name,
          teacherName: (h as any).teacher?.user?.name || '',
          studentCount: (h as any).enrollments?.length || 0,
          averageJuz: avgJuz,
        };
      })
      .sort((a, b) => b.averageJuz - a.averageJuz);

    return {
      activeStudents: totalActiveStudents,
      activeHalaqohs: totalHalaqohs,
      totalSanadsIssued: totalSanads,
      totalJuzMemorized: progressAgg._sum.completedJuz || 0,
      averageJuzPerStudent: progressAgg._avg.completedJuz || 0,
      recentSanads: recentSanads.map((s) => ({
        id: s.id,
        studentName: s.enrollment.student.user.name,
        juz: s.juz,
        certifiedAt: s.certifiedAt,
        grade: s.grade,
      })),
      topHalaqohs: halaqohPerformance,
    };
  },
};

export default {
  halaqoh: halaqohService,
  enrollment: enrollmentService,
  sanad: sanadService,
  progress: progressService,
  dashboard: dashboardService,
};
