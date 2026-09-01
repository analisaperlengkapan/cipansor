/**
 * PKG (Penilaian Kinerja Guru) React Query Hooks
 *
 * Hooks untuk manajemen PKG berdasarkan Permendiknas No. 35 Tahun 2010
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// =====================================
// TYPES
// =====================================

export interface PKGPeriod {
  id: string;
  unitId: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  description?: string;
  createdAt: string;
  updatedAt: string;
  unit?: { id: string; name: string };
  academicYear?: { id: string; name: string };
  _count?: { evaluations: number };
}

export interface PKGEvaluation {
  id: string;
  periodId: string;
  teacherId: string;
  assessorId?: string;
  pedagogikScore?: number;
  kepribadianScore?: number;
  sosialScore?: number;
  profesionalScore?: number;
  totalScore?: number;
  grade?: "A" | "B" | "C" | "D" | "E";
  creditPoints?: number;
  recommendation?: "LANJUT" | "PEMBINAAN" | "PKB";
  status: "DRAFT" | "SELF_ASSESSMENT" | "OBSERVATION" | "REVIEW" | "APPROVED";
  selfAssessmentAt?: string;
  observedAt?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  period?: { id: string; name: string };
  teacher?: {
    id: string;
    nip: string;
    user: { name: string; email?: string };
  };
  assessor?: { id: string; name: string };
  details?: PKGDetail[];
  documents?: PKGDocument[];
  _count?: { details: number; documents: number };
}

export interface PKGDetail {
  id: string;
  evaluationId: string;
  competency: "PEDAGOGIK" | "KEPRIBADIAN" | "SOSIAL" | "PROFESIONAL";
  indicator: string;
  indicatorName: string;
  selfScore?: number;
  assessorScore?: number;
  finalScore?: number;
  evidence?: string;
  notes?: string;
}

export interface PKGDocument {
  id: string;
  evaluationId: string;
  name: string;
  type: "RPP" | "SILABUS" | "NILAI" | "SERTIFIKAT" | "KEHADIRAN" | "LAINNYA";
  fileUrl: string;
  fileSize?: number;
  createdAt: string;
}

export interface PKGIndicator {
  code: string;
  name: string;
}

export interface PKGIndicators {
  PEDAGOGIK: PKGIndicator[];
  KEPRIBADIAN: PKGIndicator[];
  SOSIAL: PKGIndicator[];
  PROFESIONAL: PKGIndicator[];
}

export interface PKGStatistics {
  total: number;
  byStatus: Record<string, number>;
  byGrade: Record<string, number>;
  averageScore: number;
  completed: number;
}

// =====================================
// QUERY KEYS
// =====================================

export const pkgKeys = {
  all: ["pkg"] as const,
  indicators: () => [...pkgKeys.all, "indicators"] as const,
  periods: () => [...pkgKeys.all, "periods"] as const,
  periodList: (params: any) => [...pkgKeys.periods(), "list", params] as const,
  periodDetail: (id: string) => [...pkgKeys.periods(), "detail", id] as const,
  evaluations: () => [...pkgKeys.all, "evaluations"] as const,
  evaluationList: (params: any) =>
    [...pkgKeys.evaluations(), "list", params] as const,
  evaluationDetail: (id: string) =>
    [...pkgKeys.evaluations(), "detail", id] as const,
  teacherHistory: (teacherId: string) =>
    [...pkgKeys.all, "teacher", teacherId, "history"] as const,
  statistics: (params: any) => [...pkgKeys.all, "statistics", params] as const,
};

// =====================================
// HOOKS - INDICATORS
// =====================================

export function usePKGIndicators() {
  return useQuery({
    queryKey: pkgKeys.indicators(),
    queryFn: async () => {
      const { data } = await api.get<{ data: PKGIndicators }>(
        "/pkg/indicators",
      );
      return data.data;
    },
    staleTime: Infinity, // Static data
  });
}

// =====================================
// HOOKS - PERIODS
// =====================================

export function usePKGPeriods(params?: {
  unitId?: string;
  academicYearId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: pkgKeys.periodList(params),
    queryFn: async () => {
      const { data } = await api.get<{
        data: PKGPeriod[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>("/pkg/periods", { params });
      return data;
    },
  });
}

export function usePKGPeriod(id: string) {
  return useQuery({
    queryKey: pkgKeys.periodDetail(id),
    queryFn: async () => {
      const { data } = await api.get<{
        data: PKGPeriod & { evaluations: PKGEvaluation[] };
      }>(`/pkg/periods/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreatePKGPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      unitId: string;
      academicYearId: string;
      name: string;
      startDate: string;
      endDate: string;
      description?: string;
    }) => {
      const { data } = await api.post<{ data: PKGPeriod }>(
        "/pkg/periods",
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pkgKeys.periods() });
    },
  });
}

export function useUpdatePKGPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      startDate?: string;
      endDate?: string;
      description?: string;
      status?: string;
    }) => {
      const { data } = await api.put<{ data: PKGPeriod }>(
        `/pkg/periods/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pkgKeys.periods() });
      queryClient.invalidateQueries({
        queryKey: pkgKeys.periodDetail(variables.id),
      });
    },
  });
}

export function useDeletePKGPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/pkg/periods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pkgKeys.periods() });
    },
  });
}

// =====================================
// HOOKS - EVALUATIONS
// =====================================

export function usePKGEvaluations(params?: {
  periodId?: string;
  teacherId?: string;
  unitId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: pkgKeys.evaluationList(params),
    queryFn: async () => {
      const { data } = await api.get<{
        data: PKGEvaluation[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>("/pkg/evaluations", { params });
      return data;
    },
  });
}

export function usePKGEvaluation(id: string) {
  return useQuery({
    queryKey: pkgKeys.evaluationDetail(id),
    queryFn: async () => {
      const { data } = await api.get<{ data: PKGEvaluation }>(
        `/pkg/evaluations/${id}`,
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreatePKGEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      periodId: string;
      teacherId: string;
      assessorId?: string;
    }) => {
      const { data } = await api.post<{ data: PKGEvaluation }>(
        "/pkg/evaluations",
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pkgKeys.evaluations() });
    },
  });
}

export function useCreateBulkEvaluations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { periodId: string; teacherIds: string[] }) => {
      const { data } = await api.post<{ data: PKGEvaluation[] }>(
        "/pkg/evaluations/bulk",
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pkgKeys.evaluations() });
    },
  });
}

export function useSubmitPKGScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      evaluationId,
      scores,
    }: {
      evaluationId: string;
      scores: {
        detailId: string;
        selfScore?: number;
        assessorScore?: number;
        evidence?: string;
        notes?: string;
      }[];
    }) => {
      const { data } = await api.post<{ data: PKGEvaluation }>(
        `/pkg/evaluations/${evaluationId}/scores`,
        { scores },
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pkgKeys.evaluationDetail(variables.evaluationId),
      });
      queryClient.invalidateQueries({ queryKey: pkgKeys.evaluations() });
    },
  });
}

export function useUpdatePKGStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch<{ data: PKGEvaluation }>(
        `/pkg/evaluations/${id}/status`,
        { status },
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pkgKeys.evaluationDetail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: pkgKeys.evaluations() });
    },
  });
}

// =====================================
// HOOKS - DOCUMENTS
// =====================================

export function useAddPKGDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      evaluationId,
      ...payload
    }: {
      evaluationId: string;
      name: string;
      type: string;
      fileUrl: string;
      fileSize?: number;
    }) => {
      const { data } = await api.post<{ data: PKGDocument }>(
        `/pkg/evaluations/${evaluationId}/documents`,
        payload,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pkgKeys.evaluationDetail(variables.evaluationId),
      });
    },
  });
}

export function useDeletePKGDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      evaluationId,
    }: {
      id: string;
      evaluationId: string;
    }) => {
      await api.delete(`/pkg/documents/${id}`);
      return evaluationId;
    },
    onSuccess: (evaluationId) => {
      queryClient.invalidateQueries({
        queryKey: pkgKeys.evaluationDetail(evaluationId),
      });
    },
  });
}

// =====================================
// HOOKS - HISTORY & STATISTICS
// =====================================

export function useTeacherPKGHistory(teacherId: string) {
  return useQuery({
    queryKey: pkgKeys.teacherHistory(teacherId),
    queryFn: async () => {
      const { data } = await api.get<{ data: PKGEvaluation[] }>(
        `/pkg/teachers/${teacherId}/history`,
      );
      return data.data;
    },
    enabled: !!teacherId,
  });
}

export function usePKGStatistics(params?: {
  unitId?: string;
  periodId?: string;
}) {
  return useQuery({
    queryKey: pkgKeys.statistics(params),
    queryFn: async () => {
      const { data } = await api.get<{ data: PKGStatistics }>(
        "/pkg/statistics",
        { params },
      );
      return data.data;
    },
  });
}
