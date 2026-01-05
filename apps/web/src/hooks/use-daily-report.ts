import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  DailyReport,
  CreateDailyReportInput,
  UpdateDailyReportInput,
  BulkCreateDailyReportsInput,
  DailyMood
} from '@cipansor/shared';

// Export types for components
export type { DailyReport, CreateDailyReportInput, UpdateDailyReportInput, BulkCreateDailyReportsInput, DailyMood };

export interface DailyReportFilters {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  studentId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  attendanceStatus?: string;
  unitId?: string;
}

// Query Keys
export const dailyReportKeys = {
  all: ['daily-reports'] as const,
  lists: () => [...dailyReportKeys.all, 'list'] as const,
  list: (filters: DailyReportFilters) => [...dailyReportKeys.lists(), filters] as const,
  details: () => [...dailyReportKeys.all, 'detail'] as const,
  detail: (id: string) => [...dailyReportKeys.details(), id] as const,
  byStudent: (studentId: string, filters?: Omit<DailyReportFilters, 'studentId'>) =>
    [...dailyReportKeys.all, 'student', studentId, filters] as const,
  byClass: (classId: string, date: string) =>
    [...dailyReportKeys.all, 'class', classId, date] as const,
  photos: (reportId: string) => [...dailyReportKeys.all, 'photos', reportId] as const,
};

// Hooks

// Get daily reports list
export function useDailyReports(filters: DailyReportFilters = {}) {
  return useQuery({
    queryKey: dailyReportKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
      const response = await apiClient.get(`/daily-report?${params.toString()}`);
      return response.data;
    },
  });
}

// Bulk Create daily reports
export function useBulkCreateDailyReports() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkCreateDailyReportsInput) => {
      const response = await apiClient.post('/daily-report/bulk', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.all });
    },
  });
}

// Get single daily report
export function useDailyReport(id: string) {
  return useQuery({
    queryKey: dailyReportKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get(`/daily-report/${id}`);
      return response.data.data as DailyReport;
    },
    enabled: !!id,
  });
}

// Get daily reports by student
export function useStudentDailyReports(
  studentId: string,
  filters?: Omit<DailyReportFilters, 'studentId'>
) {
  return useQuery({
    queryKey: dailyReportKeys.byStudent(studentId, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('studentId', studentId);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      // Use the standard list endpoint which supports filtering by studentId
      const response = await apiClient.get(
        `/daily-report?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!studentId,
  });
}

// Get daily reports by class for a specific date (Summary)
export function useClassDailyReports(classId: string, date: string) {
  return useQuery({
    queryKey: dailyReportKeys.byClass(classId, date),
    queryFn: async () => {
      // Use the correctly structured summary endpoint
      const response = await apiClient.get(`/daily-report/summary/class?classId=${classId}&date=${date}`);
      return response.data;
    },
    enabled: !!classId && !!date,
  });
}

// Get daily report photos
export function useDailyReportPhotos(reportId: string) {
  return useQuery({
    queryKey: dailyReportKeys.photos(reportId),
    queryFn: async () => {
      const response = await apiClient.get(`/daily-report/${reportId}/photos`);
      return response.data;
    },
    enabled: !!reportId,
  });
}

// Create daily report
export function useCreateDailyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDailyReportInput) => {
      const response = await apiClient.post('/daily-report', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.all });
    },
  });
}

// Update daily report
export function useUpdateDailyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDailyReportInput }) => {
      const response = await apiClient.put(`/daily-report/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.lists() });
    },
  });
}

// Delete daily report
export function useDeleteDailyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/daily-report/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.all });
    },
  });
}

// Add photo to daily report
export function useAddDailyReportPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      data,
    }: {
      reportId: string;
      data: { photoUrl: string; caption?: string; activityType?: string };
    }) => {
      const response = await apiClient.post(`/daily-report/${reportId}/photos`, data);
      return response.data;
    },
    onSuccess: (_, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.photos(reportId) });
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.detail(reportId) });
    },
  });
}

// Delete photo from daily report
export function useDeleteDailyReportPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, photoId }: { reportId: string; photoId: string }) => {
      const response = await apiClient.delete(`/daily-report/${reportId}/photos/${photoId}`);
      return response.data;
    },
    onSuccess: (_, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.photos(reportId) });
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.detail(reportId) });
    },
  });
}

// Add parent notes
export function useAddParentNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, notes }: { reportId: string; notes: string }) => {
      // Assuming 'confirm' endpoint handles parent interaction as per controller audit,
      // or using generic update if 'confirm' is just for read status.
      // Based on controller, we have: POST /:id/confirm
      const response = await apiClient.post(`/daily-report/${reportId}/confirm`, {
        isConfirmed: true,
        parentFeedback: notes,
      });
      return response.data;
    },
    onSuccess: (_, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.detail(reportId) });
    },
  });
}
