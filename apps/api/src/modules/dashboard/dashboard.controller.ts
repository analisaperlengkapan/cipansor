/**
 * Dashboard Controller
 * Handles REST API endpoints for dashboard data
 */

import { Request, Response } from 'express';
import { logger } from '@/lib/logger';
import { getCurrentDashboardMetrics } from '@/lib/realtime';
import { prisma } from '@/lib/prisma';
import type { DashboardMetrics, DashboardAlert } from '@/lib/realtime';
import {
    DashboardStats,
    AttendanceStats,
    FinanceStats,
    TahfidzStats
} from '@cipansor/shared';

/**
 * Get current dashboard metrics with recent history and active alerts
 * @route GET /api/dashboard/metrics
 */
export async function getDashboardMetrics(req: Request, res: Response): Promise<void> {
    try {
        const { unitId } = req.query;
        const userId = (req as any).user?.id;

        // Verify access if unitId is provided
        if (unitId && typeof unitId === 'string') {
            const user = (req as any).user;
            const hasAccess = user?.unitId === unitId || user?.role === 'SUPER_ADMIN';

            if (!hasAccess) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have access to this unit'
                    }
                });
                return;
            }
        }

        // Get current metrics
        const current = await getCurrentDashboardMetrics(
            typeof unitId === 'string' ? unitId : undefined
        );

        // Get recent metrics history (last 12 data points - 12 minutes)
        const recent = await getRecentMetricsHistory(
            typeof unitId === 'string' ? unitId : undefined
        );

        // Get active alerts
        const alerts = await getActiveAlerts(
            typeof unitId === 'string' ? unitId : undefined
        );

        logger.info('Dashboard metrics retrieved', {
            userId,
            unitId: unitId || 'all',
            alertCount: alerts.length
        });

        res.json({
            success: true,
            data: {
                current,
                recent,
                alerts
            }
        });
    } catch (error) {
        logger.error('Error getting dashboard metrics:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve dashboard metrics'
            }
        });
    }
}

/**
 * Get dashboard quick stats (simplified metrics for cards)
 * @route GET /api/dashboard/quick-stats
 */
export async function getQuickStats(req: Request, res: Response): Promise<void> {
    try {
        const { unitId } = req.query;
        const unitFilter = typeof unitId === 'string' ? { unitId } : {};

        // Get quick stats in parallel
        const [
            totalStudents,
            activeStudents,
            totalTeachers,
            todayAttendance
        ] = await Promise.all([
            prisma.student.count({ where: unitFilter }),
            prisma.student.count({ where: { ...unitFilter, status: 'ACTIVE' } }),
            prisma.teacher.count({ where: unitFilter }),
            getTodayAttendanceCount(typeof unitId === 'string' ? unitId : undefined)
        ]);

        const attendanceRate = activeStudents > 0
            ? Math.round((todayAttendance / activeStudents) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                totalStudents,
                activeStudents,
                totalTeachers,
                todayAttendance,
                attendanceRate
            }
        });
    } catch (error) {
        logger.error('Error getting quick stats:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve quick stats'
            }
        });
    }
}

/**
 * Get dashboard main stats
 * @route GET /api/dashboard/stats
 */
export async function getStats(req: Request, res: Response): Promise<void> {
    try {
        const { unitId } = req.query;
        const unitFilter = typeof unitId === 'string' ? { unitId } : {};

        // Calculate date for last month
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
            activeAcademicYear
        ] = await Promise.all([
            prisma.student.count({ where: unitFilter }),
            prisma.student.count({ where: { ...unitFilter, status: 'ACTIVE' } }),
            prisma.student.count({
                where: {
                    ...unitFilter,
                    status: 'ACTIVE',
                    createdAt: { lte: lastMonth }
                }
            }),
            prisma.teacher.count({ where: unitFilter }),
            prisma.class.count({ where: unitFilter }),
            prisma.unit.count({ where: typeof unitId === 'string' ? { id: unitId } : {} }),
            getTodayAttendanceCount(typeof unitId === 'string' ? unitId : undefined),
            prisma.academicYear.findFirst({ where: { status: 'ACTIVE' } as any })
        ]);

        // Calculate growth
        let studentsGrowth = 0;
        if (lastMonthStudents > 0) {
            studentsGrowth = Math.round(((activeStudents - lastMonthStudents) / lastMonthStudents) * 100);
        }

        const attendanceRate = activeStudents > 0
            ? Math.round((todayAttendance / activeStudents) * 100)
            : 0;

        const data: DashboardStats = {
            totalStudents,
            totalTeachers,
            totalClasses,
            totalUnits,
            studentsGrowth,
            attendanceRate,
            activeAcademicYear: activeAcademicYear ? {
                id: activeAcademicYear.id,
                name: activeAcademicYear.name,
                startDate: activeAcademicYear.startDate.toISOString(),
                endDate: activeAcademicYear.endDate.toISOString()
            } : undefined
        };

        res.json({
            success: true,
            data
        });
    } catch (error) {
        logger.error('Error getting dashboard stats:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve dashboard stats'
            }
        });
    }
}

