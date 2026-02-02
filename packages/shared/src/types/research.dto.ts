import { z } from 'zod';
import {
  CreateResearchProposalSchema,
  UpdateResearchProposalSchema,
  CreateResearchOutputSchema,
  UpdateResearchOutputSchema,
  ResearchCategorySchema,
  ResearchStatusSchema,
  ResearchOutputTypeSchema
} from '../schemas/research.schema';

export type ResearchCategory = z.infer<typeof ResearchCategorySchema>;
export type ResearchStatus = z.infer<typeof ResearchStatusSchema>;
export type ResearchOutputType = z.infer<typeof ResearchOutputTypeSchema>;

export type CreateResearchProposalInput = z.infer<typeof CreateResearchProposalSchema>;
export type UpdateResearchProposalInput = z.infer<typeof UpdateResearchProposalSchema>;

export type CreateResearchOutputInput = z.infer<typeof CreateResearchOutputSchema>;
export type UpdateResearchOutputInput = z.infer<typeof UpdateResearchOutputSchema>;
