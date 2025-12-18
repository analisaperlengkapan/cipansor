import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { PaginatedResponse, ApiResponse } from '@/lib/api';

// ============================================
// TYPES
// ============================================

export type PAUDAspect = 'NAM' | 'FM' | 'KOG' | 'BHS' | 'SE' | 'SNI';
export type PAUDAchievementLevel = 'BB' | 'MB' | 'BSH' | 'BSB';

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

export interface PAUDIndicator {
  id: string;
  aspect: PAUDAspect;
  name: string;
  description?: string;
  ageGroupMonths: string;
  isActive: boolean;
}

export interface PAUDAssessment {
  id: string;
  studentId: string;
  academicYearId: string;
  indicatorId?: string;
  aspect: PAUDAspect;
  periodType: 'HARIAN' | 'MINGGUAN' | 'BULANAN' | 'SEMESTER';
  periodDate: string;
  achievementLevel: PAUDAchievementLevel;
  narrativeText?: string;
  teacherNotes?: string;
  recommendations?: string;
  assessedById: string;
  student?: {
    id: string;
    nis: string;
    user?: { name: string };
    photoUrl?: string;
  };
  academicYear?: {
    id: string;
    name: string;
  };
  indicator?: PAUDIndicator;
  assessedBy?: {
    id: string;
    name: string;
  };
  evidences?: PAUDEvidence[];
  createdAt: string;
  updatedAt: string;
}

export interface PAUDEvidence {
  id: string;
  assessmentId: string;
  fileUrl: string;
  fileType: string;
  caption?: string;
  createdAt: string;
}

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

export interface CreateAssessmentData {
  studentId: string;
  academicYearId: string;
  indicatorId?: string;
  aspect: PAUDAspect;
  periodType: 'HARIAN' | 'MINGGUAN' | 'BULANAN' | 'SEMESTER';
  periodDate: string;
  achievementLevel: PAUDAchievementLevel;
  narrativeText?: string;
  teacherNotes?: string;
  recommendations?: string;
}

export interface UpdateAssessmentData extends Partial<CreateAssessmentData> { }

export interface BulkAssessmentData {
  classId: string;
  academicYearId: string;
  aspect: PAUDAspect;
  periodType: string;
  periodDate: string;
  assessments: Array<{
    studentId: string;
    achievementLevel: PAUDAchievementLevel;
    narrativeText?: string;
  }>;
}

export interface StudentProgressSummary {
  studentId: string;
  student: {
    id: string;
    nis: string;
    user?: { name: string };
    photoUrl?: string;
  };
  aspects: Record<PAUDAspect, {
    latestLevel: PAUDAchievementLevel | null;
    assessmentCount: number;
    progressTrend: 'UP' | 'DOWN' | 'STABLE' | 'NONE';
  }>;
  totalAssessments: number;
  lastAssessmentDate: string | null;
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
    mutationFn: async (data: CreateAssessmentData) => {
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
    mutationFn: async ({ id, data }: { id: string; data: UpdateAssessmentData }) => {
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
    mutationFn: async (data: BulkAssessmentData) => {
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
