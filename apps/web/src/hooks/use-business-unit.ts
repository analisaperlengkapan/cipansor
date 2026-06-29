import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BusinessUnitType } from "@prisma/client";

export interface BusinessUnit {
  id: string;
  unitId: string;
  name: string;
  code: string;
  type: BusinessUnitType;
  description?: string;
  managerId?: string;
  isActive: boolean;
  unit?: { id: string; name: string };
  _count?: {
    canteenItems: number;
    canteenTransactions: number;
    laundryTransactions: number;
  };
}

export interface BusinessPerformance {
  revenue: number;
  transactionCount: number;
}

export interface BusinessEfficiency {
  unitId: string;
  type: BusinessUnitType;
  overallEfficiency: number;
  metrics?: any;
  topItems?: any[];
  lowItems?: any[];
  message?: string;
}

export const useBusinessUnits = (params?: { unitId?: string; type?: BusinessUnitType; isActive?: boolean }) => {
  return useQuery({
    queryKey: ["business-units", params],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: BusinessUnit[] }>("/business-units", { params });
      return data.data;
    },
  });
};

export const useBusinessUnit = (id: string) => {
  return useQuery({
    queryKey: ["business-units", id],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: BusinessUnit }>(`/business-units/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useBusinessEfficiency = (id: string) => {
  return useQuery({
    queryKey: ["business-units", id, "efficiency"],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: BusinessEfficiency }>(`/business-units/${id}/efficiency`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateBusinessUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<BusinessUnit>) => {
      const { data: res } = await api.post("/business-units", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-units"] });
    },
  });
};
