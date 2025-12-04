import { z } from 'zod';

export const getRolesQuerySchema = z.object({
  realm: z.enum(['GLOBAL', 'YAYASAN', 'PAUD', 'SD_IT', 'SMP_IT', 'SMA_ALQURAN']).optional(),
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

export type GetRolesQuery = z.infer<typeof getRolesQuerySchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type SwitchRoleInput = z.infer<typeof switchRoleSchema>;
export type SetPrimaryRoleInput = z.infer<typeof setPrimaryRoleSchema>;
