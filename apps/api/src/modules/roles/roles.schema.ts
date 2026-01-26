import { z } from 'zod';
import { Realm } from '@prisma/client';
import { PERMISSIONS } from './permissions';

export const getRolesQuerySchema = z.object({
  realm: z
    .enum(['GLOBAL', 'YAYASAN', 'TK_QURAN', 'SD_IT', 'SMP_IT', 'SMA_QURAN', 'PESANTREN'])
    .optional(),
});

export const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  isPrimary: z.boolean().default(false),
});

export const switchRoleSchema = z.object({
  roleAssignmentId: z.string().uuid(),
});

export const setPrimaryRoleSchema = z.object({
  roleAssignmentId: z.string().uuid(),
});

export const createRoleSchema = z.object({
  code: z
    .string()
    .min(3)
    .regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric with underscores'),
  name: z.string().min(3),
  description: z.string().optional(),
  permissions: z
    .array(z.enum(Object.values(PERMISSIONS) as [string, ...string[]]))
    .optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  permissions: z
    .array(z.enum(Object.values(PERMISSIONS) as [string, ...string[]]))
    .optional(),
});

export type GetRolesQuery = z.infer<typeof getRolesQuerySchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type SwitchRoleInput = z.infer<typeof switchRoleSchema>;
export type SetPrimaryRoleInput = z.infer<typeof setPrimaryRoleSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
