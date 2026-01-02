import { z } from 'zod';
import { AttendanceStatus } from '@cipansor/shared';
// Query params
export const listAttendanceQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  classId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  date: z.string().optional(), // YYYY-MM-DD
  startDate: z.string().optional(), // YYYY-MM-DD
  endDate: z.string().optional(), // YYYY-MM-DD
  status: z.nativeEnum(AttendanceStatus).optional(),
});

// Single attendance record
export const createAttendanceSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  classId: z.string().uuid('Invalid class ID'),
  date: z.coerce.date(),
  status: z.nativeEnum(AttendanceStatus),
  notes: z.string().max(500).optional(),
});

// Bulk attendance (for class)
export const bulkAttendanceSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  date: z.coerce.date(),
  records: z.array(z.object({
    studentId: z.string().uuid('Invalid student ID'),
    status: z.nativeEnum(AttendanceStatus),
    notes: z.string().max(500).optional(),
  })).min(1, 'At least one record is required'),
});

// Update attendance
export const updateAttendanceSchema = z.object({
  status: z.nativeEnum(AttendanceStatus).optional(),
  notes: z.string().max(500).optional().nullable(),
});

// ID param
export const attendanceIdParamSchema = z.object({
  id: z.string().uuid('Invalid attendance ID'),
});

// Summary query
export const attendanceSummaryQuerySchema = z.object({
  classId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  startDate: z.string(), // YYYY-MM-DD required
  endDate: z.string(), // YYYY-MM-DD required
});

// Export inferred types (optional, but we use shared types in service)
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>;
export type AttendanceSummaryQuery = z.infer<typeof attendanceSummaryQuerySchema>;
