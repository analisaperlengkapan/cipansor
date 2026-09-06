import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

/**
 * The API wraps every failure as `{ success: false, error: { code, message } }`.
 * Every handler below read `data.message`, one level too shallow, so a precise
 * server-side refusal ("RKA unit harus menginduk pada RKA Yayasan…") surfaced
 * as the generic fallback and the user was never told what to change.
 */
type ApiErrorShape = {
  response?: { data?: { error?: { message?: string }; message?: string } };
};

function apiMessage(error: ApiErrorShape): string | undefined {
  return error?.response?.data?.error?.message ?? error?.response?.data?.message;
}

/**
 * Human labels for the plan enums. These used to live only in the list page's
 * filter dropdown while the badges rendered the raw enum, so the same document
 * read "Berjalan" in one control and "IN_PROGRESS" two inches away.
 */
export const PLAN_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  PROPOSED: "Diajukan",
  APPROVED: "Disetujui",
  IN_PROGRESS: "Berjalan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const PLAN_TYPE_LABEL: Record<string, string> = {
  RPJP: "RPJP",
  RENSTRA: "Renstra",
  RKA: "RKA",
};

/**
 * The annual document exists at two tiers, and every place that names a plan
 * must say which — a consolidated "RKA Yayasan" and a school's "RKA SMP IT"
 * are different documents that both used to render as the bare word "RKA".
 */
export function planTierLabel(plan: {
  type: string;
  unitId?: string | null;
  unit?: { name: string } | null;
}): string {
  const base = PLAN_TYPE_LABEL[plan.type] ?? plan.type;
  if (plan.type !== "RKA") return `${base} Yayasan`;
  return plan.unitId ? `${base} ${plan.unit?.name ?? "Unit"}` : `${base} Yayasan`;
}

export interface StrategicPlan {
  id: string;
  /// Null for yayasan-level documents (RPJP, Renstra, RKA Yayasan).
  unitId: string | null;
  unit?: { id: string; name: string } | null;
  parentId?: string | null;
  parent?: { id: string; title: string; type: string } | null;
  title: string;
  description?: string;
  vision?: string | null;
  mission?: string | null;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  budget?: number;
  progress: number;
  totalBudget?: number;
  totalRealization?: number;
  financialProgress?: number;
  createdBy: { id: string; name: string };
  approvedBy?: { id: string; name: string };
  objectives: PlanObjective[];
  fundingSources?: PlanFundingSource[];
}

export interface PlanObjective {
  id: string;
  title: string;
  description?: string;
  perspective: string;
  priority: string;
  weight: number;
  progress: number;
  totalBudget?: number;
  totalRealization?: number;
  financialProgress?: number;
  indicators: PlanIndicator[];
  activities: PlanActivity[];
}

export interface PlanIndicatorTarget {
  id: string;
  period: string;
  order: number;
  targetValue: number;
  actualValue?: number | null;
}

export interface PlanIndicator {
  id: string;
  name: string;
  unit: string;
  level?: string | null;
  baseline?: number | null;
  targetValue: number;
  currentValue: number;
  definition?: string | null;
  formula?: string | null;
  dataSource?: string | null;
  frequency?: string | null;
  picRole?: string | null;
  targets?: PlanIndicatorTarget[];
}

export interface PlanActivityBudgetItem {
  id: string;
  order: number;
  description: string;
  volume: number;
  unit: string;
  unitPrice?: number | null;
  amount?: number | null;
}

export interface PlanFundingSource {
  id: string;
  order: number;
  name: string;
  basis?: string | null;
  amount?: number | null;
}

export interface PlanActivity {
  id: string;
  kind?: string;
  code?: string | null;
  parentId?: string | null;
  title: string;
  description?: string;
  status: string;
  priority: string;
  startDate?: string;
  endDate?: string;
  scheduleMonths?: number[];
  budget?: number;
  budgetId?: string;
  realization?: number;
  budgetRel?: {
    id: string;
    amount: number;
    account: { code: string; name: string };
  };
  pic?: { id: string; name: string };
  indicators?: PlanIndicator[];
  budgetItems?: PlanActivityBudgetItem[];
  children?: PlanActivity[];
}

export const usePlans = (params?: { type?: string; status?: string }) => {
  return useQuery({
    queryKey: ["perencanaan", params],
    queryFn: async () => {
      const res = await api.get("/perencanaan", { params });
      return res.data.data as StrategicPlan[];
    },
  });
};

/**
 * Membuat Sasaran Strategis.
 *
 * Sebelum ini tidak ada sama sekali di frontend: tombol "+ Tambah Sasaran" di
 * halaman dokumen adalah tombol mati tanpa penangan klik, padahal rute
 * POST /perencanaan/objectives sudah tersedia. Akibatnya Sasaran — tingkat DI
 * ATAS Kegiatan dalam kaskade RPJP → Renstra → RKA — hanya bisa lahir dari
 * seed, dan rantai perencanaannya tidak pernah bisa disusun lewat aplikasi.
 */
export const useCreateObjective = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      planId: string;
      title: string;
      description?: string;
      priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      weight?: number;
      perspective?: "FINANCIAL" | "CUSTOMER" | "PROCESS" | "LEARNING";
    }) => {
      const res = await api.post("/perencanaan/objectives", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Sasaran strategis berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["perencanaan"] });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(
        error.response?.data?.error?.message ||
          apiMessage(error) ||
          "Gagal membuat sasaran strategis"
      );
    },
  });
};

export const useCreateActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/perencanaan/activities", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Kegiatan berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["perencanaan"] });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(apiMessage(error) || "Gagal membuat kegiatan");
    },
  });
};

export const useUpdateActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & any) => {
      const res = await api.put(`/perencanaan/activities/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Kegiatan berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["perencanaan"] });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(apiMessage(error) || "Gagal memperbarui kegiatan");
    },
  });
};

export const useDeleteActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/perencanaan/activities/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Kegiatan berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["perencanaan"] });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(apiMessage(error) || "Gagal menghapus kegiatan");
    },
  });
};

export const usePlan = (id: string) => {
  return useQuery({
    queryKey: ["perencanaan", id],
    queryFn: async () => {
      const res = await api.get(`/perencanaan/${id}`);
      return res.data.data as StrategicPlan;
    },
    enabled: !!id,
  });
};

export interface PlanRealizationTrend {
  planId: string;
  trend: { month: string; realization: number }[];
}

/** Monthly realization trend (GET /perencanaan/:id/realization-trend). */
export const usePlanRealizationTrend = (id: string) => {
  return useQuery({
    queryKey: ["perencanaan", id, "realization-trend"],
    queryFn: async () => {
      const { data: res } = await api.get<{ data: PlanRealizationTrend }>(
        `/perencanaan/${id}/realization-trend`,
      );
      return res.data;
    },
    enabled: !!id,
  });
};

export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/perencanaan", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Rencana berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["perencanaan"] });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(apiMessage(error) || "Gagal membuat rencana");
    },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & any) => {
      const res = await api.put(`/perencanaan/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Rencana berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["perencanaan"] });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(apiMessage(error) || "Gagal memperbarui rencana");
    },
  });
};

export const useApprovePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/perencanaan/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Rencana berhasil disetujui");
      queryClient.invalidateQueries({ queryKey: ["perencanaan"] });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(apiMessage(error) || "Gagal menyetujui rencana");
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/perencanaan/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Rencana berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["perencanaan"] });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(apiMessage(error) || "Gagal menghapus rencana");
    },
  });
};
