import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface BehavioralValue {
  id: string;
  name: string;
  description?: string | null;
  weight: number;
  isActive: boolean;
}

export interface PKIndicator {
  id: string;
  pkId: string;
  title: string;
  target: number;
  unit: string;
  weight: number;
  category: "DIRECT" | "INDIRECT" | "NON_CASCADING";
  refIndicatorId?: string | null;
  refStrategicIndicatorId?: string | null;
  notes?: string | null;
  realization: number;
  refIndicator?: { id: string; title: string } | null;
  refStrategicIndicator?: { id: string; name: string } | null;
}

export interface PKIndicatorEvaluation {
  id: string;
  evaluationId: string;
  indicatorId: string;
  realization: number;
  activities?: string | null;
  score: number;
  indicator?: PKIndicator;
}

export interface PKBehaviorEvaluation {
  id: string;
  evaluationId: string;
  behaviorValueId: string;
  score: number;
  notes?: string | null;
  behaviorValue?: BehavioralValue;
}

export interface PKEvaluation {
  id: string;
  pkId: string;
  period: string;
  month: number;
  year: number;
  performanceScore: number;
  behaviorScore: number;
  overallScore: number;
  feedback?: string | null;
  notes?: string | null;
  status: "DRAFT" | "PROPOSED" | "APPROVED";
  indicatorDetails?: PKIndicatorEvaluation[];
  behaviorDetails?: PKBehaviorEvaluation[];
}

export interface PerformanceAgreement {
  id: string;
  userId: string;
  supervisorId?: string | null;
  supervisorPkId?: string | null;
  strategicPlanId?: string | null;
  periodStart: string;
  periodEnd: string;
  status: "DRAFT" | "PROPOSED" | "APPROVED";
  totalScore: number;
  behaviorScore: number;
  overallScore: number;
  notes?: string | null;
  revisionNotes?: string | null;
  approvedAt?: string | null;
  user: { id: string; name: string };
  supervisor?: { id: string; name: string } | null;
  strategicPlan?: { id: string; title: string } | null;
  indicators?: PKIndicator[];
  evaluations?: PKEvaluation[];
}

// ==========================================
// PERFORMANCE AGREEMENTS (PK)
// ==========================================

export const usePKList = (params?: { status?: string }) => {
  return useQuery({
    queryKey: ["performance-agreements", "pks", params],
    queryFn: async () => {
      const res = await api.get("/performance-agreements", { params });
      return res.data.data as PerformanceAgreement[];
    },
  });
};

export const usePKDetail = (id: string) => {
  return useQuery({
    queryKey: ["performance-agreements", "pk", id],
    queryFn: async () => {
      const res = await api.get(`/performance-agreements/${id}`);
      return res.data.data as PerformanceAgreement;
    },
    enabled: !!id,
  });
};

export const useCreatePK = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      userId: string;
      supervisorId?: string;
      supervisorPkId?: string;
      strategicPlanId?: string;
      periodStart: string;
      periodEnd: string;
      notes?: string;
    }) => {
      const res = await api.post("/performance-agreements", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Perjanjian Kinerja berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["performance-agreements"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal membuat Perjanjian Kinerja");
    },
  });
};

export const useUpdatePK = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      notes?: string;
      supervisorId?: string;
      strategicPlanId?: string;
    }) => {
      const res = await api.put(`/performance-agreements/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Perjanjian Kinerja berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["performance-agreements"] });
      queryClient.invalidateQueries({ queryKey: ["performance-agreements", "pk", variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal memperbarui Perjanjian Kinerja");
    },
  });
};

export const useProposePK = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/performance-agreements/${id}/propose`);
      return res.data;
    },
    onSuccess: (_, id) => {
      toast.success("Perjanjian Kinerja berhasil diajukan");
      queryClient.invalidateQueries({ queryKey: ["performance-agreements"] });
      queryClient.invalidateQueries({ queryKey: ["performance-agreements", "pk", id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal mengajukan Perjanjian Kinerja");
    },
  });
};

export const useApprovePK = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/performance-agreements/${id}/approve`);
      return res.data;
    },
    onSuccess: (_, id) => {
      toast.success("Perjanjian Kinerja berhasil disetujui");
      queryClient.invalidateQueries({ queryKey: ["performance-agreements"] });
      queryClient.invalidateQueries({ queryKey: ["performance-agreements", "pk", id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menyetujui Perjanjian Kinerja");
    },
  });
};

export const useRejectPK = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, revisionNotes }: { id: string; revisionNotes: string }) => {
      const res = await api.post(`/performance-agreements/${id}/reject`, { revisionNotes });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Perjanjian Kinerja dikembalikan untuk revisi");
      queryClient.invalidateQueries({ queryKey: ["performance-agreements"] });
      queryClient.invalidateQueries({ queryKey: ["performance-agreements", "pk", variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menolak Perjanjian Kinerja");
    },
  });
};

// ==========================================
// INDICATORS
// ==========================================

export const useCreatePKIndicator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      pkId: string;
      title: string;
      target: number;
      unit: string;
      weight: number;
      category: "DIRECT" | "INDIRECT" | "NON_CASCADING";
      refIndicatorId?: string;
      refStrategicIndicatorId?: string;
      notes?: string;
    }) => {
      const res = await api.post("/performance-agreements/indicators", data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Indikator PK berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: ["performance-agreements"] });
      queryClient.invalidateQueries({ queryKey: ["performance-agreements", "pk", variables.pkId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menambahkan Indikator PK");
    },
  });
};

export const useUpdatePKIndicator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pkId, ...data }: { id: string; pkId: string } & Record<string, any>) => {
      const res = await api.put(`/performance-agreements/indicators/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Indikator PK berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["performance-agreements"] });
      queryClient.invalidateQueries({ queryKey: ["performance-agreements", "pk", variables.pkId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal memperbarui Indikator PK");
    },
  });
};

