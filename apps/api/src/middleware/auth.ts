import { Request, Response, NextFunction } from 'express';
import { RoleCode } from '@prisma/client';
import { verifyToken, JwtPayload } from '@/lib/jwt';
import { Errors } from './error';

// RoleCodes that are considered "admin" across the system.
// Includes Yayasan governance roles (PEMBINA, KETUA, etc.) because they are
// mapped from the legacy UNIT_ADMIN enum via LEGACY_ROLE_EXPANSION and need
// consistent treatment in isAdmin() / isAdminRoleCode() checks (e.g. forced
// 2FA, register route access, disableTwoFactor security guards).
const ADMIN_ROLE_CODES: string[] = [
  RoleCode.SUPER_ADMIN,
  RoleCode.YAYASAN_ADMIN,
  RoleCode.YAYASAN_PEMBINA,
  RoleCode.YAYASAN_KETUA,
  RoleCode.YAYASAN_SEKRETARIS,
  RoleCode.YAYASAN_BENDAHARA,
  RoleCode.YAYASAN_ANGGOTA,
  RoleCode.YAYASAN_PENGAWAS,
  RoleCode.TKQ_ADMIN,
  RoleCode.SDIT_ADMIN,
  RoleCode.SMPIT_ADMIN,
  RoleCode.SMAQ_ADMIN,
  // Legacy UserRole values — pre-migration tokens carry these as roleCode
  // via buildReqUser fallback. Must be recognised so isAdmin/isAdminRoleCode
  // work for users whose access tokens were minted before the RoleCode migration.
  'UNIT_ADMIN',
];

/**
 * Backward-compatible mapping from legacy UserRole enum values to RoleCode values.
 * authorize() expands these so that existing route files using UserRole.UNIT_ADMIN,
 * UserRole.TEACHER, UserRole.STAFF etc. continue to work until fully migrated.
 * TODO: Remove this mapping once all route files are migrated to RoleCode.
 */
const LEGACY_ROLE_EXPANSION: Record<string, string[]> = {
  // SUPER_ADMIN exists in both enums — identity mapping
  SUPER_ADMIN: [RoleCode.SUPER_ADMIN],
  // Legacy UNIT_ADMIN → all per-unit admin RoleCodes + Yayasan governance roles
  UNIT_ADMIN: [
    RoleCode.YAYASAN_ADMIN,
    RoleCode.YAYASAN_PEMBINA,
    RoleCode.YAYASAN_KETUA,
    RoleCode.YAYASAN_SEKRETARIS,
    RoleCode.YAYASAN_BENDAHARA,
    RoleCode.YAYASAN_ANGGOTA,
    RoleCode.YAYASAN_PENGAWAS,
    RoleCode.TKQ_ADMIN,
    RoleCode.SDIT_ADMIN,
    RoleCode.SMPIT_ADMIN,
    RoleCode.SMAQ_ADMIN,
  ],
  // Legacy TEACHER → all per-unit teacher + kepala sekolah + pesantren roles
  TEACHER: [
    RoleCode.TKQ_GURU, RoleCode.SDIT_GURU, RoleCode.SMPIT_GURU, RoleCode.SMAQ_GURU,
    RoleCode.TKQ_KEPALA_SEKOLAH, RoleCode.SDIT_KEPALA_SEKOLAH,
    RoleCode.SMPIT_KEPALA_SEKOLAH, RoleCode.SMAQ_KEPALA_SEKOLAH,
    RoleCode.MUSYRIF, RoleCode.MUHAFIDZ, RoleCode.MURABBI, RoleCode.WALI_KAMAR,
  ],
  // Legacy STAFF → all per-unit tata usaha roles
  STAFF: [
    RoleCode.TKQ_TATA_USAHA, RoleCode.SDIT_TATA_USAHA,
    RoleCode.SMPIT_TATA_USAHA, RoleCode.SMAQ_TATA_USAHA,
  ],
  // Legacy STUDENT → all per-unit student roles
  STUDENT: [
    RoleCode.TKQ_SISWA, RoleCode.SDIT_SISWA, RoleCode.SMPIT_SISWA, RoleCode.SMAQ_SISWA,
  ],
  // Legacy PARENT → all per-unit parent roles
  PARENT: [
    RoleCode.TKQ_ORANG_TUA, RoleCode.SDIT_ORANG_TUA,
    RoleCode.SMPIT_ORANG_TUA, RoleCode.SMAQ_ORANG_TUA,
  ],
};

