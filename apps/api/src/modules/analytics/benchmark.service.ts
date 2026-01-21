/**
 * Benchmark Analytics Service
 * Provides comparative analytics between units for performance benchmarking
 */

import { prisma } from '@/lib/prisma';
import { Prisma, AttendanceStatus } from '@prisma/client';

interface UnitMetrics {
  unitId: string;
  unitName: string;
  unitType: string;
  studentCount: number;
  attendanceRate: number;
  paymentCollectionRate: number;
  tahfidzProgress: number;
  academicAverage: number;
}

interface RankingResult {
  unitId: string;
  unitName: string;
  metric: string;
  value: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

interface ComparisonResult {
  units: UnitMetrics[];
  averages: {
    attendanceRate: number;
    paymentCollectionRate: number;
    tahfidzProgress: number;
    academicAverage: number;
  };
  period: {
    start: string;
    end: string;
  };
}

/**
 * Compare performance metrics across all units
 */
export async function compareUnitsPerformance(options?: {
  unitIds?: string[];
  startDate?: Date;
  endDate?: Date;
  prefetchedUnits?: { id: string; name: string; type: string }[];
}): Promise<ComparisonResult> {
  const startDate = options?.startDate || new Date(new Date().setMonth(new Date().getMonth() - 1));
  const endDate = options?.endDate || new Date();

  // Get all units or filtered units, unless prefetched
  let units = options?.prefetchedUnits;
  if (!units) {
    units = (await prisma.unit.findMany({
      where: options?.unitIds ? { id: { in: options.unitIds } } : undefined,
      select: { id: true, name: true, type: true } as any, // Cast as any if type mismatch occurs due to missing fields in select vs return type
    })) as any;
  }

  if (!units || units.length === 0) {
    return {
      units: [],
      averages: {
        attendanceRate: 0,
        paymentCollectionRate: 0,
        tahfidzProgress: 0,
        academicAverage: 0,
      },
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  }

  const unitIds = units.map((u) => u.id);

  // 1. Get student counts per unit (direct aggregation)
  const studentCounts = await prisma.student.groupBy({
    by: ['unitId'],
    where: {
      unitId: { in: unitIds },
      deletedAt: null,
      status: 'active',
    },
    _count: { _all: true },
  });

  // 2. Fetch all students to map studentId -> unitId for related table aggregations
  // We need this because Attendance, Invoice, etc. don't have unitId column
  const students = await prisma.student.findMany({
    where: {
      unitId: { in: unitIds },
      deletedAt: null,
      status: 'active',
    },
    select: { id: true, unitId: true },
  });

  const studentIds = students.map((s) => s.id);
  const studentUnitMap = new Map<string, string>(); // studentId -> unitId
  students.forEach((s) => studentUnitMap.set(s.id, s.unitId));

  // 3. Bulk queries for related data grouped by studentId
  const [attendanceData, invoiceData, tahfidzData, gradeData] = await Promise.all([
    // Attendance data per student and status
    prisma.attendance.groupBy({
      by: ['studentId', 'status'],
      where: {
        studentId: { in: studentIds },
        date: { gte: startDate, lte: endDate },
      },
      _count: true,
    }),
    // Payment data per student
    prisma.invoice.groupBy({
      by: ['studentId'],
      where: {
        studentId: { in: studentIds },
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true, paidAmount: true },
    }),
    // Tahfidz data per student
    prisma.tahfidzRecord.groupBy({
      by: ['studentId'],
      where: {
        studentId: { in: studentIds },
        recordedAt: { gte: startDate, lte: endDate },
      },
      _sum: { totalAyah: true },
    }),
    // Grade data per student
    prisma.grade.groupBy({
      by: ['studentId'],
      where: {
        studentId: { in: studentIds },
        createdAt: { gte: startDate, lte: endDate },
      },
      _avg: { score: true },
    }),
  ]);

  // 4. Aggregate student-level data into unit-level metrics in memory

  // Maps to store unit aggregated data
  const studentCountMap = new Map<string, number>();
  studentCounts.forEach((item) => {
    studentCountMap.set(item.unitId, item._count._all);
  });

  const attendanceMap = new Map<string, { total: number; present: number }>();
  attendanceData.forEach((item) => {
    const unitId = studentUnitMap.get(item.studentId);
    if (unitId) {
      const current = attendanceMap.get(unitId) || { total: 0, present: 0 };
      current.total += item._count;
      if (item.status === AttendanceStatus.PRESENT) {
        current.present += item._count;
      }
      attendanceMap.set(unitId, current);
    }
  });

  const invoiceMap = new Map<string, { totalAmount: number; paidAmount: number }>();
  invoiceData.forEach((item) => {
    const unitId = studentUnitMap.get(item.studentId);
    if (unitId) {
      const current = invoiceMap.get(unitId) || { totalAmount: 0, paidAmount: 0 };
      current.totalAmount += Number(item._sum.amount || 0);
      current.paidAmount += Number(item._sum.paidAmount || 0);
      invoiceMap.set(unitId, current);
    }
  });

  const tahfidzMap = new Map<string, number>();
  tahfidzData.forEach((item) => {
    const unitId = studentUnitMap.get(item.studentId);
    if (unitId) {
      const current = tahfidzMap.get(unitId) || 0;
      tahfidzMap.set(unitId, current + Number(item._sum.totalAyah || 0));
    }
  });

  // Grade is average. We need weighted average or sum/count.
  // groupBy student gives avg score per student.
  // To get unit avg, we can avg the student avgs (approximation) or sum them and divide by student count.
  // Averaging student averages is acceptable for "Average Grade".
  const gradeSumMap = new Map<string, { sum: number; count: number }>();
  gradeData.forEach((item) => {
    const unitId = studentUnitMap.get(item.studentId);
    if (unitId) {
      const current = gradeSumMap.get(unitId) || { sum: 0, count: 0 };
      if (item._avg.score !== null) {
        current.sum += Number(item._avg.score);
        current.count += 1;
      }
      gradeSumMap.set(unitId, current);
    }
  });

  const unitMetrics: UnitMetrics[] = [];

  for (const unit of units) {
    const studentCount = studentCountMap.get(unit.id) || 0;

    const attendance = attendanceMap.get(unit.id) || { total: 0, present: 0 };
    const attendanceRate = attendance.total > 0 ? (attendance.present / attendance.total) * 100 : 0;

    const invoice = invoiceMap.get(unit.id) || { totalAmount: 0, paidAmount: 0 };
    const paymentCollectionRate =
      invoice.totalAmount > 0 ? (invoice.paidAmount / invoice.totalAmount) * 100 : 0;

    const totalAyah = tahfidzMap.get(unit.id) || 0;
    const tahfidzProgress = studentCount > 0 ? totalAyah / studentCount : 0;

    const gradeInfo = gradeSumMap.get(unit.id) || { sum: 0, count: 0 };
    const academicAverage = gradeInfo.count > 0 ? gradeInfo.sum / gradeInfo.count : 0;

    unitMetrics.push({
      unitId: unit.id,
      unitName: unit.name,
      unitType: unit.type,
      studentCount,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      paymentCollectionRate: Math.round(paymentCollectionRate * 100) / 100,
      tahfidzProgress: Math.round(tahfidzProgress * 100) / 100,
      academicAverage: Math.round(academicAverage * 100) / 100,
    });
  }

  // Calculate averages
  const avgAttendance =
    unitMetrics.reduce((sum, u) => sum + u.attendanceRate, 0) / unitMetrics.length || 0;
  const avgPayment =
    unitMetrics.reduce((sum, u) => sum + u.paymentCollectionRate, 0) / unitMetrics.length || 0;
  const avgTahfidz =
    unitMetrics.reduce((sum, u) => sum + u.tahfidzProgress, 0) / unitMetrics.length || 0;
  const avgAcademic =
    unitMetrics.reduce((sum, u) => sum + u.academicAverage, 0) / unitMetrics.length || 0;

  return {
    units: unitMetrics,
    averages: {
      attendanceRate: Math.round(avgAttendance * 100) / 100,
      paymentCollectionRate: Math.round(avgPayment * 100) / 100,
      tahfidzProgress: Math.round(avgTahfidz * 100) / 100,
      academicAverage: Math.round(avgAcademic * 100) / 100,
    },
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
  };
}

/**
 * Get unit rankings by various KPIs
 */
export async function getUnitRankings(
  metric: 'attendance' | 'payment' | 'tahfidz' | 'academic' | 'all' = 'all'
): Promise<RankingResult[]> {
  // Determine current period
  const currentEnd = new Date();
  const currentStart = new Date(new Date().setMonth(new Date().getMonth() - 1));

  // Calculate previous period dates
  const duration = currentEnd.getTime() - currentStart.getTime();
  const previousEnd = new Date(currentStart);
  const previousStart = new Date(previousEnd.getTime() - duration);

  // Fetch units once to avoid redundant DB calls
  const units = await prisma.unit.findMany({
    select: { id: true, name: true, type: true },
  });

  // Map units to match the expected structure for internal use
  const mappedUnits = units.map((u) => ({ id: u.id, name: u.name, type: u.type }));

  // Execute current and previous comparisons in parallel
  const [comparison, previousComparison] = await Promise.all([
    compareUnitsPerformance({
      startDate: currentStart,
      endDate: currentEnd,
      prefetchedUnits: mappedUnits,
    }),
    compareUnitsPerformance({
      startDate: previousStart,
      endDate: previousEnd,
      prefetchedUnits: mappedUnits,
    }),
  ]);

  // Create a map for faster lookup of previous unit data
  const previousUnitMap = new Map<string, UnitMetrics>();
  previousComparison.units.forEach((unit) => {
    previousUnitMap.set(unit.unitId, unit);
  });

  const rankings: RankingResult[] = [];

  const metricsToRank =
    metric === 'all' ? ['attendance', 'payment', 'tahfidz', 'academic'] : [metric];

  for (const m of metricsToRank) {
    const sorted = [...comparison.units].sort((a, b) => {
      switch (m) {
        case 'attendance':
          return b.attendanceRate - a.attendanceRate;
        case 'payment':
          return b.paymentCollectionRate - a.paymentCollectionRate;
        case 'tahfidz':
          return b.tahfidzProgress - a.tahfidzProgress;
        case 'academic':
          return b.academicAverage - a.academicAverage;
        default:
          return 0;
      }
    });

    sorted.forEach((unit, index) => {
      let value: number;
      let previousValue: number = 0;
      const previousUnit = previousUnitMap.get(unit.unitId);

      switch (m) {
        case 'attendance':
          value = unit.attendanceRate;
          previousValue = previousUnit?.attendanceRate || 0;
          break;
        case 'payment':
          value = unit.paymentCollectionRate;
          previousValue = previousUnit?.paymentCollectionRate || 0;
          break;
        case 'tahfidz':
          value = unit.tahfidzProgress;
          previousValue = previousUnit?.tahfidzProgress || 0;
          break;
        case 'academic':
          value = unit.academicAverage;
          previousValue = previousUnit?.academicAverage || 0;
          break;
        default:
          value = 0;
          previousValue = 0;
      }

      let trend: 'up' | 'down' | 'stable' = 'stable';

      if (value > previousValue) {
        trend = 'up';
      } else if (value < previousValue) {
        trend = 'down';
      }

      rankings.push({
        unitId: unit.unitId,
        unitName: unit.unitName,
        metric: m,
        value,
        rank: index + 1,
        trend,
      });
    });
  }

  return rankings;
}

/**
 * Year-over-year comparison for a unit
 */
export async function getYearOverYearComparison(unitId: string): Promise<{
  currentYear: UnitMetrics;
  previousYear: UnitMetrics;
  changes: {
    attendanceRate: number;
    paymentCollectionRate: number;
    tahfidzProgress: number;
    academicAverage: number;
  };
}> {
  const now = new Date();
  const currentYearStart = new Date(now.getFullYear(), 0, 1);
  const previousYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const previousYearEnd = new Date(now.getFullYear() - 1, 11, 31);

  const currentData = await compareUnitsPerformance({
    unitIds: [unitId],
    startDate: currentYearStart,
    endDate: now,
  });

  const previousData = await compareUnitsPerformance({
    unitIds: [unitId],
    startDate: previousYearStart,
    endDate: previousYearEnd,
  });

  const current = currentData.units[0] || {
    unitId,
    unitName: '',
    unitType: '',
    studentCount: 0,
    attendanceRate: 0,
    paymentCollectionRate: 0,
    tahfidzProgress: 0,
    academicAverage: 0,
  };

  const previous = previousData.units[0] || {
    unitId,
    unitName: '',
    unitType: '',
    studentCount: 0,
    attendanceRate: 0,
    paymentCollectionRate: 0,
    tahfidzProgress: 0,
    academicAverage: 0,
  };

  return {
    currentYear: current,
    previousYear: previous,
    changes: {
      attendanceRate: current.attendanceRate - previous.attendanceRate,
      paymentCollectionRate: current.paymentCollectionRate - previous.paymentCollectionRate,
      tahfidzProgress: current.tahfidzProgress - previous.tahfidzProgress,
      academicAverage: current.academicAverage - previous.academicAverage,
    },
  };
}

/**
 * Get benchmark summary for dashboard
 */
export async function getBenchmarkSummary(): Promise<{
  topPerformers: Array<{ metric: string; unitName: string; value: number }>;
  overallAverages: ComparisonResult['averages'];
  unitCount: number;
}> {
  const rankings = await getUnitRankings('all');
  const comparison = await compareUnitsPerformance();

  const topPerformers = ['attendance', 'payment', 'tahfidz', 'academic'].map((metric) => {
    const top = rankings.find((r) => r.metric === metric && r.rank === 1);
    return {
      metric,
      unitName: top?.unitName || '-',
      value: top?.value || 0,
    };
  });

  return {
    topPerformers,
    overallAverages: comparison.averages,
    unitCount: comparison.units.length,
  };
}
