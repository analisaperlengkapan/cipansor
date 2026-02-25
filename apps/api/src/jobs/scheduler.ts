import cron, { ScheduledTask } from 'node-cron';
import { logger } from '@/lib/logger';
import {
  createDailySnapshots,
  createWeeklySummary,
  cleanupOldSnapshots,
} from './dashboard-snapshot.job';
import { aggregateDashboardMetrics } from './dashboard-metrics.job';
import { runMonthlyAutoBilling } from './finance-billing.job';

/**
 * Scheduler Module
 * Manages all cron jobs for the application
 */

// Track scheduled tasks
const scheduledTasks: ScheduledTask[] = [];

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduler(): void {
  logger.info('[Scheduler] Initializing scheduled jobs...');

  // Real-time dashboard metrics - Run every minute
  const metricsTask = cron.schedule(
    '* * * * *',
    async () => {
      logger.debug('[Scheduler] Running dashboard metrics job');
      try {
        await aggregateDashboardMetrics();
      } catch (error) {
        logger.error('[Scheduler] Dashboard metrics job failed:', error);
      }
    },
    {
      timezone: 'Asia/Jakarta',
    }
  );
  scheduledTasks.push(metricsTask);
  logger.info('[Scheduler] Dashboard metrics job scheduled (every minute)');

  // Daily metric snapshots - Run at 1:00 AM every day
  // Cron: minute hour day month dayOfWeek
  const dailySnapshotTask = cron.schedule(
    '0 1 * * *',
    async () => {
      logger.info('[Scheduler] Running daily snapshot job');
      try {
        await createDailySnapshots();
      } catch (error) {
        logger.error('[Scheduler] Daily snapshot job failed:', error);
      }
    },
    {
      timezone: 'Asia/Jakarta',
    }
  );
  scheduledTasks.push(dailySnapshotTask);
  logger.info('[Scheduler] Daily snapshot job scheduled at 01:00 WIB');

  // Weekly summary - Run at 2:00 AM every Sunday
  const weeklySummaryTask = cron.schedule(
    '0 2 * * 0',
    async () => {
      logger.info('[Scheduler] Running weekly summary job');
      try {
        await createWeeklySummary();
      } catch (error) {
        logger.error('[Scheduler] Weekly summary job failed:', error);
      }
    },
    {
      timezone: 'Asia/Jakarta',
    }
  );
  scheduledTasks.push(weeklySummaryTask);
  logger.info('[Scheduler] Weekly summary job scheduled at 02:00 WIB on Sundays');

  // Cleanup old snapshots - Run at 3:00 AM on the 1st of each month
  const cleanupTask = cron.schedule(
    '0 3 1 * *',
    async () => {
      logger.info('[Scheduler] Running cleanup job');
      try {
        await cleanupOldSnapshots();
      } catch (error) {
        logger.error('[Scheduler] Cleanup job failed:', error);
      }
    },
    {
      timezone: 'Asia/Jakarta',
    }
  );
  scheduledTasks.push(cleanupTask);
  logger.info('[Scheduler] Cleanup job scheduled at 03:00 WIB on the 1st of each month');

  // Auto-Billing - Run at 4:00 AM on the 1st of each month
  const autoBillingTask = cron.schedule(
    '0 4 1 * *',
    async () => {
      logger.info('[Scheduler] Running monthly auto-billing job');
      try {
        await runMonthlyAutoBilling();
      } catch (error) {
        logger.error('[Scheduler] Auto-billing job failed:', error);
      }
    },
    {
      timezone: 'Asia/Jakarta',
    }
  );
  scheduledTasks.push(autoBillingTask);
  logger.info('[Scheduler] Auto-billing job scheduled at 04:00 WIB on the 1st of each month');

  logger.info(`[Scheduler] ${scheduledTasks.length} jobs scheduled successfully`);
}

/**
 * Stop all scheduled jobs (for graceful shutdown)
 */
export function stopScheduler(): void {
  logger.info('[Scheduler] Stopping all scheduled jobs...');
  scheduledTasks.forEach((task) => task.stop());
  logger.info('[Scheduler] All jobs stopped');
}

/**
 * Run a specific job manually (for testing or manual trigger)
 */
export async function runJob(
  jobName: 'dashboard-metrics' | 'daily-snapshot' | 'weekly-summary' | 'cleanup' | 'auto-billing'
): Promise<void> {
  logger.info(`[Scheduler] Manually running job: ${jobName}`);

  switch (jobName) {
    case 'dashboard-metrics':
      await aggregateDashboardMetrics();
      break;
    case 'daily-snapshot':
      await createDailySnapshots();
      break;
    case 'weekly-summary':
      await createWeeklySummary();
      break;
    case 'cleanup':
      await cleanupOldSnapshots();
      break;
    case 'auto-billing':
      await runMonthlyAutoBilling();
      break;
    default:
      throw new Error(`Unknown job: ${jobName}`);
  }

  logger.info(`[Scheduler] Job ${jobName} completed`);
}
