import { z } from 'zod';

export const createCampaignSchema = z.object({
  unitId: z.string().optional(),
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().datetime(), // ISO string
  endDate: z.string().datetime().optional().nullable(),
  budget: z.number().optional().nullable(),
});

export const updateCampaignSchema = createCampaignSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const getCampaignByCodeSchema = z.object({
  code: z.string().min(1),
});

export const logInteractionSchema = z.object({
  registrantId: z.string().uuid(),
  date: z.string().datetime(),
  type: z.string().min(1), // CALL, WA, VISIT
  notes: z.string().optional(),
  nextActionDate: z.string().datetime().optional().nullable(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type LogInteractionInput = z.infer<typeof logInteractionSchema>;
