import { z } from 'zod';

export const CreateStudentOrgSchema = z.object({
  unitId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
});

export const CreatePositionSchema = z.object({
  orgId: z.string().uuid(),
  name: z.string(),
  level: z.number().int().min(1).default(1),
});

export const AddMemberSchema = z.object({
  positionId: z.string().uuid(),
  studentId: z.string().uuid(),
});

export const CreateLogbookSchema = z.object({
  memberId: z.string().uuid(),
  date: z.string(),
  activity: z.string(),
  result: z.string().optional(),
  notes: z.string().optional(),
});
