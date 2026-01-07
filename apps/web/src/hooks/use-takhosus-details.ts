import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PaginatedResponse } from '@/types/api';
import {
  MurojaahRecord,
  SimaanExam,
  TakhosusDashboardStats,
  CreateMurojaahInput, // Assuming these input types might be in shared schemas or we can infer
  CreateSimaanInput
} from '@cipansor/shared';

// Re-export shared types for component usage
export type { MurojaahRecord, SimaanExam, TakhosusDashboardStats };

// ================= HOOKS =================

export function useTakhosusDashboard(unitId?: string) {
  return useQuery({
    queryKey: ['takhosus', 'dashboard', unitId],
    queryFn: async () => {
      const { data } = await api.get<TakhosusDashboardStats>('/takhosus/dashboard-stats', {
        params: { unitId },
      });
      return data.data;
    },
  });
}

export function useMurojaahRecords(params: {
  page?: number;
  limit?: number;
  studentId?: string;
  halaqohId?: string;
}) {
  return useQuery({
    queryKey: ['takhosus', 'murojaah', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<MurojaahRecord>>('/takhosus/murojaah', {
        params,
      });
      return data;
    },
  });
}

export function useSimaanExams(params: {
    page?: number;
    limit?: number;
    studentId?: string;
    halaqohId?: string;
}) {
    return useQuery({
        queryKey: ['takhosus', 'simaan', params],
        queryFn: async () => {
            const { data } = await api.get<PaginatedResponse<SimaanExam>>('/takhosus/simaan', {
                params
            });
            return data;
        }
    });
}

export function useCreateMurojaah() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const { data: response } = await api.post('/takhosus/murojaah', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['takhosus', 'murojaah'] });
            queryClient.invalidateQueries({ queryKey: ['takhosus', 'dashboard'] });
        }
    });
}

export function useCreateSimaan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const { data: response } = await api.post('/takhosus/simaan', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['takhosus', 'simaan'] });
        }
    });
}
