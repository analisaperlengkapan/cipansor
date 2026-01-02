import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Attendance,
  AttendanceStatus,
  AttendanceSummary,
  AttendanceCalendarResponse,
  CreateAttendanceInput,
  BulkAttendanceInput,
  UpdateAttendanceInput,
  SharedPaginatedResponse,
  ApiResponse
} from '@cipansor/shared';

// Re-export constants for UI usage
export const ATTENDANCE_STATUSES: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: AttendanceStatus.PRESENT, label: 'Hadir', color: 'bg-green-100 text-green-800' },
  { value: AttendanceStatus.ABSENT, label: 'Tidak Hadir', color: 'bg-red-100 text-red-800' },
  { value: AttendanceStatus.LATE, label: 'Terlambat', color: 'bg-yellow-100 text-yellow-800' },
  { value: AttendanceStatus.SICK, label: 'Sakit', color: 'bg-blue-100 text-blue-800' },
  { value: AttendanceStatus.EXCUSED, label: 'Izin', color: 'bg-purple-100 text-purple-800' },
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
      // Use SharedPaginatedResponse
      const response = await api.get<SharedPaginatedResponse<Attendance>>('/attendance', { params });
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
      // Note: The backend returns records array inside pagination usually, but if this endpoint
      // returns a list, we check the generic.
      // However, looking at the API controller, 'list' returns SharedPaginatedResponse.
      // If there is a specific endpoint for class attendance without pagination, it might be different.
      // Based on previous code, this was likely calling the list endpoint with filters.
      // But the previous code had `/attendance/class/${classId}` which is NOT in the controller I saw.
      // The controller has `list`, `getById`, `create`, `bulkCreate`, `update`, `remove`, `getSummary`, `getCalendar`.
      // It does NOT have `/attendance/class/:classId`.
      // Assuming the previous code was calling a route that might have been removed or I missed it?
      // Wait, let's check the controller again.
      // Controller: list, getById, create, bulkCreate, update, remove, getSummary, getCalendar.
      // No `get /class/:classId`.
      // So `useClassAttendance` was likely broken or using a route I didn't see in the file.
      // I will fallback to using `list` with classId and date params, which is what `useAttendances` does.
      // Or maybe it was `list` with a different path?
      // actually, let's keep it as is if it matches a route I haven't seen, OR refactor it to use `list`.
      // Since I didn't see the route in `attendance.controller.ts`, I will assume `list` is the way.

      const response = await api.get<SharedPaginatedResponse<Attendance>>('/attendance', {
        params: { classId, date, limit: 100 } // specific for class view
      });
      return response.data.data; // data is the array in SharedPaginatedResponse
    },
    enabled: !!classId && !!date,
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateAttendanceInput) => {
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
    mutationFn: async (data: BulkAttendanceInput) => {
      const response = await api.post<ApiResponse<{ created: number; skipped: number }>>('/attendance/bulk', data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      // Invalidate calendar if needed
      queryClient.invalidateQueries({ 
        queryKey: ['attendance-calendar', variables.classId]
      });
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAttendanceInput }) => {
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

export function useStudentAttendanceSummary(studentId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['attendance-summary', studentId, startDate, endDate],
    queryFn: async () => {
      const params = { startDate, endDate, studentId };
      const response = await api.get<ApiResponse<AttendanceSummary>>(
        '/attendance/summary', // Changed to correct endpoint
        { params }
      );
      return response.data.data;
    },
    enabled: !!studentId && !!startDate && !!endDate,
  });
}

export function useClassAttendanceSummary(classId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['attendance-summary', 'class', classId, startDate, endDate],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AttendanceSummary>>('/attendance/summary', {
        params: { classId, startDate, endDate }
      });
      return response.data.data;
    },
    enabled: !!classId && !!startDate && !!endDate,
  });
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
