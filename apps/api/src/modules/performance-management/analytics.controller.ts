import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { pkAnalyticsService } from './analytics.service';
import { RoleCode } from '@prisma/client';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  // Non-superadmins are scoped to their own unit regardless of the query.
  const isSuper = req.user?.roleCode === RoleCode.SUPER_ADMIN;
  const unitId = isSuper
    ? (req.query.unitId as string | undefined)
    : (req.user?.unitId ?? undefined);

  const data = await pkAnalyticsService.getUnitPerformanceDashboard(unitId);
  res.json({ success: true, data });
});

export const getDrilldown = asyncHandler(async (req: Request, res: Response) => {
  const data = await pkAnalyticsService.getUnitDrilldown(req.params.unitId);
  res.json({ success: true, data });
});

export const getConsolidatedReport = asyncHandler(async (req: Request, res: Response) => {
  const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
  const year = req.query.year
    ? parseInt(req.query.year as string, 10)
    : new Date().getFullYear();

  const data = await pkAnalyticsService.getConsolidatedReport({ month, year });
  res.json({ success: true, data });
});