/**
 * Expand a list of role identifiers, resolving any legacy UserRole values
 * to their RoleCode equivalents. Values that are already valid RoleCodes
 * pass through unchanged.
 */
function expandRoleCodes(codes: string[]): string[] {
  const expanded = new Set<string>();
  for (const code of codes) {
    const mapping = LEGACY_ROLE_EXPANSION[code];
    if (mapping) {
      mapping.forEach((rc) => expanded.add(rc));
    }
    // Always add the original value so that native RoleCodes pass through
    expanded.add(code);
  }
  return Array.from(expanded);
}

/**
 * Reverse mapping: RoleCode → legacy UserRole enum value.
 * Used to populate the deprecated `req.user.role` field so that unmigrated
 * controllers/services that still compare against UserRole.SUPER_ADMIN,
 * UserRole.UNIT_ADMIN, etc. continue to work at runtime.
 * Built by inverting LEGACY_ROLE_EXPANSION.
 *
 * NOTE: Yayasan governance roles (PEMBINA, KETUA, SEKRETARIS, BENDAHARA,
 * ANGGOTA, PENGAWAS) map to 'UNIT_ADMIN' via LEGACY_ROLE_EXPANSION.
 * RoleCodes that have NO mapping (e.g. future custom roles) fall back to
 * the roleCode itself via deriveLegacyRole(), which means they will NOT
 * match any legacy UserRole comparison in unmigrated modules. This is
 * acceptable for new roles; those modules must be migrated to use roleCode.
 *
 * TODO: Remove once all modules are migrated to use roleCode.
 */
const ROLE_CODE_TO_LEGACY_ROLE: Record<string, string> = {};
for (const [legacyRole, roleCodes] of Object.entries(LEGACY_ROLE_EXPANSION)) {
  for (const rc of roleCodes) {
    // First mapping wins (e.g. SUPER_ADMIN maps to 'SUPER_ADMIN')
    if (!ROLE_CODE_TO_LEGACY_ROLE[rc]) {
      ROLE_CODE_TO_LEGACY_ROLE[rc] = legacyRole;
    }
  }
}

/**
 * Derive the legacy UserRole value from a RoleCode.
 * Falls back to the roleCode itself if no mapping exists.
 */
export function deriveLegacyRole(roleCode: string): string {
  return ROLE_CODE_TO_LEGACY_ROLE[roleCode] || roleCode;
}

/**
 * Build a safe `req.user` object from a decoded JWT payload.
 *
 * Tokens minted **before** the RoleCode migration carry `role` (legacy
 * UserRole string) but NOT `roleCode` / `permissions`.  Tokens minted
 * **after** the migration carry `roleCode` and `permissions` (and may
 * or may not carry `role`).
 *
 * This helper normalises both shapes so that downstream code can rely
 * on `req.user.roleCode` AND `req.user.role` always being populated.
 */
function buildReqUser(payload: JwtPayload): JwtPayload {
  // Determine the canonical roleCode — prefer the new field, fall back
  // to the legacy `role` field for pre-migration tokens.
  const roleCode: string = payload.roleCode || payload.role || '';

  return {
    ...payload,
    id: payload.sub,
    roleCode,
    permissions: payload.permissions || [],
    // Derive legacy role from the canonical roleCode so unmigrated
    // controllers that read `req.user.role` keep working.
    role: deriveLegacyRole(roleCode),
  };
}

// Extend Express Request type
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 * Rejects temporary 2FA tokens
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw Errors.unauthorized('No authorization header');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw Errors.unauthorized('Invalid authorization format');
    }

    const payload = verifyToken(token);

    if (payload.type !== 'access') {
      throw Errors.unauthorized('Invalid token type');
    }

    if (payload.isTemp) {
      throw Errors.unauthorized('2FA Verification Required');
    }

    req.user = buildReqUser(payload);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authentication middleware for 2FA routes
 * Accepts both regular and temporary 2FA tokens
 */
