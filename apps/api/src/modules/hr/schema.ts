import { z } from "zod";
import { LeaveType, LeaveStatus, StaffAttendanceStatus } from "@prisma/client";

// Staff Attendance schemas
export const createStaffAttendanceSchema = z.object({
  staffId: z.string().uuid(),
  date: z.string().datetime(),
  status: z.nativeEnum(StaffAttendanceStatus).default(StaffAttendanceStatus.PRESENT),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateStaffAttendanceSchema = z.object({
  status: z.nativeEnum(StaffAttendanceStatus).optional(),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const bulkAttendanceSchema = z.object({
  date: z.string().datetime(),
  records: z.array(z.object({
    staffId: z.string().uuid(),
    status: z.nativeEnum(StaffAttendanceStatus),
    checkIn: z.string().datetime().optional(),
    checkOut: z.string().datetime().optional(),
    notes: z.string().optional(),
  })),
});

export const queryStaffAttendanceSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  staffId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  status: z.nativeEnum(StaffAttendanceStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Leave schemas
export const createLeaveSchema = z.object({
  staffId: z.string().uuid(),
  type: z.nativeEnum(LeaveType),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().min(5),
});

export const updateLeaveSchema = z.object({
  type: z.nativeEnum(LeaveType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  reason: z.string().min(5).optional(),
});

export const approveLeaveSchema = z.object({
  status: z.enum([LeaveStatus.APPROVED, LeaveStatus.REJECTED]),
  rejectedNote: z.string().optional(),
});

export const queryLeaveSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  staffId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  type: z.nativeEnum(LeaveType).optional(),
  status: z.nativeEnum(LeaveStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Staff schemas (for HR management)
export const queryStaffSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  unitId: z.string().uuid().optional(),
  department: z.string().optional(),
  search: z.string().optional(),
});

export type CreateStaffAttendanceInput = z.infer<typeof createStaffAttendanceSchema>;
export type UpdateStaffAttendanceInput = z.infer<typeof updateStaffAttendanceSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;
export type UpdateLeaveInput = z.infer<typeof updateLeaveSchema>;
export type ApproveLeaveInput = z.infer<typeof approveLeaveSchema>;
