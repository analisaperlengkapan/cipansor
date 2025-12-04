import { z } from 'zod';

// Query params
export const listStudentsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  unitId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
});

// Create student
export const createStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  unitId: z.string().uuid('Invalid unit ID'),
  nis: z.string().min(4, 'NIS must be at least 4 characters'),
  nisn: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']),
  birthPlace: z.string().min(2, 'Birth place is required'),
  birthDate: z.coerce.date(),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  parentName: z.string().min(2, 'Parent name is required'),
  parentPhone: z.string().min(10, 'Phone must be at least 10 digits'),
  parentEmail: z.string().email().optional(),
  classId: z.string().uuid().optional(), // Optional: enroll in class immediately
});

// Update student
export const updateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  nis: z.string().min(4).optional(),
  nisn: z.string().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  birthPlace: z.string().min(2).optional(),
  birthDate: z.coerce.date().optional(),
  address: z.string().min(5).optional(),
  parentName: z.string().min(2).optional(),
  parentPhone: z.string().min(10).optional(),
  parentEmail: z.string().email().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});

// ID param
export const studentIdParamSchema = z.object({
  id: z.string().uuid('Invalid student ID'),
});

// Types
export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
