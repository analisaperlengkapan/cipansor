/**
 * Benchmark Analytics Service
 * Provides comparative analytics between units for performance benchmarking
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
}): Promise<ComparisonResult> {
    const startDate = options?.startDate || new Date(new Date().setMonth(new Date().getMonth() - 1));
    const endDate = options?.endDate || new Date();

    // Get all units or filtered units
    const units = await prisma.unit.findMany({
        where: options?.unitIds ? { id: { in: options.unitIds } } : undefined,
        select: { id: true, name: true, type: true },
    });

    const unitMetrics: UnitMetrics[] = [];

    for (const unit of units) {
        // Student count
        const studentCount = await prisma.student.count({
            where: { unitId: unit.id, deletedAt: null, status: 'active' },
        });

        // Attendance rate
        const attendanceData = await prisma.attendance.groupBy({
            by: ['status'],
            where: {
                student: { unitId: unit.id },
                date: { gte: startDate, lte: endDate },
            },
            _count: true,
        });

        const totalAttendance = attendanceData.reduce((sum, a) => sum + a._count, 0);
        const presentCount = attendanceData.find((a) => a.status === 'present')?._count || 0;
        const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

        // Payment collection rate
        const invoiceData = await prisma.invoice.aggregate({
            where: {
                student: { unitId: unit.id },
                createdAt: { gte: startDate, lte: endDate },
            },
            _sum: { amount: true, paidAmount: true },
        });

        const totalAmount = Number(invoiceData._sum.amount || 0);
        const paidAmount = Number(invoiceData._sum.paidAmount || 0);
        const paymentCollectionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

        // Tahfidz progress (average ayah per student per month)
        const tahfidzData = await prisma.tahfidzRecord.aggregate({
            where: {
                student: { unitId: unit.id },
                recordedAt: { gte: startDate, lte: endDate },
            },
            _sum: { totalAyah: true },
            _count: true,
        });

        const tahfidzProgress =
            studentCount > 0 ? (Number(tahfidzData._sum.totalAyah || 0) / studentCount) : 0;

        // Academic average (from grades)
        const gradeData = await prisma.grade.aggregate({
            where: {
                student: { unitId: unit.id },
                createdAt: { gte: startDate, lte: endDate },
            },
            _avg: { score: true },
        });

        const academicAverage = Number(gradeData._avg.score || 0);

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
export async function getUnitRankings(metric: 'attendance' | 'payment' | 'tahfidz' | 'academic' | 'all' = 'all'): Promise<RankingResult[]> {
    const comparison = await compareUnitsPerformance();
    const rankings: RankingResult[] = [];

    const metricsToRank = metric === 'all'
        ? ['attendance', 'payment', 'tahfidz', 'academic']
        : [metric];

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
            switch (m) {
                case 'attendance':
                    value = unit.attendanceRate;
                    break;
                case 'payment':
                    value = unit.paymentCollectionRate;
                    break;
                case 'tahfidz':
                    value = unit.tahfidzProgress;
                    break;
                case 'academic':
                    value = unit.academicAverage;
                    break;
                default:
                    value = 0;
            }

            rankings.push({
                unitId: unit.unitId,
                unitName: unit.unitName,
                metric: m,
                value,
                rank: index + 1,
                trend: 'stable', // TODO: Compare with previous period
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
