import { Request, Response } from 'express';
import { asyncHandler, Errors } from '@/middleware/error';
import { pkAnalyticsService } from './analytics.service';
import { RoleCode } from '@prisma/client';

/** Roles that have cross-cutting or unit-level leadership access to analytics. */
function isLeadershipUser(req: Request): boolean {
  const roleCode = req.user?.roleCode ?? '';
  const userRole = req.user?.role ?? '';
  if (userRole === 'SUPER_ADMIN') return true;
  if (req.user?.unitId) return true;

  const leadershipRoles = [
    RoleCode.SUPER_ADMIN,
    RoleCode.YAYASAN_KETUA,
    RoleCode.YAYASAN_PEMBINA,
    RoleCode.YAYASAN_PENGAWAS,
    RoleCode.TKQ_ADMIN,
    RoleCode.SDIT_ADMIN,
    RoleCode.SMPIT_ADMIN,
    RoleCode.SMAQ_ADMIN,
    RoleCode.TKQ_KEPALA_SEKOLAH,
    RoleCode.SDIT_KEPALA_SEKOLAH,
    RoleCode.SMPIT_KEPALA_SEKOLAH,
    RoleCode.SMAQ_KEPALA_SEKOLAH,
    'UNIT_ADMIN',
  ];
  return leadershipRoles.includes(roleCode as RoleCode);
}

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  if (!isLeadershipUser(req)) throw Errors.forbidden('Only leadership roles may access analytics');

  const isSuper = req.user?.roleCode === RoleCode.SUPER_ADMIN || req.user?.roleCode === RoleCode.YAYASAN_KETUA;
  const unitId = isSuper
    ? (req.query.unitId as string | undefined)
    : (req.user?.unitId ?? undefined);

  if (!isSuper && !unitId) {
    throw Errors.forbidden('User does not belong to a specific unit and lacks global analytics access');
  }

  const data = await pkAnalyticsService.getUnitPerformanceDashboard(unitId);
  res.json({ success: true, data });
});

export const getDrilldown = asyncHandler(async (req: Request, res: Response) => {
  if (!isLeadershipUser(req)) throw Errors.forbidden('Only leadership roles may access analytics');

  const isSuper = req.user?.roleCode === RoleCode.SUPER_ADMIN || req.user?.roleCode === RoleCode.YAYASAN_KETUA;
  const targetUnitId = req.params.unitId;
  if (!isSuper && req.user?.unitId && req.user.unitId !== targetUnitId) {
    throw Errors.forbidden('Cannot view drilldown scores of another unit');
  }

  const data = await pkAnalyticsService.getUnitDrilldown(targetUnitId);
  res.json({ success: true, data });
});

export const getConsolidatedReport = asyncHandler(async (req: Request, res: Response) => {
  if (!isLeadershipUser(req)) throw Errors.forbidden('Only leadership roles may access analytics');

  const isSuper = req.user?.roleCode === RoleCode.SUPER_ADMIN || req.user?.roleCode === RoleCode.YAYASAN_KETUA;
  const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
  const year = req.query.year
    ? parseInt(req.query.year as string, 10)
    : new Date().getFullYear();

  const scopedUnitId = isSuper ? undefined : (req.user?.unitId ?? undefined);
  if (!isSuper && !scopedUnitId) {
    throw Errors.forbidden('User does not belong to a specific unit and lacks global analytics access');
  }

  const data = await pkAnalyticsService.getConsolidatedReport({ month, year, unitId: scopedUnitId });
  res.json({ success: true, data });
});
