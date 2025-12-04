import { z } from 'zod';

// =====================================
// WAVE STATUS ENUM (matching Prisma schema)
// =====================================

export const WaveStatusEnum = z.enum([
  'UPCOMING',
  'OPEN',
  'CLOSED',
  'FULL',
]);

// =====================================
// ADMISSION WAVE SCHEMAS
// =====================================

export const listWaveQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  periodId: z.string().uuid().optional(),
  status: WaveStatusEnum.optional(),
});

export const createWaveSchema = z.object({
  periodId: z.string().uuid(),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  waveNumber: z.number().min(1, 'Wave number must be at least 1'),
  startDate: z.string(),
  endDate: z.string(),
  quota: z.number().min(1),
  registrationFee: z.number().min(0).optional(),
  status: WaveStatusEnum.default('UPCOMING'),
  notes: z.string().optional(),
});

export const updateWaveSchema = z.object({
  name: z.string().min(3).optional(),
  waveNumber: z.number().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  quota: z.number().min(1).optional(),
  registrationFee: z.number().min(0).optional(),
  status: WaveStatusEnum.optional(),
  notes: z.string().optional(),
});

// =====================================
// REGISTRANT WAVE SCHEMAS
// =====================================

export const assignWaveSchema = z.object({
  registrantId: z.string().uuid(),
  waveId: z.string().uuid(),
});

export const listRegistrantsByWaveSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.string().optional(),
});

// =====================================
// TYPE EXPORTS
// =====================================

export type ListWaveQuery = z.infer<typeof listWaveQuerySchema>;
export type CreateWaveInput = z.infer<typeof createWaveSchema>;
export type UpdateWaveInput = z.infer<typeof updateWaveSchema>;
export type AssignWaveInput = z.infer<typeof assignWaveSchema>;
export type ListRegistrantsByWaveQuery = z.infer<typeof listRegistrantsByWaveSchema>;
