/**
 * Dashboard Controller
 * Handles REST API endpoints for dashboard data
 */

import { Request, Response } from 'express';
import { logger } from '@/lib/logger';
import { getCurrentDashboardMetrics } from '@/lib/realtime';
import { prisma } from '@/lib/prisma';
import type { DashboardMetrics, DashboardAlert } from '@/lib/realtime';

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
 * Get recent metrics history
 * Returns last N metrics snapshots
 */
async function getRecentMetricsHistory(unitId?: string): Promise<DashboardMetrics[]> {
    // In a production system, this would query a metrics history table
    // For now, return current metrics as a single point
    // TODO: Implement metrics history storage
    const current = await getCurrentDashboardMetrics(unitId);
    return [current];
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
