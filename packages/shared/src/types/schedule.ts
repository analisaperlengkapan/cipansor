import { DayOfWeek } from "./enums";

export interface Schedule {
  id: string;
  unitId: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  room?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  // Relations (optional for listing)
  class?: { id: string; name: string; level?: string };
  subject?: { id: string; name: string; code: string };
  teacher?: { id: string; user?: { id: string; name: string } };
  academicYear?: { id: string; name: string };
  unit?: { id: string; name: string };
}

export interface CreateScheduleInput {
  unitId?: string; // Optional if inferred from user context
  academicYearId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room?: string;
  isActive?: boolean;
}

export interface UpdateScheduleInput extends Partial<CreateScheduleInput> {}

export interface ScheduleQuery {
  page?: number;
  limit?: number;
  unitId?: string;
  academicYearId?: string;
  classId?: string;
  teacherId?: string;
  dayOfWeek?: DayOfWeek;
  isActive?: boolean;
}

export interface ScheduleResponse {
  data: Schedule[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