export const useDeletePKIndicator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pkId }: { id: string; pkId: string }) => {
      const res = await api.delete(`/performance-agreements/indicators/${id}`);
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Indikator PK berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["performance-agreements"] });
      queryClient.invalidateQueries({ queryKey: ["performance-agreements", "pk", variables.pkId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menghapus Indikator PK");
    },
  });
};

// ==========================================
// EVALUATIONS & SAFTI BEHAVIOR
// ==========================================

export const useSupervisors = () => {
  return useQuery({
    queryKey: ["performance-agreements", "supervisors"],
    queryFn: async () => {
      const res = await api.get("/performance-agreements/supervisors");
      return res.data.data as Array<{ id: string; name: string }>;
    },
  });
};

export const useBehavioralValues = () => {
  return useQuery({
    queryKey: ["performance-agreements", "behavioral-values"],
    queryFn: async () => {
      const res = await api.get("/performance-agreements/settings/behavioral-values");
      return res.data.data as BehavioralValue[];
    },
  });
};

export const useEvaluationDetail = (id: string) => {
  return useQuery({
    queryKey: ["performance-agreements", "evaluations", id],
    queryFn: async () => {
      const res = await api.get(`/performance-agreements/evaluations/${id}`);
      return res.data.data as PKEvaluation;
    },
    enabled: !!id,
  });
};

export const useCreateEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { pkId: string; month: number; year: number }) => {
      const res = await api.post("/performance-agreements/evaluations", data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Evaluasi bulanan berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["performance-agreements"] });
      queryClient.invalidateQueries({ queryKey: ["performance-agreements", "pk", variables.pkId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal membuat evaluasi bulanan");
    },
  });
};

export const useUpdateIndicatorRealization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      evaluationId,
      indicatorId,
      realization,
      activities,
    }: {
      evaluationId: string;
      indicatorId: string;
      realization: number;
      activities?: string;
    }) => {
      const res = await api.post(`/performance-agreements/evaluations/${evaluationId}/indicators`, {
        indicatorId,
        realization,
        activities,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Realisasi indikator berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: ["performance-agreements"] });
      queryClient.invalidateQueries({ queryKey: ["performance-agreements", "evaluations", variables.evaluationId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menyimpan realisasi indikator");
    },
  });
};

export const useUpdateBehaviorScore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      evaluationId,
      behaviorValueId,
      score,
      notes,
    }: {
      evaluationId: string;
      behaviorValueId: string;
      score: number;
      notes?: string;
    }) => {
      const res = await api.post(`/performance-agreements/evaluations/${evaluationId}/behavior`, {
        behaviorValueId,
        score,
        notes,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Nilai perilaku berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: ["performance-agreements"] });
      queryClient.invalidateQueries({ queryKey: ["performance-agreements", "evaluations", variables.evaluationId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menyimpan nilai perilaku");
    },
  });
};

export const useApproveEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ evaluationId, feedback }: { evaluationId: string; feedback?: string }) => {
      const res = await api.post(`/performance-agreements/evaluations/${evaluationId}/approve`, {
        feedback,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Evaluasi bulanan berhasil disetujui");
      queryClient.invalidateQueries({ queryKey: ["performance-agreements"] });
      queryClient.invalidateQueries({ queryKey: ["performance-agreements", "evaluations", variables.evaluationId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menyetujui evaluasi bulanan");
    },
  });
};

// ==========================================
// ANALYTICS & EXECUTIVE DASHBOARD
// ==========================================

export const usePerformanceDashboard = () => {
  return useQuery({
    queryKey: ["performance-agreements", "dashboard"],
    queryFn: async () => {
      const res = await api.get("/performance-agreements/dashboard");
      return res.data.data;
    },
  });
};

export const usePerformanceDrilldown = (unitId: string) => {
  return useQuery({
    queryKey: ["performance-agreements", "drilldown", unitId],
    queryFn: async () => {
      const res = await api.get(`/performance-agreements/dashboard/drilldown/${unitId}`);
      return res.data.data;
    },
    enabled: !!unitId,
  });
};

export const usePerformanceConsolidatedReport = () => {
  return useQuery({
    queryKey: ["performance-agreements", "consolidated-report"],
    queryFn: async () => {
      const res = await api.get("/performance-agreements/reports/consolidated");
      return res.data.data;
    },
  });
};
