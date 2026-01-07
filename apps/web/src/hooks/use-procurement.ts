import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  PurchaseRequest,
  CreatePurchaseRequestInput,
  PurchaseRequestStatus
} from '@cipansor/shared';
import { toast } from 'sonner';

export const useProcurement = (unitId?: string, status?: PurchaseRequestStatus) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['procurement', unitId, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (unitId && unitId !== 'all') params.append('unitId', unitId);
      if (status && status !== 'all') params.append('status', status);

      const response = await api.get<{ data: PurchaseRequest[] }>(`/procurement?${params.toString()}`);
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreatePurchaseRequestInput) => {
      const response = await api.post('/procurement', input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement'] });
      toast.success('Purchase Request created successfully');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to create request');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: string; status: PurchaseRequestStatus; rejectionReason?: string }) => {
      const response = await api.patch(`/procurement/${id}/status`, { status, rejectionReason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement'] });
      toast.success('Status updated successfully');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  });

  const fulfillMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/procurement/${id}/fulfill`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement'] });
      toast.success('Request fulfilled, assets created!');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to fulfill request');
    }
  });

  return {
    requests: data?.data || [],
    isLoading,
    error,
    createRequest: createMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    fulfillRequest: fulfillMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateStatusMutation.isPending,
    isFulfilling: fulfillMutation.isPending
  };
};

export const useProcurementDetail = (id: string) => {
  return useQuery({
    queryKey: ['procurement', id],
    queryFn: async () => {
      const response = await api.get<{ data: PurchaseRequest }>(`/procurement/${id}`);
      return response.data.data;
    },
    enabled: !!id
  });
};
