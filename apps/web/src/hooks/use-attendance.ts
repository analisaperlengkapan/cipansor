import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { ApiResponse, PaginatedResponse } from '@/lib/api';

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    name: string;
    nis: string;
  };
  class?: {
    id: string;
    name: string;
  };
  recorder?: {
    id: string;
    name: string;
  };
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'SICK' | 'PERMITTED';

export const ATTENDANCE_STATUSES: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'PRESENT', label: 'Hadir', color: 'bg-green-100 text-green-800' },
  { value: 'ABSENT', label: 'Tidak Hadir', color: 'bg-red-100 text-red-800' },
  { value: 'LATE', label: 'Terlambat', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'SICK', label: 'Sakit', color: 'bg-blue-100 text-blue-800' },
  { value: 'PERMITTED', label: 'Izin', color: 'bg-purple-100 text-purple-800' },
];

export interface AttendanceParams {
  page?: number;
  limit?: number;
  classId?: string;
  studentId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
}

export function useAttendances(params: AttendanceParams = {}) {
  return useQuery({
    queryKey: ['attendances', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Attendance>>('/attendance', { params });
      return response.data;
    },
  });
}

export function useAttendance(id: string) {
  return useQuery({
    queryKey: ['attendances', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Attendance>>(`/attendance/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useClassAttendance(classId: string, date: string) {
  return useQuery({
    queryKey: ['attendances', 'class', classId, date],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Attendance[]>>(`/attendance/class/${classId}`, {
        params: { date },
      });
      return response.data.data;
    },
    enabled: !!classId && !!date,
  });
}

export interface CreateAttendanceData {
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface BulkAttendanceData {
  classId: string;
  date: string;
  attendances: {
    studentId: string;
    status: AttendanceStatus;
    notes?: string;
  }[];
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateAttendanceData) => {
      const response = await api.post<ApiResponse<Attendance>>('/attendance', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
    },
  });
}

export function useBulkCreateAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: BulkAttendanceData) => {
      const response = await api.post<ApiResponse<Attendance[]>>('/attendance/bulk', data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ 
        queryKey: ['attendances', 'class', variables.classId, variables.date] 
      });
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateAttendanceData> }) => {
      const response = await api.patch<ApiResponse<Attendance>>(`/attendance/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['attendances', variables.id] });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/attendance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
    },
  });
}

export interface AttendanceSummary {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  sick: number;
  permitted: number;
  attendanceRate: number;
}

export function useStudentAttendanceSummary(studentId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['attendance-summary', studentId, startDate, endDate],
    queryFn: async () => {
      const params = { startDate, endDate };
      const response = await api.get<ApiResponse<AttendanceSummary>>(
        `/attendance/summary/student/${studentId}`,
        { params }
      );
      return response.data.data;
    },
    enabled: !!studentId,
  });
}

export function useClassAttendanceSummary(classId: string, date: string) {
  return useQuery({
    queryKey: ['attendance-summary', 'class', classId, date],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{
        total: number;
        present: number;
        absent: number;
        late: number;
        sick: number;
        permitted: number;
      }>>(`/attendance/summary/class/${classId}`, { params: { date } });
      return response.data.data;
    },
    enabled: !!classId && !!date,
  });
}

// Calendar view interfaces
export interface AttendanceCalendarDay {
  date: string;
  present: number;
  absent: number;
  late: number;
  sick: number;
  permitted: number;
  total: number;
}

export interface AttendanceCalendarResponse {
  classId: string;
  className: string;
  year: number;
  month: number;
  days: AttendanceCalendarDay[];
  summary: {
    totalStudents: number;
    totalSchoolDays: number;
    avgAttendanceRate: number;
  };
}

export function useAttendanceCalendar(classId: string, year: number, month: number) {
  return useQuery({
    queryKey: ['attendance-calendar', classId, year, month],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AttendanceCalendarResponse>>(
        `/attendance/calendar/${classId}`,
        { params: { year, month } }
      );
      return response.data.data;
    },
    enabled: !!classId && !!year && month !== undefined,
  });
}
