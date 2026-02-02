import { z } from 'zod';

export const createPsychologyTestSchema = z.object({
  body: z.object({
    unitId: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    type: z.string().min(1, 'Type is required'),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updatePsychologyTestSchema = z.object({
  body: z.object({
    unitId: z.string().optional(),
    name: z.string().optional(),
    type: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createStudentPsychologyRecordSchema = z.object({
  body: z.object({
    studentId: z.string().uuid('Invalid student ID'),
    testId: z.string().uuid('Invalid test ID'),
    testDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format',
    }),
    score: z.number().optional(),
    classification: z.string().optional(),
    analysis: z.string().optional(),
    details: z.any().optional(),
    attachmentUrl: z.string().optional(),
  }),
});

export const updateStudentPsychologyRecordSchema = z.object({
  body: z.object({
    testDate: z.string().optional().refine((date) => !date || !isNaN(Date.parse(date)), {
      message: 'Invalid date format',
    }),
    score: z.number().optional(),
    classification: z.string().optional(),
    analysis: z.string().optional(),
    details: z.any().optional(),
    attachmentUrl: z.string().optional(),
  }),
});

export type CreatePsychologyTestInput = z.infer<typeof createPsychologyTestSchema>['body'];
export type UpdatePsychologyTestInput = z.infer<typeof updatePsychologyTestSchema>['body'];
export type CreateStudentPsychologyRecordInput = z.infer<typeof createStudentPsychologyRecordSchema>['body'];
export type UpdateStudentPsychologyRecordInput = z.infer<typeof updateStudentPsychologyRecordSchema>['body'];
