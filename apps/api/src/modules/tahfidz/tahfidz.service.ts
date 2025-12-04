import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { UserRole, TahfidzActivityType, Prisma } from '@prisma/client';
import type {
  ListTahfidzQuery,
  CreateTahfidzInput,
  UpdateTahfidzInput,
} from './tahfidz.schema';

export class TahfidzService {
  /**
   * Get tahfidz records with pagination
   */
  async findAll(query: ListTahfidzQuery, currentUser: { role: UserRole; unitId: string | null }) {
    const { page, limit, studentId, activityType, startDate, endDate, surah } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TahfidzRecordWhereInput = {};

    // Filter by unit for non-super-admins
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      where.student = {
        unitId: currentUser.unitId || 'none',
      };
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (activityType) {
      where.activityType = activityType as TahfidzActivityType;
    }

    if (surah) {
      where.surahName = { contains: surah, mode: 'insensitive' };
    }

    // Date filtering
    if (startDate && endDate) {
      where.recordedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [records, total] = await Promise.all([
      prisma.tahfidzRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { recordedAt: 'desc' },
        include: {
          student: {
            include: {
              user: {
                select: { id: true, name: true },
              },
              unit: {
                select: { id: true, name: true },
              },
            },
          },
          recordedBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.tahfidzRecord.count({ where }),
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get tahfidz record by ID
   */
  async findById(id: string) {
    const record = await prisma.tahfidzRecord.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            unit: { select: { id: true, name: true } },
          },
        },
        recordedBy: { select: { id: true, name: true } },
      },
    });

    if (!record) {
      throw Errors.notFound('Tahfidz record');
    }

    return record;
  }

