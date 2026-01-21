/**
 * Dashboard Module
 * Exports all dashboard-related components
 */

// Service
export { DashboardService, dashboardService } from './dashboard.service';

// Controller Functions
export {
  getDashboardMetrics,
  getQuickStats,
  getStats,
  getAttendanceStats,
  getFinanceStats,
  getTahfidzStats,
  getViolationRewardStats,
} from './dashboard.controller';

// Schemas
export {
  dashboardStatsQuerySchema,
  dashboardMetricsQuerySchema,
  attendanceStatsQuerySchema,
  financeStatsQuerySchema,
  tahfidzStatsQuerySchema,
  violationRewardStatsQuerySchema,
  quickStatsQuerySchema,
  acknowledgeAlertSchema,
  widgetConfigQuerySchema,
  updateWidgetConfigSchema,
} from './dashboard.schema';

// Schema Types
export type {
  DashboardStatsQuery,
  DashboardMetricsQuery,
  AttendanceStatsQuery,
  FinanceStatsQuery,
  TahfidzStatsQuery,
  ViolationRewardStatsQuery,
  QuickStatsQuery,
  AcknowledgeAlertParams,
  WidgetConfigQuery,
  UpdateWidgetConfigBody,
} from './dashboard.schema';

// Service Types
export type { DashboardServiceContext, DateRangeParams, PeriodParams } from './dashboard.service';

// Routes (default export for app.ts compatibility)
export { default as dashboardRoutes } from './dashboard.routes';
