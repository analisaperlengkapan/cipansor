import { Request, Response } from 'express';
import { asyncHandler, Errors } from '@/middleware/error';
import { ApiResponse } from '@/utils/response';
import { isFoundationScopedRole, isLeadershipRole } from '@/utils/resolve-unit-id';
import { pkAnalyticsService } from './analytics.service';

/** Roles that have cross-cutting or unit-level leadership access to analytics. */
function isLeadershipUser(req: Request): boolean {
  return isLeadershipRole(req.user?.roleCode);
}

/** Roles that have foundation-level (global) access to all units. */
function isFoundationGlobalLeadership(req: Request): boolean {
  return isFoundationScopedRole(req.user?.roleCode);
}

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  if (!isLeadershipUser(req)) throw Errors.forbidden('Only leadership roles may access analytics');

  const isGlobal = isFoundationGlobalLeadership(req);
  const unitId = isGlobal
    ? (req.query.unitId as string | undefined)
    : (req.user?.unitId ?? undefined);

  if (!isGlobal && !unitId) {
    throw Errors.forbidden('User does not belong to a specific unit and lacks global analytics access');
  }

  const data = await pkAnalyticsService.getUnitPerformanceDashboard(unitId);
  res.json(ApiResponse.success(data));
});

export const getDrilldown = asyncHandler(async (req: Request, res: Response) => {
  if (!isLeadershipUser(req)) throw Errors.forbidden('Only leadership roles may access analytics');

  const isGlobal = isFoundationGlobalLeadership(req);
  const targetUnitId = req.params.unitId;

  if (!isGlobal) {
    if (!req.user?.unitId || req.user.unitId !== targetUnitId) {
      throw Errors.forbidden('Cannot view drilldown scores of another unit');
    }
  }

  const data = await pkAnalyticsService.getUnitDrilldown(targetUnitId);
  res.json(ApiResponse.success(data));
});

export const getConsolidatedReport = asyncHandler(async (req: Request, res: Response) => {
  if (!isLeadershipUser(req)) throw Errors.forbidden('Only leadership roles may access analytics');

  const isGlobal = isFoundationGlobalLeadership(req);
  let month: number | undefined = undefined;
  if (req.query.month !== undefined) {
    const monthStr = String(req.query.month).trim();
    if (!/^\d+$/.test(monthStr)) {
      throw Errors.badRequest('Invalid month parameter. Must be an integer between 1 and 12');
    }
    const parsedMonth = parseInt(monthStr, 10);
    if (parsedMonth < 1 || parsedMonth > 12) {
      throw Errors.badRequest('Invalid month parameter. Must be between 1 and 12');
    }
    month = parsedMonth;
  }

  let year = new Date().getFullYear();
  if (req.query.year !== undefined) {
    const yearStr = String(req.query.year).trim();
    if (!/^\d+$/.test(yearStr)) {
      throw Errors.badRequest('Invalid year parameter. Must be a valid integer year');
    }
    const parsedYear = parseInt(yearStr, 10);
    if (parsedYear < 2000 || parsedYear > 2100) {
      throw Errors.badRequest('Invalid year parameter');
    }
    year = parsedYear;
  }

  const scopedUnitId = isGlobal ? undefined : (req.user?.unitId ?? undefined);
  if (!isGlobal && !scopedUnitId) {
    throw Errors.forbidden('User does not belong to a specific unit and lacks global analytics access');
  }

  const data = await pkAnalyticsService.getConsolidatedReport({ month, year, unitId: scopedUnitId });
  res.json(ApiResponse.success(data));
});
