import { z } from 'zod';

export const CreateFacultySchema = z.object({
  name: z.string().min(3),
  code: z.string().min(2),
  description: z.string().optional(),
  deanId: z.string().uuid().optional(),
});

export const CreateStudyProgramSchema = z.object({
  facultyId: z.string().uuid(),
  name: z.string().min(3),
  code: z.string().min(2),
  degree: z.string().min(2),
  accreditation: z.string().optional(),
});

export const CreateCourseSchema = z.object({
  programId: z.string().uuid(),
  name: z.string().min(3),
  code: z.string().min(2),
  credits: z.number().int().min(1).max(6),
  semester: z.number().int().min(1).max(14),
  description: z.string().optional(),
});

export const EnrollStudentSchema = z.object({
  studentId: z.string().uuid(),
  programId: z.string().uuid(),
  nim: z.string().min(5),
});

export const CreateKRSSchema = z.object({
  studentHeId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  semester: z.number().int().min(1).max(14),
});

export const AddCourseToKRSSchema = z.object({
  krsId: z.string().uuid(),
  classId: z.string().uuid(),
});