export function authenticate2FA(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw Errors.unauthorized('No authorization header');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw Errors.unauthorized('Invalid authorization format');
    }

    const payload = verifyToken(token);

    if (payload.type !== 'access') {
      throw Errors.unauthorized('Invalid token type');
    }

    req.user = buildReqUser(payload);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const [type, token] = authHeader.split(' ');

    if (type === 'Bearer' && token) {
      const payload = verifyToken(token);
      if (payload.type === 'access' && !payload.isTemp) {
        req.user = buildReqUser(payload);
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
}

/**
 * Role-based access control middleware
 * Checks the user's active RoleCode against the allowed list.
 * Accepts both native RoleCode values and legacy UserRole values
 * (which are auto-expanded via LEGACY_ROLE_EXPANSION).
 */
export function authorize(...allowedRoleCodes: string[]) {
  const expanded = expandRoleCodes(allowedRoleCodes);
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(Errors.unauthorized());
    }

    if (!expanded.includes(req.user.roleCode)) {
      return next(Errors.forbidden('Insufficient permissions'));
    }

    next();
  };
}

/**
 * Permission-based access control middleware.
 * Permissions are embedded in the JWT token at login time for performance
 * (no DB/Redis lookup per request).
 *
 * TRADE-OFF: Permission changes (grant or revoke) do NOT take effect until
 * the user's access token expires and is refreshed, or the user re-logs in.
 * For urgent revocations (e.g. security incidents), invalidate the user's
 * refresh tokens via AuthService.logout() to force a re-login.
 */
export function hasPermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(Errors.unauthorized());
    }

    // Super Admin has all permissions implicitly
    if (req.user.roleCode === RoleCode.SUPER_ADMIN) {
      return next();
    }

    const permissions = req.user.permissions || [];

    if (!permissions.includes(permission)) {
      return next(Errors.forbidden(`Missing permission: ${permission}`));
    }

    next();
  };
}

/**
 * Check if user is Super Admin
 */
export function isSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(Errors.unauthorized());
  }

  if (req.user.roleCode !== RoleCode.SUPER_ADMIN) {
    return next(Errors.forbidden('Super Admin access required'));
  }

  next();
}

/**
 * Check if user is Admin (any admin-level RoleCode)
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(Errors.unauthorized());
  }

  if (!ADMIN_ROLE_CODES.includes(req.user.roleCode)) {
    return next(Errors.forbidden('Admin access required'));
  }

  next();
}

/**
 * RoleCodes that pass the isTeacherOrAbove check.
 * Computed once at module load (like ADMIN_ROLE_CODES) to avoid
 * re-creating the array on every request.
 */
const TEACHER_OR_ABOVE_CODES: string[] = [
  ...ADMIN_ROLE_CODES,
  RoleCode.TKQ_GURU,
  RoleCode.SDIT_GURU,
  RoleCode.SMPIT_GURU,
  RoleCode.SMAQ_GURU,
  RoleCode.TKQ_KEPALA_SEKOLAH,
  RoleCode.SDIT_KEPALA_SEKOLAH,
  RoleCode.SMPIT_KEPALA_SEKOLAH,
  RoleCode.SMAQ_KEPALA_SEKOLAH,
  RoleCode.MUSYRIF,
  RoleCode.MUHAFIDZ,
  RoleCode.MURABBI,
  RoleCode.WALI_KAMAR,
  // Legacy UserRole values for pre-migration tokens
  'TEACHER',
];

/**
 * Check if user is Teacher or above
 */
export function isTeacherOrAbove(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(Errors.unauthorized());
  }

  if (!TEACHER_OR_ABOVE_CODES.includes(req.user.roleCode)) {
    return next(Errors.forbidden('Teacher or higher access required'));
  }

  next();
}

/**
 * Check if user belongs to the same unit
 */
export function sameUnit(paramName: string = 'unitId') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(Errors.unauthorized());
    }

    // Super Admin can access all units
    if (req.user.roleCode === RoleCode.SUPER_ADMIN) {
      return next();
    }

    const requestedUnitId = req.params[paramName] || req.body.unitId || req.query.unitId;

    if (requestedUnitId && req.user.unitId !== requestedUnitId) {
      return next(Errors.forbidden('Access to this unit is not allowed'));
    }

    next();
  };
}

/**
 * Helper: check if a roleCode is an admin-level role
 */
export function isAdminRoleCode(roleCode: string): boolean {
  return ADMIN_ROLE_CODES.includes(roleCode);
}
