import { z } from 'zod';
import { RoleCode } from '@prisma/client';

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Register schema (admin creates user)
// Accepts `roleCode` (new) OR `role` (legacy) for backward compatibility with
// existing API clients, scripts, and mobile apps that still send `{ role: 'TEACHER' }`.
// If both are provided, `roleCode` takes precedence.
// The legacy `role` field maps to RoleCode via LEGACY_ROLE_TO_ROLE_CODE below.
const LEGACY_ROLE_TO_ROLE_CODE: Record<string, RoleCode> = {
  SUPER_ADMIN: RoleCode.SUPER_ADMIN,
  // Legacy UNIT_ADMIN → default to YAYASAN_ADMIN; callers should migrate to
  // specific per-unit admin RoleCodes (e.g. SDIT_ADMIN) for precision.
  UNIT_ADMIN: RoleCode.YAYASAN_ADMIN,
  TEACHER: RoleCode.SDIT_GURU,
  STAFF: RoleCode.SDIT_TATA_USAHA,
  STUDENT: RoleCode.SDIT_SISWA,
  PARENT: RoleCode.SDIT_ORANG_TUA,
};

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  roleCode: z.nativeEnum(RoleCode, { errorMap: () => ({ message: 'Invalid role code' }) }).optional(),
  // DEPRECATED: Legacy `role` field. Use `roleCode` instead.
  // Accepted for backward compatibility with pre-migration API clients.
  role: z.string().optional(),
  unitId: z.string().uuid().optional().nullable(),
}).refine(
  (data) => data.roleCode || data.role,
  { message: 'Either roleCode or role is required', path: ['roleCode'] },
).transform((data): {
  name: string;
  email: string;
  password: string;
  roleCode: RoleCode;
  role?: string;
  unitId?: string | null;
} => {
  // Resolve legacy `role` to `roleCode` when only `role` is provided
  if (!data.roleCode && data.role) {
    const mapped = LEGACY_ROLE_TO_ROLE_CODE[data.role];
    if (!mapped) {
      // Let it through — the service will validate against the Role table
      // and return a friendly error if the code is invalid.
      return { ...data, roleCode: data.role as RoleCode };
    }
    return { ...data, roleCode: mapped };
  }
  return { ...data, roleCode: data.roleCode! };
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
});

// Types
export type LoginInput = z.infer<typeof loginSchema>;
// RegisterInput uses z.output to get the post-transform type where roleCode is always resolved.
export type RegisterInput = z.output<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
