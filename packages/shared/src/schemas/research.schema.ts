import { z } from 'zod';

export const ResearchCategorySchema = z.enum([
  'PTK',
  'INSTITUTIONAL',
  'ACADEMIC',
  'CURRICULUM',
  'COMMUNITY_SERVICE',
  'OTHER',
]);

export const ResearchStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'REVIEW',
  'APPROVED',
  'REJECTED',
  'ONGOING',
  'COMPLETED',
  'PUBLISHED',
]);

export const ResearchOutputTypeSchema = z.enum([
  'JOURNAL',
  'BOOK',
  'HAKI',
  'MODULE',
  'PROCEEDING',
  'OTHER',
]);

export const CreateResearchProposalSchema = z.object({
  unitId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  title: z.string().min(3),
  abstract: z.string().optional(),
  category: ResearchCategorySchema,
  budgetProposed: z.coerce.number().min(0), // coerce handles string input from forms
  documents: z.array(z.string().url()).optional(),
});

export const UpdateResearchProposalSchema = CreateResearchProposalSchema.partial().extend({
  status: ResearchStatusSchema.optional(),
  reviewNotes: z.string().optional(),
});

export const CreateResearchOutputSchema = z.object({
  proposalId: z.string().uuid().optional(),
  type: ResearchOutputTypeSchema,
  title: z.string().min(3),
  publicationDate: z.string().datetime().optional(),
  publisher: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  citation: z.string().optional(),
  fileUrl: z.string().url().optional().or(z.literal('')),
});

export const UpdateResearchOutputSchema = CreateResearchOutputSchema.partial();
