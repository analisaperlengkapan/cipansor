import { z } from 'zod';
import { AssignmentType } from '@cipansor/shared';

export const createAssignmentSchema = z.object({
  unitId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  teacherId: z.string().uuid(),
  subjectId: z.string().uuid(),
  classId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.nativeEnum(AssignmentType).optional(),
  dueDate: z.string().or(z.date()),
  attachments: z.array(z.any()).optional()
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.nativeEnum(AssignmentType).optional(),
  dueDate: z.string().or(z.date()).optional(),
  attachments: z.array(z.any()).optional()
});

export const submitAssignmentSchema = z.object({
  studentId: z.string().uuid(),
  content: z.string().optional(),
  attachments: z.array(z.any()).optional()
});

export const gradeSubmissionSchema = z.object({
  grade: z.number().min(0).max(100),
  feedback: z.string().optional()
});
