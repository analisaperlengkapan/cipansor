import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LeadStatus } from "@cipansor/shared";

export type { LeadStatus };

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source?: string;
  status: LeadStatus;
  interest?: string;
  notes?: string;
  campaignId?: string;
  campaign?: {
    id: string;
    name: string;
    code: string;
  };
  registrantId?: string;
  registrant?: {
    id: string;
    registrationNo: string;
    status: string;
  };
  assignedToId?: string;
  assignedTo?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const useLeads = (params?: {
  page?: number;
  limit?: number;
  status?: LeadStatus;
  campaignId?: string;
  search?: string;
  unitId?: string;
}) => {
  return useQuery({
    queryKey: ["marketing", "leads", params],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: Lead[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>("/marketing/leads", { params });
      return data;
    },
  });
};

export const useLeadInteractions = (leadId: string) => {
  return useQuery({
    queryKey: ["marketing", "interactions", leadId],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: any[] }>(`/marketing/interactions`, { params: { leadId } });
      return data.data;
    },
    enabled: !!leadId,
  });
};

export const useLead = (id: string) => {
  return useQuery({
    queryKey: ["marketing", "leads", id],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Lead }>(`/marketing/leads/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Lead>) => {
      const { data: res } = await api.post<{ success: boolean; data: Lead }>("/marketing/leads", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing", "leads"] });
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      const { data: res } = await api.patch<{ success: boolean; data: Lead }>(`/marketing/leads/${id}`, data);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["marketing", "leads"] });
      queryClient.invalidateQueries({ queryKey: ["marketing", "leads", id] });
    },
  });
};

export const useConvertLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: res } = await api.post<{ success: boolean; data: any }>(`/marketing/leads/${id}/convert`, data);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["marketing", "leads"] });
      queryClient.invalidateQueries({ queryKey: ["marketing", "leads", id] });
    },
  });
};
