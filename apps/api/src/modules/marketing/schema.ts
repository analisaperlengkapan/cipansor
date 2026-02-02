import { z } from 'zod';
import { LeadStatus } from '@prisma/client';
import { createRegistrantSchema } from '../psb/schema';

// Campaign Schemas
export const createCampaignSchema = z.object({
  unitId: z.string().optional(),
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().datetime(), // ISO string
  endDate: z.string().datetime().optional().nullable(),
  budget: z.number().optional().nullable(),
  targetLeads: z.number().int().optional().nullable(),
});

export const updateCampaignSchema = createCampaignSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const getCampaignByCodeSchema = z.object({
  code: z.string().min(1),
});

// Interaction Schemas
export const logInteractionSchema = z.object({
  registrantId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  date: z.string().datetime(),
  type: z.string().min(1), // CALL, WA, VISIT
  notes: z.string().optional(),
  nextActionDate: z.string().datetime().optional().nullable(),
}).refine((data) => data.registrantId || data.leadId, {
  message: "Either registrantId or leadId must be provided",
  path: ["leadId"],
});

// Lead Schemas
export const createLeadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional().or(z.literal('')),
  source: z.string().optional(),
  interest: z.string().optional(),
  campaignId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  status: z.nativeEnum(LeadStatus).optional(),
  assignedToId: z.string().uuid().optional(),
});

export const queryLeadSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.nativeEnum(LeadStatus).optional(),
  campaignId: z.string().uuid().optional(),
  search: z.string().optional(),
});

// Conversion Schema
// We extend the PSB registrant schema but make some fields optional if they come from Lead?
// No, validation should be strict for the Registrant creation.
// However, we might want to allow the frontend to pass them.
// We will simply use the PSB schema for the payload of conversion.
export const convertLeadSchema = createRegistrantSchema;

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type LogInteractionInput = z.infer<typeof logInteractionSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type QueryLeadInput = z.infer<typeof queryLeadSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
