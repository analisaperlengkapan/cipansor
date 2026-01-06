import { z } from 'zod';
import { 
  listStudentsQuerySchema as sharedListSchema,
  createStudentSchema as sharedCreateSchema,
  updateStudentSchema as sharedUpdateSchema
} from '@cipansor/shared';

// Query params
export const listStudentsQuerySchema = sharedListSchema;

// Create student
// API extends shared schema to enforce stricter password policy for creation
export const createStudentSchema = sharedCreateSchema.extend({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
});

// Update student
export const updateStudentSchema = sharedUpdateSchema;

// ID param
export const studentIdParamSchema = z.object({
  id: z.string().uuid('Invalid student ID'),
});

// Types
export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