/**
 * Get attendance stats
 * @route GET /api/dashboard/attendance
 */
export async function getAttendanceStats(req: Request, res: Response): Promise<void> {
    try {
        const { unitId, startDate, endDate } = req.query;

        // Default to last 7 days if not specified
        const end = endDate ? new Date(String(endDate)) : new Date();
        const start = startDate ? new Date(String(startDate)) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end
                },
                ...(unitId ? { student: { unitId: String(unitId) } } : {})
            },
            select: {
                date: true,
                status: true
            }
        });

        const statsMap = new Map<string, AttendanceStats>();

        attendanceRecords.forEach(record => {
            const dateStr = record.date.toISOString().split('T')[0];
            if (!statsMap.has(dateStr)) {
                statsMap.set(dateStr, {
                    date: dateStr,
                    present: 0,
                    absent: 0,
                    sick: 0,
                    excused: 0
                });
            }

            const stats = statsMap.get(dateStr)!;
            if (record.status === 'PRESENT') stats.present++;
            else if (record.status === 'ABSENT') stats.absent++;
            else if (record.status === 'SICK') stats.sick++;
            else if (record.status === 'EXCUSED') stats.excused++;
        });

        const data: AttendanceStats[] = Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        res.json({
            success: true,
            data
        });
    } catch (error) {
        logger.error('Error getting attendance stats:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve attendance stats'
            }
        });
    }
}

/**
 * Get finance stats
 * @route GET /api/dashboard/finance
 */
export async function getFinanceStats(req: Request, res: Response): Promise<void> {
    try {
        const { unitId } = req.query;
        const unitFilter = typeof unitId === 'string' ? { student: { unitId } } : {};

        const [totalBilled, totalPaid, totalUnpaid] = await Promise.all([
             prisma.invoice.aggregate({
                where: { ...unitFilter },
                _sum: { amount: true }
             }),
             prisma.invoice.aggregate({
                where: { ...unitFilter, status: 'PAID' },
                _sum: { amount: true }
             }),
             prisma.invoice.aggregate({
                where: { ...unitFilter, status: { not: 'PAID' } },
                _sum: { amount: true }
             })
        ]);

        // Get recent payments
        const recentPaymentsRaw = await prisma.payment.findMany({
            where: {
                invoice: { ...unitFilter }
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                invoice: {
                    include: {
                        student: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });

        const recentPayments = recentPaymentsRaw.map(p => ({
            id: p.id,
            studentName: p.invoice.student.user.name,
            amount: Number(p.amount),
            date: p.createdAt.toISOString()
        }));

        const data: FinanceStats = {
            totalBilled: Number(totalBilled._sum.amount || 0),
            totalPaid: Number(totalPaid._sum.amount || 0),
            totalUnpaid: Number(totalUnpaid._sum.amount || 0),
            recentPayments
        };

        res.json({
            success: true,
            data
        });
    } catch (error) {
        logger.error('Error getting finance stats:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve finance stats'
            }
        });
    }
}

/**
 * Get tahfidz stats
 * @route GET /api/dashboard/tahfidz
 */
export async function getTahfidzStats(req: Request, res: Response): Promise<void> {
    try {
        const { unitId } = req.query;
        // Logic specific to Tahfidz module
        // This is a simplified implementation

        // Mock data for now as Tahfidz schema might be complex
        const data: TahfidzStats = {
            totalMemorized: 0,
            averageJuz: 0,
            topStudents: [],
            monthlyProgress: []
        };

        res.json({
            success: true,
            data
        });
    } catch (error) {
        logger.error('Error getting tahfidz stats:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve tahfidz stats'
            }
        });
    }
}


