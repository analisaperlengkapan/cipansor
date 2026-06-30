/**
 * Dashboard Controller (Refactored)
 * Uses Dashboard Service for business logic
 * Follows layered architecture pattern
 */

import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { logger } from '@/lib/logger';
import { ApiError, ErrorCode } from '@/middleware/error';
import {
  dashboardStatsQuerySchema,
  dashboardMetricsQuerySchema,
  attendanceStatsQuerySchema,
  financeStatsQuerySchema,
  tahfidzStatsQuerySchema,
  violationRewardStatsQuerySchema,
} from './dashboard.schema';

/**
 * Helper to extract context from request
 */
function getContext(req: Request) {
  const user = (req as any).user;
  return {
    userId: user?.id,
    unitId: typeof (req.query as any).unitId === 'string' ? (req.query as any).unitId : undefined,
    role: user?.role,
  };
}

/**
 * Verify user has access to the requested unit
 */
function verifyUnitAccess(req: Request, unitId?: string): boolean {
  if (!unitId) return true;

  const user = (req as any).user;
  return user?.unitId === unitId || user?.role === 'SUPER_ADMIN';
}

/**
 * Get current dashboard metrics with recent history and active alerts
 * @route GET /api/dashboard/metrics
 */
export async function getDashboardMetrics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = dashboardMetricsQuerySchema.parse((req.query as any));

    if (!verifyUnitAccess(req, query.unitId)) {
      throw new ApiError(ErrorCode.FORBIDDEN, 'You do not have access to this unit');
    }

    const context = getContext(req);
    context.unitId = query.unitId;

    const result = await dashboardService.getMetrics(context);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get dashboard quick stats (simplified metrics for cards)
 * @route GET /api/dashboard/quick-stats
 */
export async function getQuickStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const context = getContext(req);
    const result = await dashboardService.getQuickStats(context);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get dashboard main stats
 * @route GET /api/dashboard/stats
 */
export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = dashboardStatsQuerySchema.parse((req.query as any));
    const context = getContext(req);
    context.unitId = query.unitId;

    const [mainStats, admissions, cbt] = await Promise.all([
      dashboardService.getStats(context),
      dashboardService.getAdmissionsStats(context),
      dashboardService.getCBTSummary(context),
    ]);

    const result = {
      ...mainStats,
      admissions,
      cbt,
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get attendance stats
 * @route GET /api/dashboard/attendance
 */
export async function getAttendanceStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = attendanceStatsQuerySchema.parse((req.query as any));
    const context = getContext(req);
    context.unitId = query.unitId;

    const dateRange = {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    };

    const result = await dashboardService.getAttendanceStats(context, dateRange);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get finance stats
 * @route GET /api/dashboard/finance
 */
export async function getFinanceStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = financeStatsQuerySchema.parse((req.query as any));
    const context = getContext(req);
    context.unitId = query.unitId;

    const result = await dashboardService.getFinanceStats(context);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get tahfidz stats with real data
 * @route GET /api/dashboard/tahfidz
 */
export async function getTahfidzStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = tahfidzStatsQuerySchema.parse((req.query as any));
    const context = getContext(req);
    context.unitId = query.unitId;

    const result = await dashboardService.getTahfidzStats(context, {
      period: query.period,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get violation and reward stats
 * @route GET /api/dashboard/violation-reward
 */
export async function getViolationRewardStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = violationRewardStatsQuerySchema.parse((req.query as any));
    const context = getContext(req);
    context.unitId = query.unitId;

    const result = await dashboardService.getViolationRewardStats(context, {
      period: query.period,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
