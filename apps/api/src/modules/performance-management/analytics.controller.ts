import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { pkAnalyticsService } from './analytics.service';
import { UserRole } from '@prisma/client';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const unitId = (req.query.unitId as string) || (req.user?.role !== UserRole.SUPER_ADMIN ? req.user?.unitId : undefined);
  const data = await pkAnalyticsService.getUnitPerformanceDashboard(unitId as string);
  res.json({ success: true, data });
});

export const getDrilldown = asyncHandler(async (req: Request, res: Response) => {
  const { unitId } = req.params;
  const data = await pkAnalyticsService.getUnitDrilldown(unitId);
  res.json({ success: true, data });
});

export const getConsolidatedReport = asyncHandler(async (req: Request, res: Response) => {
  const month = req.query.month ? parseInt(req.query.month as string) : undefined;
  const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

  const data = await pkAnalyticsService.getConsolidatedReport({ month, year });
  res.json({ success: true, data });
});
