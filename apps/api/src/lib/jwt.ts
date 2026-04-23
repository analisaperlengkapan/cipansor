import jwt from 'jsonwebtoken';
import { config } from '@/config';

export interface JwtPayload {
  id: string;
  sub: string;
  email: string;
  roleId: string; // Active Role ID from UserRoleAssignment
  roleCode: string; // RoleCode string for quick checks (e.g. 'SUPER_ADMIN')
  unitId: string | null;
  permissions: string[]; // Permissions array from the Role record
  type: 'access' | 'refresh';
  isTemp?: boolean; // For 2FA temporary tokens
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: Omit<JwtPayload, 'type'>, expiresIn?: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt as any).sign({ ...payload, type: 'access' }, config.jwt.secret, {
    expiresIn: expiresIn || config.jwt.expiresIn,
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(
  payload: Omit<JwtPayload, 'type'>,
  expiresIn?: string
): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt as any).sign({ ...payload, type: 'refresh' }, config.jwt.secret, {
    expiresIn: expiresIn || config.jwt.refreshExpiresIn,
  });
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(
  payload: Omit<JwtPayload, 'type'>,
  expiresIn?: string
): TokenPair {
  return {
    accessToken: generateAccessToken(payload, expiresIn),
    refreshToken: generateRefreshToken(payload, expiresIn),
  };
}

/**
 * Verify and decode token
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JwtPayload | null {
  return jwt.decode(token) as JwtPayload | null;
}

/**
 * Get expiration date from JWT expiry string
 */
export function getExpirationDate(expiresIn: string): Date {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid expiry format');
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const now = new Date();

  switch (unit) {
    case 's':
      return new Date(now.getTime() + value * 1000);
    case 'm':
      return new Date(now.getTime() + value * 60 * 1000);
    case 'h':
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd':
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    default:
      throw new Error('Invalid expiry unit');
  }
}
