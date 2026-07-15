import { z } from "zod";

export const ResearchThemeSchema = z.object({
  id: z.string().uuid(),
  unitId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
});

export type ResearchTheme = z.infer<typeof ResearchThemeSchema>;

export const ResearchSubmissionSchema = z.object({
  id: z.string().uuid(),
  themeId: z.string().uuid(),
  studentId: z.string().uuid(),
  title: z.string(),
  abstract: z.string().nullable(),
  content: z.string().nullable(),
  status: z.string(),
  feedback: z.string().nullable(),
  reviewedById: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ResearchSubmission = z.infer<typeof ResearchSubmissionSchema>;

export const ResearchReferenceSchema = z.object({
  id: z.string().uuid(),
  submissionId: z.string().uuid(),
  bookTitle: z.string(),
  author: z.string().nullable(),
  volume: z.string().nullable(),
  page: z.string().nullable(),
  contentQuote: z.string().nullable(),
});

export type ResearchReference = z.infer<typeof ResearchReferenceSchema>;
