import { Request, Response, NextFunction } from 'express';
import { RoleCode } from '@prisma/client';
import { verifyToken, JwtPayload } from '@/lib/jwt';
import { Errors } from './error';

// RoleCodes that are considered "admin" across the system
const ADMIN_ROLE_CODES: string[] = [
  RoleCode.SUPER_ADMIN,
  RoleCode.YAYASAN_ADMIN,
  RoleCode.TKQ_ADMIN,
  RoleCode.SDIT_ADMIN,
  RoleCode.SMPIT_ADMIN,
  RoleCode.SMAQ_ADMIN,
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
  // Legacy UNIT_ADMIN → all per-unit admin RoleCodes
  UNIT_ADMIN: [
    RoleCode.YAYASAN_ADMIN,
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

    req.user = { ...payload, id: payload.sub };
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

    req.user = { ...payload, id: payload.sub };
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
        req.user = { ...payload, id: payload.sub };
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
 * Permission-based access control middleware
 * Permissions are embedded in the JWT token at login time.
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
 * Check if user is Teacher or above
 */
export function isTeacherOrAbove(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(Errors.unauthorized());
  }

  const teacherCodes: string[] = [
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
  ];

  if (!teacherCodes.includes(req.user.roleCode)) {
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
