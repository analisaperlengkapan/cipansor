import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface StrategicPlan {
  id: string;
  unitId: string | null;
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal membuat kegiatan");
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal memperbarui kegiatan");
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menghapus kegiatan");
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal membuat rencana");
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal memperbarui rencana");
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menyetujui rencana");
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menghapus rencana");
    },
  });
};
