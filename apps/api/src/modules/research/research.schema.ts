import { z } from 'zod';
import {
  CreateResearchProposalSchema,
  UpdateResearchProposalSchema,
  CreateResearchOutputSchema,
  UpdateResearchOutputSchema,
  ResearchStatusSchema,
  ResearchCategorySchema
} from '@cipansor/shared';

// Query Params for Listing Proposals
export const listResearchProposalsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  unitId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  status: ResearchStatusSchema.optional(),
  category: ResearchCategorySchema.optional(),
  researcherId: z.string().uuid().optional(),
});

// Query Params for Listing Outputs
export const listResearchOutputsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  unitId: z.string().uuid().optional(),
  researcherId: z.string().uuid().optional(),
});

// Params for ID
export const researchIdParamSchema = z.object({
  id: z.string().uuid(),
});

// Export shared schemas for controller use
export {
  CreateResearchProposalSchema,
  UpdateResearchProposalSchema,
  CreateResearchOutputSchema,
  UpdateResearchOutputSchema
};

export type ListResearchProposalsQuery = z.infer<typeof listResearchProposalsQuerySchema>;
export type ListResearchOutputsQuery = z.infer<typeof listResearchOutputsQuerySchema>;
