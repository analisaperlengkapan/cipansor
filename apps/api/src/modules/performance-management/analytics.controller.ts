import { Request, Response } from 'express';
import { asyncHandler, Errors } from '@/middleware/error';
import { ApiResponse } from '@/utils/response';
import { pkAnalyticsService } from './analytics.service';
import { RoleCode } from '@prisma/client';

/** Roles that have cross-cutting or unit-level leadership access to analytics. */
function isLeadershipUser(req: Request): boolean {
  const roleCode = req.user?.roleCode ?? '';
  const leadershipRoles = [
    RoleCode.SUPER_ADMIN,
    RoleCode.YAYASAN_KETUA,
    RoleCode.YAYASAN_PEMBINA,
    RoleCode.YAYASAN_PENGAWAS,
    RoleCode.YAYASAN_SEKRETARIS,
    RoleCode.YAYASAN_BENDAHARA,
    RoleCode.YAYASAN_ANGGOTA,
    RoleCode.TKQ_ADMIN,
    RoleCode.SDIT_ADMIN,
    RoleCode.SMPIT_ADMIN,
    RoleCode.SMAQ_ADMIN,
    RoleCode.TKQ_KEPALA_SEKOLAH,
    RoleCode.SDIT_KEPALA_SEKOLAH,
    RoleCode.SMPIT_KEPALA_SEKOLAH,
    RoleCode.SMAQ_KEPALA_SEKOLAH,
    RoleCode.PESANTREN_PENGASUH,
    RoleCode.PESANTREN_DIREKTUR,
    RoleCode.PT_REKTOR,
    RoleCode.PT_WAKIL_REKTOR,
    RoleCode.PT_DEKAN,
    RoleCode.PT_KAPRODI,
    'UNIT_ADMIN',
  ];
  return leadershipRoles.includes(roleCode as RoleCode);
}

/** Roles that have foundation-level (global) access to all units. */
function isFoundationGlobalLeadership(req: Request): boolean {
  const roleCode = req.user?.roleCode ?? '';
  const globalRoles: RoleCode[] = [
    RoleCode.SUPER_ADMIN,
    RoleCode.YAYASAN_KETUA,
    RoleCode.YAYASAN_PEMBINA,
    RoleCode.YAYASAN_PENGAWAS,
    RoleCode.YAYASAN_SEKRETARIS,
    RoleCode.YAYASAN_BENDAHARA,
    RoleCode.YAYASAN_ANGGOTA,
  ];
  return globalRoles.includes(roleCode as RoleCode);
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
  if (req.query.month) {
    const parsedMonth = parseInt(req.query.month as string, 10);
    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      throw Errors.badRequest('Invalid month parameter. Month must be between 1 and 12');
    }
    month = parsedMonth;
  }

  let year = new Date().getFullYear();
  if (req.query.year) {
    const parsedYear = parseInt(req.query.year as string, 10);
    if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
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
