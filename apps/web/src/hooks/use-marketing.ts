
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MarketingCampaign, MarketingInteraction } from '@cipansor/shared';

// Stats
export const useMarketingStats = (unitId?: string) => {
  return useQuery({
    queryKey: ['marketing', 'stats', unitId],
    queryFn: async () => {
      const { data } = await api.get('/marketing/stats', {
        params: { unitId },
      });
      return data.data; // Assuming response wrapper
    },
  });
};

// Recent Leads
export const useRecentLeads = (unitId?: string, limit = 5) => {
  return useQuery({
    queryKey: ['marketing', 'leads', 'recent', unitId],
    queryFn: async () => {
      const { data } = await api.get('/marketing/leads/recent', {
        params: { unitId, limit },
      });
      return data.data;
    },
  });
};

// Campaigns
export const useCampaigns = (unitId?: string) => {
  return useQuery({
    queryKey: ['marketing', 'campaigns', unitId],
    queryFn: async () => {
      const { data } = await api.get('/marketing/campaigns', {
        params: { unitId },
      });
      return data.data;
    },
  });
};

export const useCampaign = (id: string) => {
  return useQuery({
    queryKey: ['marketing', 'campaigns', id],
    queryFn: async () => {
      const { data } = await api.get(`/marketing/campaigns/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<MarketingCampaign>) => {
      const { data } = await api.post('/marketing/campaigns', input);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'campaigns'] });
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<MarketingCampaign> & { id: string }) => {
      const { data } = await api.patch(`/marketing/campaigns/${id}`, input);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['marketing', 'campaigns', data.id] });
    },
  });
};

// Interactions
export const useInteractions = (registrantId: string) => {
  return useQuery({
    queryKey: ['marketing', 'interactions', registrantId],
    queryFn: async () => {
      const { data } = await api.get(`/marketing/interactions/${registrantId}`);
      return data.data;
    },
    enabled: !!registrantId,
  });
};

export const useLogInteraction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<MarketingInteraction> & { registrantId: string }) => {
      const { data } = await api.post('/marketing/interactions', input);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['marketing', 'interactions', variables.registrantId],
      });
      queryClient.invalidateQueries({ queryKey: ['marketing', 'follow-ups'] });
    },
  });
};

// Follow-ups
export const useUpcomingFollowUps = (unitId?: string, limit = 5) => {
  return useQuery({
    queryKey: ['marketing', 'follow-ups', unitId],
    queryFn: async () => {
      const { data } = await api.get('/marketing/follow-ups', {
        params: { unitId, limit },
      });
      return data.data;
    },
  });
};

// Public Campaign Info
export const usePublicCampaign = (code?: string | null) => {
  return useQuery<{
    success: boolean;
    data: MarketingCampaign;
  }>({
    queryKey: ['marketing', 'public', code],
    queryFn: async () => {
      if (!code) throw new Error('Code is required');
      const { data } = await api.get<{
        success: boolean;
        data: MarketingCampaign;
      }>(`/marketing/public/campaigns/code/${encodeURIComponent(code)}`);
      return data; // Usually public endpoints might not have standard wrapper, but if so: data.data
    },
    enabled: !!code,
  });
};
