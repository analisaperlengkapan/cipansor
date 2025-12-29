import { prisma } from '@/lib/prisma';
import { Prisma, DailyMood, MealConsumption, UnitType } from '@prisma/client';
import { whatsAppService } from '../notifications';
import { logger } from '@/lib/logger';
import type {
  ListDailyReportsQuery,
  CreateDailyReportInput,
  UpdateDailyReportInput,
  ConfirmReportInput,
  BulkCreateDailyReportsInput,
  StudentDailySummaryQuery,
  ClassDailySummaryQuery,
} from './daily-report.schema';

interface AuthContext {
  role: string;
  unitId?: string | null;
}

// ============================================
// Daily Report Service
// Using DailyStudentReport model
// ============================================

export const dailyReportService = {
  // ============================================
  // LIST & READ
  // ============================================

  async findAll(query: ListDailyReportsQuery, context: AuthContext) {
    const {
      page = 1,
      limit = 20,
      studentId,
      unitId,
      academicYearId,
      dateFrom,
      dateTo,
      date,
      mood,
      isConfirmedByParent,
      search,
    } = query;

    const where: Prisma.DailyStudentReportWhereInput = {};

    // Filter by student
    if (studentId) where.studentId = studentId;

    // Filter by unit (use context if not admin)
    if (context.role !== 'SUPERADMIN' && context.role !== 'ADMIN' && context.unitId) {
      where.unitId = context.unitId;
    } else if (unitId) {
      where.unitId = unitId;
    }

    // Filter by academic year
    if (academicYearId) where.academicYearId = academicYearId;

    // Date filters
    if (date) {
      const reportDate = new Date(date);
      reportDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(reportDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.reportDate = { gte: reportDate, lt: nextDay };
    } else if (dateFrom || dateTo) {
      where.reportDate = {};
      if (dateFrom) where.reportDate.gte = new Date(dateFrom);
      if (dateTo) where.reportDate.lte = new Date(dateTo);
    }

    // Filter by mood
    if (mood) {
      where.mood = mood as DailyMood;
    }

    // Filter by parent read status (as confirmation)
    if (isConfirmedByParent !== undefined) {
      where.parentReadAt = isConfirmedByParent ? { not: null } : null;
    }

    // Search in notes
    if (search) {
      where.OR = [
        { activitiesSummary: { contains: search, mode: 'insensitive' } },
        { healthStatus: { contains: search, mode: 'insensitive' } },
        { teacherNotes: { contains: search, mode: 'insensitive' } },
        { student: { user: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.dailyStudentReport.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              nisn: true,
              nis: true,
              user: { select: { id: true, name: true } },
            },
          },
          unit: { select: { id: true, name: true } },
          academicYear: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          photos: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ reportDate: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.dailyStudentReport.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string) {
    const report = await prisma.dailyStudentReport.findUniqueOrThrow({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            nisn: true,
            nis: true,
            birthDate: true,
            user: { select: { id: true, name: true } },
          },
        },
        unit: { select: { id: true, name: true, type: true } },
        academicYear: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        photos: true,
        homework: true,
      },
    });

    return report;
  },

  async findByStudentAndDate(studentId: string, date: Date) {
    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);

    return prisma.dailyStudentReport.findUnique({
      where: {
        studentId_reportDate: {
          studentId,
          reportDate,
        },
      },
    });
  },

  // ============================================
  // CREATE
  // ============================================

  async create(data: CreateDailyReportInput, userId: string) {
    // Get unit to determine unit type
    const unit = await prisma.unit.findUniqueOrThrow({
      where: { id: data.unitId },
      select: { type: true },
    });

    const reportDate = new Date(data.reportDate);
    reportDate.setHours(0, 0, 0, 0);

    // Check for existing report on same date
    const existingReport = await this.findByStudentAndDate(data.studentId, reportDate);
    if (existingReport) {
      throw new Error('Daily report already exists for this student on this date');
    }

    const report = await prisma.dailyStudentReport.create({
      data: {
        studentId: data.studentId,
        unitId: data.unitId,
        academicYearId: data.academicYearId,
        reportDate,
        unitType: unit.type as UnitType,
        mood: data.morningMood as DailyMood | undefined,
        healthStatus: data.healthNotes,
        temperature: data.temperature,
        hadBreakfast: data.breakfastConsumption === 'FULL' || data.breakfastConsumption === 'HALF',
        mealStatus: data.lunchConsumption as MealConsumption | undefined,
        snackStatus: data.snackConsumption as MealConsumption | undefined,
        napDuration: data.napDurationMinutes,
        toiletNotes: data.toiletingNotes,
        activitiesSummary: data.activitiesSummary,
        achievements: data.learningAchievements,
        tahfidzActivity: data.surahPractice,
        behaviorNotes: data.behaviorNotes,
        teacherNotes: data.parentNotes,
        homeActivity: data.homeworkSuggestion,
        createdById: userId,
        photos: data.photoUrls && data.photoUrls.length > 0
          ? {
            create: data.photoUrls.map((url) => ({
              photoUrl: url,
              caption: '',
            })),
          }
          : undefined,
      },
      include: {
        student: { select: { id: true, user: { select: { name: true } } } },
        unit: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        photos: true,
      },
    });

    // Send WhatsApp notification
    try {
      const studentData = await prisma.student.findUnique({
        where: { id: data.studentId },
        select: { parentName: true, parentPhone: true },
      });

      if (studentData?.parentPhone) {
        whatsAppService.sendDailyReportNotification({
          parentPhone: studentData.parentPhone,
          parentName: studentData.parentName || 'Orang Tua',
          studentName: report.student.user.name,
          date: reportDate,
          mood: data.morningMood,
          healthStatus: data.healthNotes,
        }).catch(err => logger.error(`Failed to send WA notification: ${err}`));
      }
    } catch (err) {
      logger.error(`Error in daily report notification trigger: ${err}`);
    }

    return report;
  },

  async bulkCreate(data: BulkCreateDailyReportsInput, userId: string) {
    const reportDate = new Date(data.reportDate);
    reportDate.setHours(0, 0, 0, 0);

    // Get unit type
    const unit = await prisma.unit.findUniqueOrThrow({
      where: { id: data.unitId },
      select: { type: true },
    });

    const results: { success: string[]; failed: { studentId: string; error: string }[] } = {
      success: [],
      failed: [],
    };

    for (const report of data.reports) {
      try {
        // Check for existing report
        const existing = await this.findByStudentAndDate(report.studentId, reportDate);
        if (existing) {
          results.failed.push({
            studentId: report.studentId,
            error: 'Report already exists for this date',
          });
          continue;
        }

        const createdReport = await prisma.dailyStudentReport.create({
          data: {
            studentId: report.studentId,
            unitId: data.unitId,
            academicYearId: data.academicYearId,
            reportDate,
            unitType: unit.type as UnitType,
            mood: report.morningMood as DailyMood | undefined,
            healthStatus: report.healthNotes,
            hadBreakfast: report.breakfastConsumption === 'FULL' || report.breakfastConsumption === 'HALF',
            mealStatus: report.lunchConsumption as MealConsumption | undefined,
            activitiesSummary: report.activitiesSummary,
            tahfidzActivity: report.ibadahNotes,
            teacherNotes: report.parentNotes,
            createdById: userId,
          },
          include: {
            student: { select: { id: true, user: { select: { name: true } } } },
          },
        });

        // Send WhatsApp notification
        try {
          const studentData = await prisma.student.findUnique({
            where: { id: report.studentId },
            select: { parentName: true, parentPhone: true },
          });

          if (studentData?.parentPhone) {
            whatsAppService.sendDailyReportNotification({
              parentPhone: studentData.parentPhone,
              parentName: studentData.parentName || 'Orang Tua',
              studentName: createdReport.student.user.name,
              date: reportDate,
              mood: report.morningMood,
              healthStatus: report.healthNotes,
            }).catch(err => logger.error(`Failed to send WA notification in bulk: ${err}`));
          }
        } catch (err) {
          logger.error(`Error in bulk daily report notification trigger: ${err}`);
        }

        results.success.push(report.studentId);
      } catch (error) {
        results.failed.push({
          studentId: report.studentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      created: results.success.length,
      failed: results.failed.length,
      details: results,
    };
  },

  // ============================================
  // UPDATE
  // ============================================

  async update(id: string, data: UpdateDailyReportInput) {
    const report = await prisma.dailyStudentReport.update({
      where: { id },
      data: {
        mood: data.morningMood as DailyMood | undefined,
        healthStatus: data.healthNotes,
        temperature: data.temperature,
        hadBreakfast: data.breakfastConsumption ? (data.breakfastConsumption === 'FULL' || data.breakfastConsumption === 'HALF') : undefined,
        mealStatus: data.lunchConsumption as MealConsumption | undefined,
        snackStatus: data.snackConsumption as MealConsumption | undefined,
        napDuration: data.napDurationMinutes,
        toiletNotes: data.toiletingNotes,
        activitiesSummary: data.activitiesSummary,
        achievements: data.learningAchievements,
        tahfidzActivity: data.surahPractice,
        behaviorNotes: data.behaviorNotes,
        teacherNotes: data.parentNotes,
        homeActivity: data.homeworkSuggestion,
      },
      include: {
        student: { select: { id: true, user: { select: { name: true } } } },
        photos: true,
      },
    });

    // Handle photo updates if provided
    if (data.photoUrls !== undefined) {
      // Delete existing photos
      await prisma.dailyReportPhoto.deleteMany({ where: { reportId: id } });

      // Create new photos
      if (data.photoUrls.length > 0) {
        await prisma.dailyReportPhoto.createMany({
          data: data.photoUrls.map((url) => ({
            reportId: id,
            photoUrl: url,
            caption: '',
          })),
        });
      }
    }

    return report;
  },

  // ============================================
  // DELETE
  // ============================================

  async delete(id: string) {
    // Check if report exists
    await prisma.dailyStudentReport.findUniqueOrThrow({ where: { id } });

    // Delete photos first
    await prisma.dailyReportPhoto.deleteMany({ where: { reportId: id } });

    await prisma.dailyStudentReport.delete({ where: { id } });

    return { message: 'Daily report deleted successfully' };
  },

  // ============================================
  // PARENT CONFIRMATION (Read notification)
  // ============================================

  async confirmByParent(id: string, _data: ConfirmReportInput, _userId: string) {
    const report = await prisma.dailyStudentReport.update({
      where: { id },
      data: {
        parentReadAt: new Date(),
      },
      include: {
        student: { select: { id: true, user: { select: { name: true } } } },
      },
    });

    return report;
  },

  // ============================================
  // SUMMARIES & STATISTICS
  // ============================================

  async getStudentMonthlySummary(query: StudentDailySummaryQuery) {
    const { studentId, academicYearId, month, year } = query;

    // Build date range
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const reports = await prisma.dailyStudentReport.findMany({
      where: {
        studentId,
        academicYearId,
        reportDate: { gte: startDate, lte: endDate },
      },
      include: {
        photos: true,
      },
      orderBy: { reportDate: 'asc' },
    });

    // Calculate mood distribution
    const moodDistribution: Record<string, number> = {
      HAPPY: 0,
      NEUTRAL: 0,
      SAD: 0,
      SICK: 0,
      TIRED: 0,
    };

    // Calculate meal statistics
    const mealStats: Record<string, Record<string, number>> = {
      meal: { HABIS: 0, SETENGAH: 0, SEDIKIT: 0, TIDAK_MAU: 0 },
      snack: { HABIS: 0, SETENGAH: 0, SEDIKIT: 0, TIDAK_MAU: 0 },
    };

    // Calculate attendance and confirmation
    let totalNapMinutes = 0;
    let napCount = 0;
    let confirmedCount = 0;

    reports.forEach((report) => {
      if (report.mood) moodDistribution[report.mood]++;
      if (report.mealStatus) mealStats.meal[report.mealStatus]++;
      if (report.snackStatus) mealStats.snack[report.snackStatus]++;
      if (report.napDuration) {
        totalNapMinutes += report.napDuration;
        napCount++;
      }
      if (report.parentReadAt) confirmedCount++;
    });

    return {
      student: await prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, nisn: true, user: { select: { name: true } } },
      }),
      period: {
        month: targetMonth,
        year: targetYear,
        startDate,
        endDate,
      },
      statistics: {
        totalReports: reports.length,
        confirmedByParent: confirmedCount,
        moodDistribution,
        mealStats,
        averageNapDuration: napCount > 0 ? Math.round(totalNapMinutes / napCount) : null,
      },
      reports,
    };
  },

  async getClassDailySummary(query: ClassDailySummaryQuery) {
    const { unitId, academicYearId, date } = query;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get students in unit
    const studentsWhere: Prisma.StudentWhereInput = {
      unitId,
      status: 'ACTIVE',
    };

    const [students, reports] = await Promise.all([
      prisma.student.findMany({
        where: studentsWhere,
        select: { id: true, nisn: true, user: { select: { name: true } } },
      }),
      prisma.dailyStudentReport.findMany({
        where: {
          unitId,
          academicYearId,
          reportDate: { gte: targetDate, lt: nextDay },
        },
        include: {
          student: { select: { id: true, nisn: true, user: { select: { name: true } } } },
        },
      }),
    ]);

    // Map reports by student
    const reportMap = new Map(reports.map((r) => [r.studentId, r]));

    // Build summary
    const summary = {
      date: targetDate.toISOString().split('T')[0],
      totalStudents: students.length,
      reportsSubmitted: reports.length,
      pendingReports: students.length - reports.length,
      confirmedByParents: reports.filter((r) => r.parentReadAt).length,
      moodOverview: {
        happy: reports.filter((r) => r.mood === 'HAPPY').length,
        sick: reports.filter((r) => r.mood === 'SICK').length,
      },
      studentsWithReports: reports.map((r) => ({
        studentId: r.studentId,
        studentName: r.student.user.name,
        mood: r.mood,
        isConfirmed: !!r.parentReadAt,
      })),
      studentsWithoutReports: students
        .filter((s) => !reportMap.has(s.id))
        .map((s) => ({ studentId: s.id, studentName: s.user.name })),
    };

    return summary;
  },
};
