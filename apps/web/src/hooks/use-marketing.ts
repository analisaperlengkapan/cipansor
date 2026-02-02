import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MarketingCampaign, MarketingInteraction } from '@cipansor/shared';

interface CampaignStats {
  totalRegistrants: number;
  conversionRate: number;
  channelDistribution: Record<string, number>;
}

export function useMarketingCampaigns(unitId?: string) {
  return useQuery({
    queryKey: ['marketing-campaigns', unitId],
    queryFn: async () => {
      const { data } = await api.get<MarketingCampaign[]>('/marketing/campaigns', {
        params: { unitId },
      });
      return data;
    },
  });
}

export function useMarketingCampaign(id: string) {
  return useQuery({
    queryKey: ['marketing-campaign', id],
    queryFn: async () => {
      const { data } = await api.get<MarketingCampaign>(`/marketing/campaigns/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<MarketingCampaign>) => {
      const { data } = await api.post<MarketingCampaign>('/marketing/campaigns', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<MarketingCampaign> & { id: string }) => {
      const { data } = await api.patch<MarketingCampaign>(`/marketing/campaigns/${id}`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-campaign', variables.id] });
    },
  });
}

export function useCampaignStats(id: string) {
  return useQuery({
    queryKey: ['marketing-campaign-stats', id],
    queryFn: async () => {
      const { data } = await api.get<CampaignStats>(`/marketing/campaigns/${id}/stats`);
      return data;
    },
    enabled: !!id,
  });
}

// Public hooks for landing pages
export function usePublicCampaign(code: string | null) {
  return useQuery({
    queryKey: ['public-campaign', code],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: MarketingCampaign;
      }>(`/marketing/public/campaigns/code/${encodeURIComponent(code || "")}`);
      return data.data;
    },
    enabled: !!code,
  });
}

export function useRecordInteraction() {
  return useMutation({
    mutationFn: async (payload: {
      registrantId: string;
      type: string;
      notes?: string;
      nextActionDate?: Date;
    }) => {
      const { data } = await api.post<MarketingInteraction>('/marketing/interactions', payload);
      return data;
    },
  });
}
