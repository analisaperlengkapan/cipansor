import { Request } from 'express';
import { RoleCode } from '@prisma/client';

/**
 * Resolve the effective unitId for the current request.
 * SUPER_ADMIN users are global and may optionally specify a unitId via
 * query string to scope their operation.
 * Non-SUPER_ADMIN users MUST use the unitId from their JWT to prevent
 * cross-unit access via query parameter injection.
 *
 * NOTE: Only the query string (and JWT for non-SUPER_ADMIN) is consulted —
 * the request body is intentionally NOT checked because every write route
 * in the codebase validates its body with a Zod schema that either uses
 * `.strict()` (rejects unknown fields) or lacks a `unitId` property (strips
 * it by default). A `req.body.unitId` fallback would therefore be dead code
 * and misleading documentation for API consumers. SUPER_ADMIN callers MUST
 * supply the unitId via `?unitId=...` on the query string.
 */
export function resolveUnitId(req: Request): string | undefined {
  // SUPER_ADMIN is checked first so that a SUPER_ADMIN who happens to have
  // a unitId in their JWT (e.g. assigned to a specific unit) can still
  // operate globally by omitting the unitId query param.
  if (req.user?.roleCode === RoleCode.SUPER_ADMIN) {
    return (req.query.unitId as string | undefined)
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