/**
 * Get recent metrics history
 * Returns last N metrics snapshots
 */
async function getRecentMetricsHistory(unitId?: string): Promise<DashboardMetrics[]> {
    try {
        const history = await prisma.dashboardHistory.findMany({
            where: {
                unitId: unitId || null
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 12 // Last 12 points (12 minutes)
        });

        // If no history, return current state
        if (history.length === 0) {
            const current = await getCurrentDashboardMetrics(unitId);
            return [current];
        }

        // Map back to DashboardMetrics
        return history.map(h => {
            const metrics = h.metrics as unknown as DashboardMetrics;
            return metrics;
        }).reverse(); // Return in chronological order
    } catch (error) {
        logger.error('Error fetching metrics history:', error);
        // Fallback to current
        const current = await getCurrentDashboardMetrics(unitId);
        return [current];
    }
}

/**
 * Get active dashboard alerts
 */
async function getActiveAlerts(unitId?: string): Promise<DashboardAlert[]> {
    const alerts: DashboardAlert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        // Build unit filter
        const unitFilter = unitId ? { unitId } : {};

        // Check attendance rate
        const activeStudents = await prisma.student.count({
            where: { ...unitFilter, status: 'ACTIVE' }
        });

        const todayPresent = await prisma.attendance.count({
            where: {
                date: { gte: today },
                status: 'PRESENT',
                ...(unitId ? { student: { unitId } } : {})
            }
        });

        const attendanceRate = activeStudents > 0
            ? (todayPresent / activeStudents) * 100
            : 0;

        if (attendanceRate < 80 && attendanceRate > 0) {
            alerts.push({
                id: `attendance-low-${Date.now()}`,
                title: 'Tingkat Kehadiran Rendah',
                message: `Tingkat kehadiran hari ini: ${attendanceRate.toFixed(1)}%. Perlu perhatian khusus.`,
                severity: attendanceRate < 70 ? 'CRITICAL' : 'WARNING',
                timestamp: new Date().toISOString()
            });
        }

        // Check for overdue invoices (last 30 days)
        const overdueInvoices = await prisma.invoice.count({
            where: {
                status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
                dueDate: { lt: new Date() },
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                ...(unitId ? { student: { unitId } } : {})
            }
        });

        if (overdueInvoices > 0) {
            alerts.push({
                id: `invoices-overdue-${Date.now()}`,
                title: 'Tagihan Terlambat',
                message: `${overdueInvoices} tagihan melewati batas waktu pembayaran.`,
                severity: overdueInvoices > 10 ? 'WARNING' : 'INFO',
                timestamp: new Date().toISOString()
            });
        }

        // Check for low murojaah quality (avg < 75 in last 7 days)
        const recentQuality = await prisma.murojaahRecord.aggregate({
            _avg: { qualityScore: true },
            where: {
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                ...(unitId ? { student: { unitId } } : {})
            }
        });

        const avgQuality = Number(recentQuality._avg.qualityScore || 0);
        if (avgQuality > 0 && avgQuality < 75) {
            alerts.push({
                id: `murojaah-quality-low-${Date.now()}`,
                title: 'Kualitas Murojaah Menurun',
                message: `Rata-rata kualitas murojaah 7 hari terakhir: ${avgQuality.toFixed(1)}. Perlu bimbingan tambahan.`,
                severity: avgQuality < 65 ? 'WARNING' : 'INFO',
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        logger.error('Error calculating alerts:', error);
    }

    return alerts;
}

/**
 * Get today's attendance count
 */
async function getTodayAttendanceCount(unitId?: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.attendance.count({
        where: {
            date: { gte: today },
            status: 'PRESENT',
            ...(unitId ? { student: { unitId } } : {})
        }
    });
}
