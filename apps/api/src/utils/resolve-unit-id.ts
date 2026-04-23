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

/**
 * Boolean helper to check if the current request is from a SUPER_ADMIN user.
 *
 * NOTE: Named `isSuperAdminUser` (not `isSuperAdmin`) to avoid name collision
 * with the Express middleware `isSuperAdmin` exported from
 * `@/middleware/auth`, which has signature `(req, res, next)` and is used
 * directly in route definitions. Importing both into the same file would
 * otherwise require aliasing.
 */
export function isSuperAdminUser(req: Request): boolean {
  return req.user?.roleCode === RoleCode.SUPER_ADMIN;
}
