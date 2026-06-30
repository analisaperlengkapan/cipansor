import { z } from "zod";

export const StudentOrgSchema = z.object({
  id: z.string().uuid(),
  unitId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
});

export type StudentOrg = z.infer<typeof StudentOrgSchema>;

export const StudentOrgMemberSchema = z.object({
  id: z.string().uuid(),
  positionId: z.string().uuid(),
  studentId: z.string().uuid(),
  studentName: z.string().optional(),
  positionName: z.string().optional(),
});

export type StudentOrgMember = z.infer<typeof StudentOrgMemberSchema>;

export const StudentOrgLogbookSchema = z.object({
  id: z.string().uuid(),
  memberId: z.string().uuid(),
  date: z.string().datetime(),
  activity: z.string(),
  result: z.string().nullable(),
  notes: z.string().nullable(),
});

export type StudentOrgLogbook = z.infer<typeof StudentOrgLogbookSchema>;
