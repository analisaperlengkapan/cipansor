import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { PaginatedResponse, ApiResponse } from '@/lib/api';

// ============================================
// TYPES
// ============================================

export type ReportStatus = 'DRAFT' | 'FINALIZED' | 'PRINTED';

export interface PAUDReportPhoto {
  id: string;
  reportId: string;
  photoUrl: string;
  caption?: string;
  orderNumber: number;
  createdAt: string;
}

export interface PAUDNarrativeReport {
  id: string;
  studentId: string;
  unitId: string;
  academicYearId: string;
  semester: 'GANJIL' | 'GENAP';
  narrativeNAM?: string;
  narrativeFM?: string;
  narrativeKOG?: string;
  narrativeBHS?: string;
  narrativeSE?: string;
  narrativeSNI?: string;
  overallStrengths?: string;
  areasForDevelopment?: string;
  parentRecommendations?: string;
  teacherSignature?: string;
  principalSignature?: string;
  status: ReportStatus;
  finalizedAt?: string;
  printedAt?: string;
  totalDays: number;
  presentDays: number;
  sickDays: number;
  excusedDays: number;
  student?: {
    id: string;
    nis: string;
    user?: { name: string };
    photoUrl?: string;
    birthDate?: string;
    birthPlace?: string;
    gender?: 'MALE' | 'FEMALE';
    enrollments?: Array<{
      class?: { id: string; name: string };
    }>;
  };
  unit?: {
    id: string;
    name: string;
    type: string;
  };
  academicYear?: {
    id: string;
    name: string;
  };
  photos?: PAUDReportPhoto[];
  height?: number;
  weight?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReportListParams {
  page?: number;
  limit?: number;
  studentId?: string;
  classId?: string;
  academicYearId?: string;
  unitId?: string;
  semester?: 'GANJIL' | 'GENAP';
  status?: ReportStatus;
  search?: string;
}

export interface CreateReportData {
  studentId: string;
  unitId: string;
  academicYearId: string;
  semester: 'GANJIL' | 'GENAP';
  narrativeNAM?: string;
  narrativeFM?: string;
  narrativeKOG?: string;
  narrativeBHS?: string;
  narrativeSE?: string;
  narrativeSNI?: string;
  overallStrengths?: string;
  areasForDevelopment?: string;
  parentRecommendations?: string;
}

export interface UpdateReportData {
  narrativeNAM?: string;
  narrativeFM?: string;
  narrativeKOG?: string;
  narrativeBHS?: string;
  narrativeSE?: string;
  narrativeSNI?: string;
  overallStrengths?: string;
  areasForDevelopment?: string;
  parentRecommendations?: string;
  totalDays?: number;
  presentDays?: number;
  sickDays?: number;
  excusedDays?: number;
  height?: number;
  weight?: number;
}

export interface GenerateReportData {
  studentId: string;
  unitId: string;
  academicYearId: string;
  semester: 'GANJIL' | 'GENAP';
  regenerate?: boolean;
}

export interface BulkGenerateReportData {
  classId: string;
  unitId: string;
  academicYearId: string;
  semester: 'GANJIL' | 'GENAP';
  regenerate?: boolean;
}

export interface FinalizeReportData {
  teacherSignature?: string;
  principalSignature?: string;
}

// ============================================
// REPORT HOOKS
// ============================================

export function usePAUDReports(params: ReportListParams = {}) {
  return useQuery({
    queryKey: ['paud-reports', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<PAUDNarrativeReport>>('/paud-report', { params });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePAUDReport(id: string) {
  return useQuery({
    queryKey: ['paud-reports', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PAUDNarrativeReport>>(`/paud-report/${id}`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreatePAUDReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateReportData) => {
      const response = await api.post<ApiResponse<PAUDNarrativeReport>>('/paud-report', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paud-reports'] });
    },
  });
}

export function useUpdatePAUDReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateReportData }) => {
      const response = await api.put<ApiResponse<PAUDNarrativeReport>>(`/paud-report/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['paud-reports'] });
      queryClient.invalidateQueries({ queryKey: ['paud-reports', id] });
    },
  });
}

export function useDeletePAUDReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/paud-report/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paud-reports'] });
    },
  });
}

export function useGeneratePAUDReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GenerateReportData) => {
      const response = await api.post<ApiResponse<PAUDNarrativeReport>>('/paud-report/generate', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paud-reports'] });
    },
  });
}

export function useBulkGeneratePAUDReports() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BulkGenerateReportData) => {
      const response = await api.post<ApiResponse<{
        success: number;
        failed: number;
        skipped: number;
        errors: Array<{ studentId: string; studentName: string; error: string }>;
      }>>('/paud-report/bulk-generate', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paud-reports'] });
    },
  });
}

export function useFinalizePAUDReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FinalizeReportData }) => {
      const response = await api.post<ApiResponse<PAUDNarrativeReport>>(`/paud-report/${id}/finalize`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['paud-reports'] });
      queryClient.invalidateQueries({ queryKey: ['paud-reports', id] });
    },
  });
}

export function useMarkPAUDReportPrinted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<ApiResponse<PAUDNarrativeReport>>(`/paud-report/${id}/print`);
      return response.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['paud-reports'] });
      queryClient.invalidateQueries({ queryKey: ['paud-reports', id] });
    },
  });
}

// ============================================
// PHOTO HOOKS
// ============================================

export function useAddReportPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reportId, data }: { reportId: string; data: { photoUrl: string; caption?: string } }) => {
      const response = await api.post<ApiResponse<PAUDReportPhoto>>(`/paud-report/${reportId}/photos`, data);
      return response.data.data;
    },
    onSuccess: (_, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: ['paud-reports', reportId] });
    },
  });
}

export function useUpdateReportPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ photoId, data }: { photoId: string; data: { caption?: string; orderNumber?: number } }) => {
      const response = await api.put<ApiResponse<PAUDReportPhoto>>(`/paud-report/photos/${photoId}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paud-reports'] });
    },
  });
}

export function useDeleteReportPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (photoId: string) => {
      await api.delete(`/paud-report/photos/${photoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paud-reports'] });
    },
  });
}

// ============================================
// PDF HOOKS
// ============================================

export function usePAUDReportPdf(id: string) {
  return useQuery({
    queryKey: ['paud-reports', id, 'pdf'],
    queryFn: async () => {
      const response = await api.get(`/paud-report/${id}/pdf`, {
        responseType: 'text',
      });
      return response.data as string;
    },
    enabled: false, // Only fetch when explicitly called
  });
}
