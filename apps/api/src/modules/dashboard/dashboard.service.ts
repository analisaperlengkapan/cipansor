/**
 * Dashboard Service
 * Business logic for dashboard metrics and statistics
 *
 * This service layer separates business logic from the controller,
 * following the layered architecture pattern for better testability
 * and maintainability.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getCurrentDashboardMetrics } from '@/lib/realtime';
import type {
  DashboardStats,
  AttendanceStats,
  FinanceStats,
  TahfidzStats,
  ViolationRewardStats,
  DashboardMetrics,
  DashboardAlert,
} from '@cipansor/shared';

export interface DashboardServiceContext {
  userId?: string;
  unitId?: string;
  role?: string;
}

export interface DateRangeParams {
  startDate?: Date;
  endDate?: Date;
}

export interface PeriodParams {
  period?: 'week' | 'month' | 'year';
}

/**
 * Dashboard Service Class
 * Handles all dashboard-related business logic
 */
export class DashboardService {
  /**
   * Get main dashboard statistics
   */
  async getStats(context: DashboardServiceContext): Promise<DashboardStats> {
    const unitFilter = context.unitId ? { unitId: context.unitId } : {};

    // Calculate date for last month comparison
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const [
      totalStudents,
      activeStudents,
      lastMonthStudents,
      totalTeachers,
      totalClasses,
      totalUnits,
      todayAttendance,
      activeAcademicYear,
    ] = await Promise.all([
      prisma.student.count({ where: unitFilter }),
      prisma.student.count({ where: { ...unitFilter, status: 'ACTIVE' } }),
      prisma.student.count({
        where: {
          ...unitFilter,
          status: 'ACTIVE',
          createdAt: { lte: lastMonth },
        },
      }),
      prisma.teacher.count({ where: unitFilter }),
      prisma.class.count({ where: unitFilter }),
      prisma.unit.count({ where: context.unitId ? { id: context.unitId } : {} }),
      this.getTodayAttendanceCount(context.unitId),
      prisma.academicYear.findFirst({ where: { isActive: true } }),
    ]);

    // Calculate student growth percentage
    let studentsGrowth = 0;
    if (lastMonthStudents > 0) {
      studentsGrowth = Math.round(((activeStudents - lastMonthStudents) / lastMonthStudents) * 100);
    }

    // Calculate attendance rate
    const attendanceRate =
      activeStudents > 0 ? Math.round((todayAttendance / activeStudents) * 100) : 0;

    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalUnits,
      studentsGrowth,
      attendanceRate,
      activeAcademicYear: activeAcademicYear
        ? {
            id: activeAcademicYear.id,
            name: activeAcademicYear.name,
            startDate: activeAcademicYear.startDate.toISOString(),
            endDate: activeAcademicYear.endDate.toISOString(),
          }
        : undefined,
    };
  }

  /**
   * Get quick stats for dashboard cards
   */
  async getQuickStats(context: DashboardServiceContext): Promise<{
    totalStudents: number;
    activeStudents: number;
    totalTeachers: number;
    todayAttendance: number;
    attendanceRate: number;
  }> {
    const unitFilter = context.unitId ? { unitId: context.unitId } : {};

    const [totalStudents, activeStudents, totalTeachers, todayAttendance] = await Promise.all([
      prisma.student.count({ where: unitFilter }),
      prisma.student.count({ where: { ...unitFilter, status: 'ACTIVE' } }),
      prisma.teacher.count({ where: unitFilter }),
      this.getTodayAttendanceCount(context.unitId),
    ]);

    const attendanceRate =
      activeStudents > 0 ? Math.round((todayAttendance / activeStudents) * 100) : 0;

    return {
      totalStudents,
      activeStudents,
      totalTeachers,
      todayAttendance,
      attendanceRate,
    };
  }

  /**
   * Get dashboard metrics with history and alerts
   */
  async getMetrics(context: DashboardServiceContext): Promise<{
    current: DashboardMetrics;
    recent: DashboardMetrics[];
    alerts: DashboardAlert[];
  }> {
    const [current, recent, alerts] = await Promise.all([
      getCurrentDashboardMetrics(context.unitId),
      this.getRecentMetricsHistory(context.unitId),
      this.getActiveAlerts(context.unitId),
    ]);

    logger.info('Dashboard metrics retrieved', {
      userId: context.userId,
      unitId: context.unitId || 'all',
      alertCount: alerts.length,
    });

    return { current, recent, alerts };
  }

  /**
   * Get attendance statistics with date range
   */
  async getAttendanceStats(
    context: DashboardServiceContext,
    dateRange: DateRangeParams
  ): Promise<AttendanceStats[]> {
    // Default to last 7 days if not specified
    const end = dateRange.endDate || new Date();
    const start = dateRange.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        ...(context.unitId ? { student: { unitId: context.unitId } } : {}),
      },
      select: {
        date: true,
        status: true,
      },
    });

    // Aggregate by date
    const statsMap = new Map<string, AttendanceStats>();

    attendanceRecords.forEach((record) => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!statsMap.has(dateStr)) {
        statsMap.set(dateStr, {
          date: dateStr,
          present: 0,
          absent: 0,
          sick: 0,
          excused: 0,
        });
      }

      const stats = statsMap.get(dateStr)!;
      switch (record.status) {
        case 'PRESENT':
          stats.present++;
          break;
        case 'ABSENT':
          stats.absent++;
          break;
        case 'SICK':
          stats.sick++;
          break;
        case 'EXCUSED':
          stats.excused++;
          break;
      }
    });

    return Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get finance statistics
   */
  async getFinanceStats(context: DashboardServiceContext): Promise<FinanceStats> {
    const unitFilter = context.unitId ? { student: { unitId: context.unitId } } : {};

    const [totalBilled, totalPaid, totalUnpaid, recentPaymentsRaw] = await Promise.all([
      prisma.invoice.aggregate({
        where: { ...unitFilter },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { ...unitFilter, status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { ...unitFilter, status: { not: 'PAID' } },
        _sum: { amount: true },
      }),
      prisma.payment.findMany({
        where: {
          invoice: { ...unitFilter },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: {
            include: {
              student: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const recentPayments = recentPaymentsRaw.map((p) => ({
      id: p.id,
      studentName: p.invoice.student.user.name,
      amount: Number(p.amount),
      date: p.createdAt.toISOString(),
    }));

    return {
      totalBilled: Number(totalBilled._sum.amount || 0),
      totalPaid: Number(totalPaid._sum.amount || 0),
      totalUnpaid: Number(totalUnpaid._sum.amount || 0),
      recentPayments,
    };
  }

  /**
   * Get comprehensive tahfidz statistics with real data
   */
  async getTahfidzStats(context: DashboardServiceContext, params: PeriodParams = {}) {
    const period = params.period || 'month';
    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case 'week':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        periodStart = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const unitFilter = context.unitId ? { student: { unitId: context.unitId } } : {};

    // Get total memorized ayah across all students
    const totalMemorizedResult = await prisma.tahfidzRecord.aggregate({
      where: {
        ...unitFilter,
        activityType: 'ZIYADAH',
      },
      _sum: { totalAyah: true },
    });

    // Get average juz memorized per student
    const studentsWithTahfidz = await prisma.tahfidzRecord.groupBy({
      by: ['studentId'],
      where: {
        ...unitFilter,
        activityType: 'ZIYADAH',
      },
      _sum: { totalAyah: true },
    });

    // Calculate average juz (approximately 600 ayah per juz)
    const AYAH_PER_JUZ = 600;
    const totalStudentsWithRecords = studentsWithTahfidz.length;
    const totalAyahAllStudents = studentsWithTahfidz.reduce(
      (sum, s) => sum + (s._sum.totalAyah || 0),
      0
    );
    const averageJuz =
      totalStudentsWithRecords > 0
        ? Math.round((totalAyahAllStudents / totalStudentsWithRecords / AYAH_PER_JUZ) * 10) / 10
        : 0;

    // Get top 5 students by memorization
    const topStudentsRaw = await prisma.tahfidzRecord.groupBy({
      by: ['studentId'],
      where: {
        ...unitFilter,
        activityType: 'ZIYADAH',
      },
      _sum: { totalAyah: true },
      orderBy: {
        _sum: { totalAyah: 'desc' },
      },
      take: 5,
    });

    // Fetch student details for top students
    const topStudentIds = topStudentsRaw.map((s) => s.studentId);
    const studentsData = await prisma.student.findMany({
      where: { id: { in: topStudentIds } },
      include: {
        user: { select: { name: true } },
        unit: { select: { name: true } },
      },
    });

    const studentMap = new Map(studentsData.map((s) => [s.id, s]));
    const topStudents = topStudentsRaw.map((s) => {
      const student = studentMap.get(s.studentId);
      const totalAyah = s._sum.totalAyah || 0;
      const juzCount = Math.floor(totalAyah / AYAH_PER_JUZ);
      return {
        id: s.studentId,
        studentId: s.studentId,
        name: student?.user.name || 'Unknown',
        studentName: student?.user.name || 'Unknown',
        unitName: student?.unit?.name || 'Unknown',
        totalAyat: totalAyah,
        totalAyah,
        totalJuz: juzCount,
        juzCount,
        surahCount: 0, // Would need additional query
      };
    });

    // Get monthly progress
    const monthlyProgress = await this.getMonthlyTahfidzProgress(context, periodStart);

    return {
      totalMemorized: totalMemorizedResult._sum.totalAyah || 0,
      averageJuz,
      topStudents,
      monthlyProgress,
    };
  }

  /**
   * Get violation and reward statistics
   */
  async getViolationRewardStats(context: DashboardServiceContext, params: PeriodParams = {}) {
    const period = params.period || 'month';
    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case 'week':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        periodStart = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const unitFilter = context.unitId ? { student: { unitId: context.unitId } } : {};

    const [totalViolations, totalRewards, recentViolationsRaw, recentRewardsRaw] =
      await Promise.all([
        prisma.violation.count({
          where: {
            ...unitFilter,
            createdAt: { gte: periodStart },
          },
        }),
        prisma.reward.count({
          where: {
            ...unitFilter,
            createdAt: { gte: periodStart },
          },
        }),
        prisma.violation.findMany({
          where: { ...unitFilter },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            student: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        }),
        prisma.reward.findMany({
          where: { ...unitFilter },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            student: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        }),
      ]);

    const recentViolations = recentViolationsRaw.map((v) => ({
      id: v.id,
      studentName: v.student.user.name,
      type: v.type.toString(),
      points: v.points,
      date: v.createdAt.toISOString(),
    }));

    const recentRewards = recentRewardsRaw.map((r) => ({
      id: r.id,
      studentName: r.student.user.name,
      type: r.category, // Reward uses 'category' field
      points: r.points,
      date: r.createdAt.toISOString(),
    }));

    return {
      totalViolations,
      totalRewards,
      recentViolations,
      recentRewards,
    };
  }

  /**
   * Get monthly tahfidz progress data for charts
   */
  private async getMonthlyTahfidzProgress(
    context: DashboardServiceContext,
    since: Date
  ): Promise<Array<{ month: string; ayahCount: number; studentCount: number }>> {
    const unitFilter = context.unitId ? { student: { unitId: context.unitId } } : {};

    const records = await prisma.tahfidzRecord.findMany({
      where: {
        ...unitFilter,
        activityType: 'ZIYADAH',
        recordedAt: { gte: since },
      },
      select: {
        recordedAt: true,
        totalAyah: true,
        studentId: true,
      },
    });

    // Group by month
    const monthlyMap = new Map<string, { ayahCount: number; students: Set<string> }>();

    records.forEach((record) => {
      const monthKey = record.recordedAt.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { ayahCount: 0, students: new Set() });
      }
      const data = monthlyMap.get(monthKey)!;
      data.ayahCount += record.totalAyah;
      data.students.add(record.studentId);
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        totalAyat: data.ayahCount, // backward compatibility
        ayahCount: data.ayahCount,
        studentCount: data.students.size,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Get recent metrics history for trend visualization
   */
  private async getRecentMetricsHistory(unitId?: string): Promise<DashboardMetrics[]> {
    try {
      const history = await prisma.dashboardHistory.findMany({
        where: {
          unitId: unitId || null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 12, // Last 12 data points
      });

      if (history.length === 0) {
        const current = await getCurrentDashboardMetrics(unitId);
        return [current];
      }

      return history.map((h) => h.metrics as unknown as DashboardMetrics).reverse();
    } catch (error) {
      logger.error('Error fetching metrics history:', error);
      const current = await getCurrentDashboardMetrics(unitId);
      return [current];
    }
  }

  /**
   * Get active dashboard alerts
   */
  private async getActiveAlerts(unitId?: string): Promise<DashboardAlert[]> {
    const alerts: DashboardAlert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const unitFilter = unitId ? { unitId } : {};

      // 1. Check attendance rate
      const [activeStudents, todayPresent] = await Promise.all([
        prisma.student.count({
          where: { ...unitFilter, status: 'ACTIVE' },
        }),
        prisma.attendance.count({
          where: {
            date: { gte: today },
            status: 'PRESENT',
            ...(unitId ? { student: { unitId } } : {}),
          },
        }),
      ]);

      const attendanceRate = activeStudents > 0 ? (todayPresent / activeStudents) * 100 : 0;

      if (attendanceRate < 80 && attendanceRate > 0) {
        alerts.push({
          id: `attendance-low-${Date.now()}`,
          title: 'Tingkat Kehadiran Rendah',
          message: `Tingkat kehadiran hari ini: ${attendanceRate.toFixed(1)}%. Perlu perhatian khusus.`,
          severity: attendanceRate < 70 ? 'CRITICAL' : 'WARNING',
          timestamp: new Date().toISOString(),
        });
      }

      // 2. Check overdue invoices
      const overdueInvoices = await prisma.invoice.count({
        where: {
          status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
          dueDate: { lt: new Date() },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          ...(unitId ? { student: { unitId } } : {}),
        },
      });

      if (overdueInvoices > 0) {
        alerts.push({
          id: `invoices-overdue-${Date.now()}`,
          title: 'Tagihan Terlambat',
          message: `${overdueInvoices} tagihan melewati batas waktu pembayaran.`,
          severity: overdueInvoices > 10 ? 'WARNING' : 'INFO',
          timestamp: new Date().toISOString(),
        });
      }

      // 3. Check murojaah quality
      const recentQuality = await prisma.murojaahRecord.aggregate({
        _avg: { qualityScore: true },
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          ...(unitId ? { student: { unitId } } : {}),
        },
      });

      const avgQuality = Number(recentQuality._avg.qualityScore || 0);
      if (avgQuality > 0 && avgQuality < 75) {
        alerts.push({
          id: `murojaah-quality-low-${Date.now()}`,
          title: 'Kualitas Murojaah Menurun',
          message: `Rata-rata kualitas murojaah 7 hari terakhir: ${avgQuality.toFixed(1)}. Perlu bimbingan tambahan.`,
          severity: avgQuality < 65 ? 'WARNING' : 'INFO',
          timestamp: new Date().toISOString(),
        });
      }

      // 4. Check for students without recent tahfidz activity
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const studentsWithRecentTahfidz = await prisma.tahfidzRecord.findMany({
        where: {
          recordedAt: { gte: sevenDaysAgo },
          ...(unitId ? { student: { unitId } } : {}),
        },
        select: { studentId: true },
        distinct: ['studentId'],
      });

      const totalActiveStudents = await prisma.student.count({
        where: { ...unitFilter, status: 'ACTIVE' },
      });

      const inactiveStudents = totalActiveStudents - studentsWithRecentTahfidz.length;
      const inactivityRate =
        totalActiveStudents > 0 ? (inactiveStudents / totalActiveStudents) * 100 : 0;

      if (inactivityRate > 30) {
        alerts.push({
          id: `tahfidz-inactive-${Date.now()}`,
          title: 'Banyak Santri Tidak Aktif Tahfidz',
          message: `${inactiveStudents} santri (${inactivityRate.toFixed(0)}%) belum ada aktivitas tahfidz dalam 7 hari terakhir.`,
          severity: inactivityRate > 50 ? 'WARNING' : 'INFO',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Error calculating alerts:', error);
    }

    return alerts;
  }

  /**
   * Get admissions statistics for dashboard
   */
  async getAdmissionsStats(context: DashboardServiceContext) {
    const unitFilter = context.unitId ? { admissionPeriod: { unitId: context.unitId } } : {};

    const [totalRegistrants, statusCounts, activePeriods, recentRegistrants] = await Promise.all([
      prisma.registrant.count({ where: unitFilter }),
      prisma.registrant.groupBy({
        by: ['status'],
        where: unitFilter,
        _count: { status: true },
      }),
      prisma.admissionPeriod.count({
        where: {
          ...(context.unitId && { unitId: context.unitId }),
          isActive: true,
        },
      }),
      prisma.registrant.findMany({
        where: unitFilter,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          fullName: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const byStatus = statusCounts.reduce(
      (acc, curr) => ({
        ...acc,
        [curr.status]: curr._count.status,
      }),
      {} as Record<string, number>
    );

    return {
      totalRegistrants,
      byStatus,
      activePeriods,
      recentRegistrants: recentRegistrants.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Get CBT summary statistics for dashboard
   */
  async getCBTSummary(context: DashboardServiceContext) {
    const unitFilter = context.unitId ? { unitId: context.unitId } : {};

    const [totalExams, activeExams, totalAttempts, avgScoreResult] = await Promise.all([
      prisma.exam.count({ where: unitFilter }),
      prisma.exam.count({
        where: {
          ...unitFilter,
          status: 'PUBLISHED',
          scheduledAt: { lte: new Date() },
        },
      }),
      prisma.examAttempt.count({
        where: { exam: unitFilter },
      }),
      prisma.examAttempt.aggregate({
        where: { exam: unitFilter },
        _avg: { score: true },
      }),
    ]);

    return {
      totalExams,
      activeExams,
      totalAttempts,
      avgScore: Number(avgScoreResult._avg.score || 0),
    };
  }

  /**
   * Get today's attendance count
   */
  private async getTodayAttendanceCount(unitId?: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.attendance.count({
      where: {
        date: { gte: today },
        status: 'PRESENT',
        ...(unitId ? { student: { unitId } } : {}),
      },
    });
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