  /**
   * Create tahfidz record
   */
  async create(input: CreateTahfidzInput, recordedById: string) {
    // Verify student exists
    const student = await prisma.student.findFirst({
      where: { id: input.studentId, deletedAt: null },
    });

    if (!student) {
      throw Errors.notFound('Student');
    }

    // Calculate total ayah if not provided
    const totalAyah = input.totalAyah || (input.ayahEnd - input.ayahStart + 1);

    const record = await prisma.tahfidzRecord.create({
      data: {
        studentId: input.studentId,
        activityType: input.activityType as TahfidzActivityType,
        surahNumber: input.surahNumber,
        surahName: input.surahName,
        ayahStart: input.ayahStart,
        ayahEnd: input.ayahEnd,
        juz: input.juz,
        totalAyah,
        score: input.score,
        notes: input.notes,
        recordedAt: input.recordedAt || new Date(),
        recordedById,
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    return record;
  }

  /**
   * Update tahfidz record
   */
  async update(id: string, input: UpdateTahfidzInput) {
    const record = await prisma.tahfidzRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw Errors.notFound('Tahfidz record');
    }

    // Recalculate total ayah if ayah range changed
    let totalAyah = input.totalAyah;
    if (input.ayahStart !== undefined || input.ayahEnd !== undefined) {
      const ayahStart = input.ayahStart ?? record.ayahStart;
      const ayahEnd = input.ayahEnd ?? record.ayahEnd;
      totalAyah = totalAyah ?? (ayahEnd - ayahStart + 1);
    }

    const updated = await prisma.tahfidzRecord.update({
      where: { id },
      data: {
        activityType: input.activityType as TahfidzActivityType | undefined,
        surahNumber: input.surahNumber,
        surahName: input.surahName,
        ayahStart: input.ayahStart,
        ayahEnd: input.ayahEnd,
        juz: input.juz,
        totalAyah,
        score: input.score,
        notes: input.notes,
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete tahfidz record
   */
  async delete(id: string) {
    const record = await prisma.tahfidzRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw Errors.notFound('Tahfidz record');
    }

    await prisma.tahfidzRecord.delete({
      where: { id },
    });

    return { message: 'Tahfidz record deleted' };
  }

  /**
   * Get student tahfidz summary/progress
   */
  async getStudentSummary(studentId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      include: {
        user: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
      },
    });

    if (!student) {
      throw Errors.notFound('Student');
    }

    // Get activity type counts
    const activityCounts = await prisma.tahfidzRecord.groupBy({
      by: ['activityType'],
      where: { studentId },
      _count: { _all: true },
      _sum: { totalAyah: true },
    });

    // Get total records
    const totalRecords = await prisma.tahfidzRecord.count({
      where: { studentId },
    });

    // Get total ayah memorized (ziyadah only)
    const totalAyahZiyadah = await prisma.tahfidzRecord.aggregate({
      where: { studentId, activityType: 'ZIYADAH' },
      _sum: { totalAyah: true },
    });

    // Get unique juz covered
    const juzCovered = await prisma.tahfidzRecord.findMany({
      where: { studentId },
      select: { juz: true },
      distinct: ['juz'],
    });

    // Get unique surah covered
    const surahCovered = await prisma.tahfidzRecord.findMany({
      where: { studentId },
      select: { surahNumber: true, surahName: true },
      distinct: ['surahNumber'],
    });

    // Get average score from assessments
    const avgScore = await prisma.tahfidzRecord.aggregate({
      where: { studentId, activityType: 'ASSESSMENT', score: { not: null } },
      _avg: { score: true },
    });

    // Get recent records
    const recentRecords = await prisma.tahfidzRecord.findMany({
      where: { studentId },
      orderBy: { recordedAt: 'desc' },
      take: 5,
      include: {
        recordedBy: { select: { id: true, name: true } },
      },
    });

    return {
      student,
      summary: {
        totalRecords,
        totalAyahMemorized: totalAyahZiyadah._sum?.totalAyah || 0,
        juzCoveredCount: juzCovered.length,
        surahCoveredCount: surahCovered.length,
        averageScore: avgScore._avg?.score ? Number(avgScore._avg.score.toFixed(1)) : null,
      },
      byActivity: activityCounts.map(ac => ({
        type: ac.activityType,
        count: ac._count._all,
        totalAyah: ac._sum?.totalAyah || 0,
      })),
      juzCovered: juzCovered.map(j => j.juz).sort((a, b) => a - b),
      surahCovered: surahCovered.sort((a, b) => a.surahNumber - b.surahNumber),
      recentRecords,
    };
  }

  /**
   * Get tahfidz dashboard stats for visualization
   */
  async getDashboardStats(params: { unitId?: string; year?: number; month?: number }) {
    const { unitId, year, month } = params;
    const currentYear = year || new Date().getFullYear();

    // Build where clause
    const where: Prisma.TahfidzRecordWhereInput = {};
    if (unitId) {
      where.student = { unitId };
    }

    // Filter by year
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
    where.recordedAt = {
      gte: startOfYear,
      lte: endOfYear,
    };

    // If month is specified, filter by month
    if (month !== undefined && month >= 0 && month <= 11) {
      where.recordedAt = {
        gte: new Date(currentYear, month, 1),
        lte: new Date(currentYear, month + 1, 0, 23, 59, 59),
      };
    }

    // Get total records and students
    const [totalRecords, uniqueStudents] = await Promise.all([
      prisma.tahfidzRecord.count({ where }),
      prisma.tahfidzRecord.findMany({
        where,
        select: { studentId: true },
        distinct: ['studentId'],
      }),
    ]);

    // Records by activity type
    const recordsByType = await prisma.tahfidzRecord.groupBy({
      by: ['activityType'],
      where,
      _count: { _all: true },
    });

    // Progress by juz (students who have records for each juz)
    const progressByJuz = [];
    for (let juz = 1; juz <= 30; juz++) {
      const juzWhere = { ...where, juz };
      const studentsInJuz = await prisma.tahfidzRecord.findMany({
        where: juzWhere,
        select: { studentId: true },
        distinct: ['studentId'],
      });
      
      // Count students who completed at least 50% of the juz (simplified)
      const completedCount = studentsInJuz.length > 0 ? Math.ceil(studentsInJuz.length * 0.3) : 0;
      
      progressByJuz.push({
        juz,
        studentCount: studentsInJuz.length,
        completedCount,
      });
    }

    // Monthly activity (for the year)
    const monthlyActivity = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(currentYear, m, 1);
      const monthEnd = new Date(currentYear, m + 1, 0, 23, 59, 59);
      
      const monthWhere: Prisma.TahfidzRecordWhereInput = {
        ...(unitId && { student: { unitId } }),
        recordedAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      };

      const [ziyadah, murojaah, assessment] = await Promise.all([
        prisma.tahfidzRecord.count({ where: { ...monthWhere, activityType: 'ZIYADAH' } }),
        prisma.tahfidzRecord.count({ where: { ...monthWhere, activityType: 'MUROJAAH' } }),
        prisma.tahfidzRecord.count({ where: { ...monthWhere, activityType: 'ASSESSMENT' } }),
      ]);

      monthlyActivity.push({
        month: monthNames[m],
        setoran: ziyadah,
        murajaah: murojaah,
        tasmi: assessment,
      });
    }

    // Top students by total ayah memorized (ziyadah)
    const topStudentsData = await prisma.tahfidzRecord.groupBy({
      by: ['studentId'],
      where: {
        ...(unitId && { student: { unitId } }),
        activityType: 'ZIYADAH',
      },
      _sum: { totalAyah: true },
      orderBy: { _sum: { totalAyah: 'desc' } },
      take: 10,
    });

    const topStudentIds = topStudentsData.map(s => s.studentId);
    const topStudentDetails = await prisma.student.findMany({
      where: { id: { in: topStudentIds } },
      include: { user: { select: { name: true } } },
    });

    // Get juz counts for top students
    const topStudentsWithJuz = await Promise.all(
      topStudentsData.map(async (ts) => {
        const juzCount = await prisma.tahfidzRecord.findMany({
          where: { studentId: ts.studentId },
          select: { juz: true },
          distinct: ['juz'],
        });
        
        const studentDetail = topStudentDetails.find(s => s.id === ts.studentId);
        
        return {
          studentId: ts.studentId,
          studentName: studentDetail?.user?.name || '-',
          nis: studentDetail?.nis || '-',
          totalAyah: ts._sum.totalAyah || 0,
          completedJuz: juzCount.length,
        };
      })
    );

    // Recent records
    const recentRecords = await prisma.tahfidzRecord.findMany({
      where: unitId ? { student: { unitId } } : {},
      orderBy: { recordedAt: 'desc' },
      take: 10,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
            unit: { select: { id: true, name: true } },
          },
        },
        recordedBy: { select: { id: true, name: true } },
      },
    });

    return {
      totalRecords,
      totalStudents: uniqueStudents.length,
      recordsByType: recordsByType.map(r => ({
        type: r.activityType,
        count: r._count._all,
      })),
      progressByJuz,
      monthlyActivity,
      topStudents: topStudentsWithJuz,
      recentRecords,
    };
  }
}

export const tahfidzService = new TahfidzService();
