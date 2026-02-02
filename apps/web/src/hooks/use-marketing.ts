import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  MarketingCampaign,
  MarketingStats,
  CreateCampaignInput,
  UpdateCampaignInput,
  LogInteractionInput,
  MarketingInteraction,
} from "@cipansor/shared";

// Stats
export const useMarketingStats = (unitId?: string) => {
  return useQuery({
    queryKey: ["marketing", "stats", unitId],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: MarketingStats;
      }>("/marketing/stats", {
        params: { unitId },
      });
      return data.data;
    },
  });
};

export interface RecentLead {
  id: string;
  fullName: string;
  createdAt: string;
  status: string;
  source: string | null;
  campaign?: {
    name: string;
    code: string;
  } | null;
}

export interface UpcomingFollowUp {
  id: string;
  type: string;
  date: string;
  notes: string | null;
  nextActionDate: string;
  registrant: {
    id: string;
    fullName: string;
    parentPhone: string;
    status: string;
  };
}

export const useRecentLeads = (unitId?: string, limit: number = 5) => {
  return useQuery({
    queryKey: ["marketing", "leads", "recent", unitId, limit],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: RecentLead[] }>(
        "/marketing/leads/recent",
        {
          params: { unitId, limit },
        },
      );
      return data.data;
    },
  });
};

export const useUpcomingFollowUps = (unitId?: string, limit: number = 5) => {
  return useQuery({
    queryKey: ["marketing", "follow-ups", unitId, limit],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: UpcomingFollowUp[];
      }>("/marketing/follow-ups", {
        params: { unitId, limit },
      });
      return data.data;
    },
  });
};

// Campaigns
export const useCampaigns = (unitId?: string) => {
  return useQuery({
    queryKey: ["marketing", "campaigns", unitId],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: MarketingCampaign[];
      }>("/marketing/campaigns", {
        params: { unitId },
      });
      return data.data;
    },
  });
};

export const useCampaign = (id: string) => {
  return useQuery({
    queryKey: ["marketing", "campaigns", id],
    queryFn: async () => {
      if (!code) throw new Error("Code is required");
      const { data } = await api.get<{
        success: boolean;
        data: MarketingCampaign;
      }>(`/marketing/campaigns/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCampaignInput) => {
      const { data: res } = await api.post<{
        success: boolean;
        data: MarketingCampaign;
      }>("/marketing/campaigns", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing", "campaigns"] });
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCampaignInput;
    }) => {
      const { data: res } = await api.patch<{
        success: boolean;
        data: MarketingCampaign;
      }>(`/marketing/campaigns/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["marketing", "campaigns"] });
      queryClient.invalidateQueries({
        queryKey: ["marketing", "campaigns", variables.id],
      });
    },
  });
};

// Public Campaign Lookup
export const usePublicCampaign = (code?: string | null) => {
  return useQuery({
    queryKey: ["marketing", "public", "campaign", code],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: MarketingCampaign;
      }>(`/marketing/public/campaigns/code/${encodeURIComponent(code)}`);
      return data.data;
    },
    enabled: !!code,
    retry: false,
  });
};

// Interactions
export const useInteractions = (registrantId: string) => {
  return useQuery({
    queryKey: ["marketing", "interactions", registrantId],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: MarketingInteraction[];
      }>(`/marketing/interactions/${registrantId}`);
      return data.data;
    },
    enabled: !!registrantId,
  });
};

export const useLogInteraction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: LogInteractionInput) => {
      const { data: res } = await api.post<{
        success: boolean;
        data: MarketingInteraction;
      }>("/marketing/interactions", data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["marketing", "interactions", variables.registrantId],
      });
    },
  });
};
