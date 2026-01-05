import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { PaginatedResponse } from '@/lib/api';
import {
  Asset,
  AssetCategory,
  AssetStatus,
  AssetCondition,
  CreateAssetInput,
  UpdateAssetInput,
  InventoryStats,
  CreateAssetMaintenanceInput
} from '@cipansor/shared';

// Re-export shared types/enums for convenience
export { AssetStatus, AssetCondition };
export type { Asset, AssetCategory, InventoryStats };

// Hooks

export function useInventoryCategories() {
  return useQuery({
    queryKey: ['inventory-categories'],
    queryFn: async () => {
      const response = await api.get<{ data: AssetCategory[] }>('/inventory/categories');
      return response.data.data;
    },
  });
}

export function useInventoryItems(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string; // Changed from category string to categoryId
  condition?: AssetCondition;
  status?: AssetStatus;
  unitId?: string;
}) {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: async () => {
      // API returns { success: true, data: [], meta: ... }
      // We need to match PaginatedResponse structure
      const response = await api.get<PaginatedResponse<Asset>>('/inventory', { params });
      return response.data;
    },
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: async () => {
      const response = await api.get<{ data: Asset }>(`/inventory/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssetInput) => {
      const response = await api.post<{ data: Asset }>('/inventory', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'summary'] });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAssetInput;
    }) => {
      const response = await api.put<{ data: Asset }>(`/inventory/${id}`, data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', data.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'summary'] });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'summary'] });
    },
  });
}

export function useInventorySummary(unitId?: string) {
  return useQuery({
    queryKey: ['inventory', 'summary', unitId],
    queryFn: async () => {
      const response = await api.get<{ data: InventoryStats }>(unitId ? `/inventory/stats/${unitId}` : '/inventory/stats');
      return response.data.data;
    },
  });
}

// Maintenance Hooks

export function useCreateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssetMaintenanceInput) => {
      const response = await api.post('/inventory/maintenance', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      // Invalidate specific item if needed
    }
  });
}
