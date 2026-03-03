import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface StrategicPlan {
  id: string;
  unitId: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  budget?: number;
  progress: number;
  createdBy: { id: string; name: string };
  approvedBy?: { id: string; name: string };
  objectives: PlanObjective[];
}

export interface PlanObjective {
  id: string;
  title: string;
  priority: string;
  weight: number;
  progress: number;
  indicators: PlanIndicator[];
  activities: PlanActivity[];
}

export interface PlanIndicator {
  id: string;
  name: string;
  unit: string;
  targetValue: number;
  currentValue: number;
}

export interface PlanActivity {
  id: string;
  title: string;
  status: string;
  pic?: { id: string; name: string };
}

export const usePlans = (params?: { type?: string; status?: string }) => {
  return useQuery({
    queryKey: ["perencanaan", params],
    queryFn: async () => {
      const res = await api.get("/api/perencanaan", { params });
      return res.data.data as StrategicPlan[];
    },
  });
};

export const usePlan = (id: string) => {
  return useQuery({
    queryKey: ["perencanaan", id],
    queryFn: async () => {
      const res = await api.get(`/api/perencanaan/${id}`);
      return res.data.data as StrategicPlan;
    },
    enabled: !!id,
  });
};

export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/api/perencanaan", data);
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
      const res = await api.put(`/api/perencanaan/${id}`, data);
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
      const res = await api.post(`/api/perencanaan/${id}/approve`);
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
      const res = await api.delete(`/api/perencanaan/${id}`);
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
