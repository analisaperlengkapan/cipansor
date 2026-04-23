import { Request } from 'express';
import { RoleCode } from '@prisma/client';

/**
 * Resolve the effective unitId for the current request.
 * SUPER_ADMIN users are global and may optionally specify a unitId via
 * query param or body to scope their operation.
 * Non-SUPER_ADMIN users MUST use the unitId from their JWT to prevent
 * cross-unit access via query/body parameter injection.
 */
export function resolveUnitId(req: Request): string | undefined {
  // SUPER_ADMIN is checked first so that a SUPER_ADMIN who happens to have
  // a unitId in their JWT (e.g. assigned to a specific unit) can still
  // operate globally by omitting the unitId query/body param.
  if (req.user?.roleCode === RoleCode.SUPER_ADMIN) {
    return (req.query.unitId as string | undefined)
      || req.body?.unitId
      || req.user?.unitId
      || undefined;
  }
  // Non-SUPER_ADMIN users: always use JWT unitId (never trust query/body)
  if (req.user?.unitId) {
    return req.user.unitId;
  }
  // Non-SUPER_ADMIN with no unitId in JWT — cannot resolve
  return undefined;
}

export function isSuperAdmin(req: Request): boolean {
  return req.user?.roleCode === RoleCode.SUPER_ADMIN;
}
