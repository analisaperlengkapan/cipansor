import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export interface BusinessUnit {
  id: string;
  unitId: string;
  name: string;
  code: string;
  type: "CANTEEN" | "LAUNDRY" | "COOPERATIVE" | "BOOKSTORE" | "OTHER";
  description?: string;
  isActive: boolean;
  managerId?: string;
  unit?: {
    id: string;
    name: string;
  };
  _count?: {
    canteenItems: number;
    canteenTransactions: number;
    laundryTransactions: number;
  };
}

export function useBusinessUnits(params: { unitId?: string; type?: string; isActive?: boolean } = {}) {
  return useQuery({
    queryKey: ["business-units", params],
    queryFn: async () => {
      const response = await api.get("/business-unit", { params });
      return response.data.data as BusinessUnit[];
    },
  });
}

export function useBusinessUnit(id: string) {
  return useQuery({
    queryKey: ["business-units", id],
    queryFn: async () => {
      const response = await api.get(`/business-unit/${id}`);
      return response.data.data as BusinessUnit;
    },
    enabled: !!id,
  });
}

export function useBusinessUnitPerformance(id: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["business-units", id, "performance", { startDate, endDate }],
    queryFn: async () => {
      const response = await api.get(`/business-unit/${id}/performance`, {
        params: { startDate, endDate },
      });
      return response.data.data as { revenue: number; transactionCount: number };
    },
    enabled: !!id && !!startDate && !!endDate,
  });
}

export function useCreateBusinessUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/business-unit", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-units"] });
      toast.success("Unit usaha berhasil dibuat");
    },
  });
}

export function useUpdateBusinessUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/business-unit/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-units"] });
      toast.success("Unit usaha berhasil diperbarui");
    },
  });
}
