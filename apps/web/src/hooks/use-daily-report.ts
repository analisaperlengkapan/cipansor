import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  CreateDailyReportInput,
  UpdateDailyReportInput,
  BulkCreateDailyReportsInput,
  DailyReport,
} from '@cipansor/shared';

// Re-export types
export type { DailyReport, CreateDailyReportInput, UpdateDailyReportInput, BulkCreateDailyReportsInput };

// Re-export specific enums or types that might be needed by consumers
// This assumes @cipansor/shared exports these. If not, they are defined here as types.
export type DailyMood = 'HAPPY' | 'NEUTRAL' | 'SAD' | 'TIRED' | 'EXCITED' | 'SICK';

interface DailyReportListResponse {
  data: DailyReport[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface DailyReportResponse {
  data: DailyReport;
}

interface DailyReportListQuery {
  page?: number;
  limit?: number;
  studentId?: string;
  unitId?: string;
  classId?: string;
  academicYearId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

interface ClassDailySummaryQuery {
  unitId: string;
  classId?: string;
  academicYearId: string;
  date?: string;
}

// API Functions
const dailyReportKeys = {
  all: ['daily-reports'] as const,
  lists: () => [...dailyReportKeys.all, 'list'] as const,
  list: (filters: DailyReportListQuery) => [...dailyReportKeys.lists(), filters] as const,
  details: () => [...dailyReportKeys.all, 'detail'] as const,
  detail: (id: string) => [...dailyReportKeys.details(), id] as const,
  summaries: () => [...dailyReportKeys.all, 'summary'] as const,
  classSummary: (filters: ClassDailySummaryQuery) => [...dailyReportKeys.summaries(), 'class', filters] as const,
};

// Hooks

export function useDailyReportList(query: DailyReportListQuery) {
  return useQuery({
    queryKey: dailyReportKeys.list(query),
    queryFn: async () => {
      const { data } = await api.get<DailyReportListResponse>('/daily-report', { params: query });
      return data;
    },
  });
}

export function useAddDailyReportPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reportId, file }: { reportId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(`/daily-report/${reportId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (_, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.detail(reportId) });
    },
  });
}

// Alias for backward compatibility if needed, though best to update call sites
export const useDailyReports = useDailyReportList;

export function useDailyReport(id: string) {
  return useQuery({
    queryKey: dailyReportKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<DailyReportResponse>(`/daily-report/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

// Helper to get photos from a report (since they are embedded)
export function useDailyReportPhotos(reportId: string) {
  const { data: report, ...rest } = useDailyReport(reportId);
  return {
    data: report?.photos || [],
    ...rest,
  };
}

export function useClassDailySummary(query: ClassDailySummaryQuery) {
  return useQuery({
    queryKey: dailyReportKeys.classSummary(query),
    queryFn: async () => {
      const { data } = await api.get('/daily-report/summary/class', { params: query });
      return data.data;
    },
    enabled: !!query.unitId && !!query.academicYearId,
  });
}

export function useCreateDailyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDailyReportInput) => {
      const { data } = await api.post<DailyReportResponse>('/daily-report', input);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.summaries() });
    },
  });
}

export function useBulkCreateDailyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BulkCreateDailyReportsInput) => {
      const { data } = await api.post('/daily-report/bulk', input);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.summaries() });
    },
  });
}

// Alias for compatibility
export const useBulkCreateDailyReports = useBulkCreateDailyReport;

export function useUpdateDailyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDailyReportInput }) => {
      const { data: res } = await api.put<DailyReportResponse>(`/daily-report/${id}`, data);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.lists() });
    },
  });
}

export function useDeleteDailyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/daily-report/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.lists() });
    },
  });
}

export function useAddParentNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { parentFeedback: string } }) => {
      const { data: res } = await api.post(`/daily-report/${id}/confirm`, data);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.detail(id) });
    },
  });
}
