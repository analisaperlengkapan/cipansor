import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { verifyToken, JwtPayload } from '@/lib/jwt';
import { Errors } from './error';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
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

    req.user = payload;
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
      if (payload.type === 'access') {
        req.user = payload;
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
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(Errors.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(Errors.forbidden('Insufficient permissions'));
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

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return next(Errors.forbidden('Super Admin access required'));
  }

  next();
}

/**
 * Check if user is Admin (Super Admin or Unit Admin)
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(Errors.unauthorized());
  }

  const adminRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN];
  if (!adminRoles.includes(req.user.role)) {
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

  const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER];
  
  if (!allowedRoles.includes(req.user.role)) {
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
    if (req.user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    const requestedUnitId = req.params[paramName] || req.body.unitId || req.query.unitId;
    
    if (requestedUnitId && req.user.unitId !== requestedUnitId) {
      return next(Errors.forbidden('Access to this unit is not allowed'));
    }

    next();
  };
}
