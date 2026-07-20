import { z } from 'zod';

export const CreateResearchThemeSchema = z.object({
  unitId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
});

export const CreateResearchSubmissionSchema = z.object({
  themeId: z.string().uuid(),
  title: z.string(),
  abstract: z.string().optional(),
  content: z.string().optional(),
});

export const AddReferenceSchema = z.object({
  submissionId: z.string().uuid(),
  bookTitle: z.string(),
  author: z.string().optional(),
  volume: z.string().optional(),
  page: z.string().optional(),
  contentQuote: z.string().optional(),
});

export const ReviewSubmissionSchema = z.object({
  status: z.enum(['SUBMITTED', 'REVIEWED']),
  feedback: z.string().optional(),
});
