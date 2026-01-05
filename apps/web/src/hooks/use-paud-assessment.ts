import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { PaginatedResponse, ApiResponse } from '@/lib/api';
import {
  PAUDAspect,
  PAUDAchievementLevel,
  PAUDReportPeriod,
  PAUDIndicator,
  PAUDAssessment,
  PAUDEvidence,
  StudentProgressSummary,
  CreatePAUDAssessmentInput,
  UpdatePAUDAssessmentInput,
  BulkCreatePAUDAssessmentInput,
} from '@cipansor/shared';

// Re-export shared types and enums
export type {
  PAUDAspect,
  PAUDAchievementLevel,
  PAUDReportPeriod,
  PAUDIndicator,
  PAUDAssessment,
  PAUDEvidence,
  StudentProgressSummary,
};

// ============================================
// CONSTANTS
// ============================================

export const ASPECT_LABELS: Record<PAUDAspect, string> = {
  NAM: 'Nilai Agama & Moral',
  FM: 'Fisik Motorik',
  KOG: 'Kognitif',
  BHS: 'Bahasa',
  SE: 'Sosial Emosional',
  SNI: 'Seni',
};

export const ACHIEVEMENT_LABELS: Record<PAUDAchievementLevel, string> = {
  BB: 'Belum Berkembang',
  MB: 'Mulai Berkembang',
  BSH: 'Berkembang Sesuai Harapan',
  BSB: 'Berkembang Sangat Baik',
};

export const ACHIEVEMENT_COLORS: Record<PAUDAchievementLevel, string> = {
  BB: 'bg-red-100 text-red-800',
  MB: 'bg-yellow-100 text-yellow-800',
  BSH: 'bg-blue-100 text-blue-800',
  BSB: 'bg-green-100 text-green-800',
};

// ============================================
// HOOK TYPES
// ============================================

export interface AssessmentListParams {
  page?: number;
  limit?: number;
  studentId?: string;
  classId?: string;
  academicYearId?: string;
  unitId?: string;
  aspect?: PAUDAspect;
  achievementLevel?: PAUDAchievementLevel;
  periodType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// ============================================
// INDICATORS HOOKS
// ============================================

export function usePAUDIndicators(params: { aspect?: PAUDAspect; isActive?: boolean } = {}) {
  return useQuery({
    queryKey: ['paud-indicators', params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PAUDIndicator[]>>('/paud-assessment/indicators', { params });
      return response.data.data;
    },
    staleTime: 30 * 60 * 1000, // Indicators change very rarely
  });
}

// ============================================
// ASSESSMENT HOOKS
// ============================================

export function usePAUDAssessments(params: AssessmentListParams = {}) {
  return useQuery({
    queryKey: ['paud-assessments', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<PAUDAssessment>>('/paud-assessment/assessments', { params });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePAUDAssessment(id: string) {
  return useQuery({
    queryKey: ['paud-assessments', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PAUDAssessment>>(`/paud-assessment/assessments/${id}`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreatePAUDAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePAUDAssessmentInput) => {
      const response = await api.post<ApiResponse<PAUDAssessment>>('/paud-assessment/assessments', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paud-assessments'] });
    },
  });
}

export function useUpdatePAUDAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePAUDAssessmentInput }) => {
      const response = await api.put<ApiResponse<PAUDAssessment>>(`/paud-assessment/assessments/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['paud-assessments'] });
      queryClient.invalidateQueries({ queryKey: ['paud-assessments', id] });
    },
  });
}

export function useDeletePAUDAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/paud-assessment/assessments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paud-assessments'] });
    },
  });
}

export function useBulkCreatePAUDAssessments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BulkCreatePAUDAssessmentInput) => {
      const response = await api.post<ApiResponse<{ created: number; failed: number }>>('/paud-assessment/assessments/bulk', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paud-assessments'] });
    },
  });
}

// ============================================
// EVIDENCE HOOKS
// ============================================

export function useAddEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ assessmentId, data }: { assessmentId: string; data: FormData }) => {
      const response = await api.post<ApiResponse<PAUDEvidence>>(
        `/paud-assessment/assessments/${assessmentId}/evidences`,
        data,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data.data;
    },
    onSuccess: (_, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['paud-assessments', assessmentId] });
    },
  });
}

export function useDeleteEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (evidenceId: string) => {
      await api.delete(`/paud-assessment/evidences/${evidenceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paud-assessments'] });
    },
  });
}

// ============================================
// SUMMARY HOOKS
// ============================================

export function useStudentProgressSummary(studentId: string, academicYearId?: string) {
  return useQuery({
    queryKey: ['paud-progress', studentId, academicYearId],
    queryFn: async () => {
      const params = academicYearId ? { academicYearId } : {};
      const response = await api.get<ApiResponse<StudentProgressSummary>>(
        `/paud-assessment/summary/student`,
        { params: { studentId, ...params } }
      );
      return response.data.data;
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClassProgressSummary(classId: string, academicYearId?: string) {
  return useQuery({
    queryKey: ['paud-class-progress', classId, academicYearId],
    queryFn: async () => {
      const params = academicYearId ? { academicYearId } : {};
      const response = await api.get<ApiResponse<StudentProgressSummary[]>>(
        `/paud-assessment/summary/class`,
        { params: { classId, ...params } }
      );
      return response.data.data;
    },
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
  });
}
