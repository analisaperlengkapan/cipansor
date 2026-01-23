/**
 * Dashboard Validation Schemas
 * Zod schemas for request validation
 */

import { z } from 'zod';

/**
 * Query parameters for dashboard stats
 */
export const dashboardStatsQuerySchema = z.object({
  unitId: z.string().uuid().optional(),
});

export type DashboardStatsQuery = z.infer<typeof dashboardStatsQuerySchema>;

/**
 * Query parameters for dashboard metrics
 */
export const dashboardMetricsQuerySchema = z.object({
  unitId: z.string().uuid().optional(),
});

export type DashboardMetricsQuery = z.infer<typeof dashboardMetricsQuerySchema>;

/**
 * Query parameters for attendance stats
 */
export const attendanceStatsQuerySchema = z.object({
  unitId: z.string().uuid().optional(),
  startDate: z
    .string()
    .datetime()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z
    .string()
    .datetime()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export type AttendanceStatsQuery = z.infer<typeof attendanceStatsQuerySchema>;

/**
 * Query parameters for finance stats
 */
export const financeStatsQuerySchema = z.object({
  unitId: z.string().uuid().optional(),
  period: z.enum(['week', 'month', 'year']).optional(),
});

export type FinanceStatsQuery = z.infer<typeof financeStatsQuerySchema>;

/**
 * Query parameters for tahfidz stats
 */
export const tahfidzStatsQuerySchema = z.object({
  unitId: z.string().uuid().optional(),
  period: z.enum(['week', 'month', 'year']).optional(),
});

export type TahfidzStatsQuery = z.infer<typeof tahfidzStatsQuerySchema>;

/**
 * Query parameters for violation/reward stats
 */
export const violationRewardStatsQuerySchema = z.object({
  unitId: z.string().uuid().optional(),
  period: z.enum(['week', 'month', 'year']).optional(),
});

export type ViolationRewardStatsQuery = z.infer<typeof violationRewardStatsQuerySchema>;

/**
 * Query parameters for quick stats
 */
export const quickStatsQuerySchema = z.object({
  unitId: z.string().uuid().optional(),
});

export type QuickStatsQuery = z.infer<typeof quickStatsQuerySchema>;

/**
 * Parameters for alert acknowledgement
 */
export const acknowledgeAlertSchema = z.object({
  alertId: z.string().min(1, 'Alert ID is required'),
});

export type AcknowledgeAlertParams = z.infer<typeof acknowledgeAlertSchema>;

/**
 * Query for widget configuration
 */
export const widgetConfigQuerySchema = z.object({
  userId: z.string().uuid(),
});

export type WidgetConfigQuery = z.infer<typeof widgetConfigQuerySchema>;

/**
 * Body for widget configuration update
 */
export const updateWidgetConfigSchema = z.object({
  widgets: z.array(
    z.object({
      id: z.string(),
      type: z.enum([
        'stats',
        'attendance',
        'finance',
        'tahfidz',
        'violations',
        'rewards',
        'calendar',
        'notifications',
      ]),
      position: z.object({
        x: z.number().min(0),
        y: z.number().min(0),
        w: z.number().min(1),
        h: z.number().min(1),
      }),
      visible: z.boolean(),
    })
  ),
});

export type UpdateWidgetConfigBody = z.infer<typeof updateWidgetConfigSchema>;
