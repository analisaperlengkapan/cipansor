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
  CreateAssetMaintenanceInput,
  AssetAssignment,
  CreateAssetAssignmentInput,
  ReturnAssetAssignmentInput,
  AssetAudit,
  CreateAssetAuditInput,
  UpdateAssetAuditItemInput,
  AssetAuditItem,
  AssetDepreciation,
  AssetMaintenance,
  CreateMaintenanceRequestInput,
  UpdateAssetMaintenanceInput,
  UpdateMaintenanceStatusInput,
  CreateAssetDisposalInput,
  AssetMaintenanceStatus,
  AssetDisposalReason,
} from '@cipansor/shared';

// Re-export shared types/enums for convenience
export { AssetStatus, AssetCondition, AssetMaintenanceStatus, AssetDisposalReason };
export type {
  Asset,
  AssetCategory,
  InventoryStats,
  AssetAssignment,
  AssetAudit,
  AssetDepreciation,
  AssetMaintenance
};

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
  categoryId?: string;
  condition?: AssetCondition;
  status?: AssetStatus;
  unitId?: string;
}) {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: async () => {
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

export function useMaintenances(params?: {
  page?: number;
  limit?: number;
  itemId?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['inventory-maintenances', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<AssetMaintenance>>('/inventory/maintenance', { params });
      return response.data;
    },
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssetMaintenanceInput) => {
      const response = await api.post('/inventory/maintenance', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-maintenances'] });
    }
  });
}

export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMaintenanceRequestInput) => {
      const response = await api.post('/inventory/maintenance/request', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-maintenances'] });
    }
  });
}

export function useUpdateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAssetMaintenanceInput }) => {
      const response = await api.put(`/inventory/maintenance/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-maintenances'] });
    }
  });
}

export function useUpdateMaintenanceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMaintenanceStatusInput }) => {
      const response = await api.patch(`/inventory/maintenance/${id}/status`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] }); // Might affect asset status
    }
  });
}

// Disposal Hook

export function useDisposeAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateAssetDisposalInput }) => {
      const response = await api.post(`/inventory/${id}/dispose`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.id] });
    }
  });
}

// Assignments Hooks

export function useAssetAssignments(params?: {
  page?: number;
  limit?: number;
  assetId?: string;
  userId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['inventory-assignments', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<AssetAssignment>>('/inventory/assignments', { params });
      return response.data;
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAssetAssignmentInput) => {
      const response = await api.post<{ data: AssetAssignment }>('/inventory/assignments', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-assignments'] });
      if (data.assetId) {
        queryClient.invalidateQueries({ queryKey: ['inventory', data.assetId] });
      }
    },
  });
}

export function useReturnAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReturnAssetAssignmentInput }) => {
      const response = await api.post<{ data: AssetAssignment }>(`/inventory/assignments/${id}/return`, data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-assignments'] });
      if (data.assetId) {
        queryClient.invalidateQueries({ queryKey: ['inventory', data.assetId] });
      }
    },
  });
}

// Audits Hooks

export function useAssetAudits(params?: {
  page?: number;
  limit?: number;
  unitId?: string;
}) {
  return useQuery({
    queryKey: ['inventory-audits', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<AssetAudit>>('/inventory/audits', { params });
      return response.data;
    },
  });
}

export function useCreateAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAssetAuditInput) => {
      const response = await api.post<{ data: AssetAudit }>('/inventory/audits', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-audits'] });
    },
  });
}

export function useAssetAudit(id: string) {
  return useQuery({
    queryKey: ['inventory-audits', id],
    queryFn: async () => {
      const response = await api.get<{ data: AssetAudit }>(`/inventory/audits/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateAuditItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: UpdateAssetAuditItemInput }) => {
      const response = await api.put<{ data: AssetAuditItem }>(`/inventory/audits/items/${itemId}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-audits'] });
    },
  });
}

export function useCompleteAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<{ data: AssetAudit }>(`/inventory/audits/${id}/complete`);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-audits'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-audits', data.id] });
    },
  });
}

// Depreciation Hook

export function useAssetDepreciation(id: string) {
  return useQuery({
    queryKey: ['inventory-depreciation', id],
    queryFn: async () => {
      const response = await api.get<{ data: AssetDepreciation }>(`/inventory/${id}/depreciation`);
      return response.data.data;
    },
    enabled: !!id,
  });
}
