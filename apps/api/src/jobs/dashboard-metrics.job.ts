/**
 * Dashboard Metrics Aggregation Job
 * Runs every minute to calculate and publish dashboard metrics
 */

import { logger } from '@/lib/logger';
import {
  getCurrentDashboardMetrics,
  publishDashboardMetrics,
  publishDashboardAlert,
  DashboardAlert,
} from '@/lib/realtime';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Aggregate and publish dashboard metrics
 * Calculates both global and unit-specific metrics
 */
export async function aggregateDashboardMetrics(): Promise<void> {
  try {
    logger.info('Starting dashboard metrics aggregation...');

    // Get global metrics
    const globalMetrics = await getCurrentDashboardMetrics();
    await publishDashboardMetrics(globalMetrics);

    // Save global history
    try {
      await prisma.dashboardHistory.create({
        data: {
          metrics: globalMetrics as unknown as Prisma.InputJsonValue,
          unitId: null,
        },
      });
    } catch (histError) {
      logger.error('Error saving global metrics history:', histError);
    }

    // Get all active units
    const units = await prisma.unit.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    });

    // Calculate and publish metrics for each unit
    for (const unit of units) {
      try {
        const unitMetrics = await getCurrentDashboardMetrics(unit.id);
        await publishDashboardMetrics(unitMetrics, unit.id);

        // Save unit history
        await prisma.dashboardHistory.create({
          data: {
            metrics: unitMetrics as unknown as Prisma.InputJsonValue,
            unitId: unit.id,
          },
        });

        logger.debug('Unit metrics published', {
          unitId: unit.id,
          unitName: unit.name,
        });
      } catch (error) {
        logger.error('Error calculating unit metrics', {
          unitId: unit.id,
          error,
        });
      }
    }

    // Check for alerts
    await checkAndPublishAlerts();

    logger.info('Dashboard metrics aggregated and published successfully', {
      globalMetrics: true,
      unitCount: units.length,
    });
  } catch (error) {
    logger.error('Error aggregating dashboard metrics:', error);
  }
}

/**
 * Check for alert conditions and publish alerts
 */
async function checkAndPublishAlerts(): Promise<void> {
  try {
    // Check attendance rate
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalActiveStudents = await prisma.student.count({
      where: { status: 'ACTIVE' },
    });

    const todayPresent = await prisma.attendance.count({
      where: {
        date: { gte: today },
        status: 'PRESENT',
      },
    });

    const attendanceRate = totalActiveStudents > 0 ? (todayPresent / totalActiveStudents) * 100 : 0;

    // Alert if attendance rate is below 80%
    if (attendanceRate < 80 && attendanceRate > 0) {
      const alert: DashboardAlert = {
        id: `attendance-low-${Date.now()}`,
        title: 'Tingkat Kehadiran Rendah',
        message: `Tingkat kehadiran hari ini: ${attendanceRate.toFixed(1)}%. Perlu perhatian khusus.`,
        severity: attendanceRate < 70 ? 'CRITICAL' : 'WARNING',
        timestamp: new Date().toISOString(),
      };
      await publishDashboardAlert(alert);
    }

    // Check for units with low attendance
    const units = await prisma.unit.findMany({
      where: { deletedAt: null },
    });

    for (const unit of units) {
      const unitActiveStudents = await prisma.student.count({
        where: {
          unitId: unit.id,
          status: 'ACTIVE',
        },
      });

      const unitPresent = await prisma.attendance.count({
        where: {
          date: { gte: today },
          status: 'PRESENT',
          student: {
            unitId: unit.id,
          },
        },
      });

      const unitAttendanceRate =
        unitActiveStudents > 0 ? (unitPresent / unitActiveStudents) * 100 : 0;

      if (unitAttendanceRate < 75 && unitAttendanceRate > 0) {
        const alert: DashboardAlert = {
          id: `unit-attendance-${unit.id}-${Date.now()}`,
          title: `Kehadiran ${unit.name} Rendah`,
          message: `Tingkat kehadiran di ${unit.name}: ${unitAttendanceRate.toFixed(1)}%`,
          severity: unitAttendanceRate < 65 ? 'CRITICAL' : 'WARNING',
          timestamp: new Date().toISOString(),
          unitId: unit.id,
          unitName: unit.name,
        };
        await publishDashboardAlert(alert);
      }
    }

    // Check for students with low murojaah quality
    const lowQualityCount = await prisma.murojaahRecord.count({
      where: {
        qualityScore: { lt: 50 }, // Less than 50 (Poor quality)
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      },
    });

    if (lowQualityCount > 10) {
      const alert: DashboardAlert = {
        id: `murojaah-quality-${Date.now()}`,
        title: 'Banyak Murojaah Berkualitas Rendah',
        message: `${lowQualityCount} catatan murojaah dengan kualitas rendah dalam 7 hari terakhir`,
        severity: 'INFO',
        timestamp: new Date().toISOString(),
      };
      await publishDashboardAlert(alert);
    }

    // Check for overdue invoices
    const overdueInvoices = await prisma.invoice.count({
      where: {
        status: 'PENDING',
        dueDate: { lt: new Date() },
      },
    });

    if (overdueInvoices > 50) {
      const alert: DashboardAlert = {
        id: `invoices-overdue-${Date.now()}`,
        title: 'Banyak Tagihan Terlambat',
        message: `${overdueInvoices} tagihan melewati jatuh tempo`,
        severity: overdueInvoices > 100 ? 'CRITICAL' : 'WARNING',
        timestamp: new Date().toISOString(),
      };
      await publishDashboardAlert(alert);
    }
  } catch (error) {
    logger.error('Error checking alerts:', error);
  }
}
