import { z } from 'zod';
import { InnovationType, InnovationStatus } from '@prisma/client';

export const createProposalSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    type: z.nativeEnum(InnovationType),
  }),
});

export const updateProposalSchema = z.object({
  body: z.object({
    title: z.string().min(5).optional(),
    description: z.string().min(20).optional(),
    type: z.nativeEnum(InnovationType).optional(),
    status: z.nativeEnum(InnovationStatus).optional(),
  }),
});

export const createReviewSchema = z.object({
  body: z.object({
    score: z.number().min(0).max(100),
    notes: z.string().optional(),
    status: z.string().optional().default('COMPLETED'),
  }),
});

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1),
  }),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>['body'];
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>['body'];
export type CreateReviewInput = z.infer<typeof createReviewSchema>['body'];
export type CreateCommentInput = z.infer<typeof createCommentSchema>['body'];
