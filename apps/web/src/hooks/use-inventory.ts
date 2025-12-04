import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { PaginatedResponse } from '@/lib/api';

// Types
export type ItemCategory = 'ELECTRONICS' | 'FURNITURE' | 'STATIONERY' | 'KITCHEN' | 'CLEANING' | 'SPORTS' | 'OTHER';
export type ItemCondition = 'GOOD' | 'FAIR' | 'POOR' | 'BROKEN';
export type ItemStatus = 'AVAILABLE' | 'IN_USE' | 'UNDER_REPAIR' | 'DISPOSED';

export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: ItemCategory;
  description?: string;
  quantity: number;
  condition: ItemCondition;
  status: ItemStatus;
  location?: string;
  unitId?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  unit?: { id: string; name: string };
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  reason?: string;
  performedById: string;
  createdAt: string;
  item?: InventoryItem;
  performedBy?: { name: string };
}

// Constants
export const ITEM_CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'ELECTRONICS', label: 'Elektronik' },
  { value: 'FURNITURE', label: 'Furnitur' },
  { value: 'STATIONERY', label: 'Alat Tulis' },
  { value: 'KITCHEN', label: 'Peralatan Dapur' },
  { value: 'CLEANING', label: 'Alat Kebersihan' },
  { value: 'SPORTS', label: 'Olahraga' },
  { value: 'OTHER', label: 'Lainnya' },
];

export const ITEM_CONDITIONS: { value: ItemCondition; label: string; color: string }[] = [
  { value: 'GOOD', label: 'Baik', color: 'bg-green-100 text-green-800' },
  { value: 'FAIR', label: 'Cukup', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'POOR', label: 'Kurang', color: 'bg-orange-100 text-orange-800' },
  { value: 'BROKEN', label: 'Rusak', color: 'bg-red-100 text-red-800' },
];

export const ITEM_STATUSES: { value: ItemStatus; label: string; color: string }[] = [
  { value: 'AVAILABLE', label: 'Tersedia', color: 'bg-green-100 text-green-800' },
  { value: 'IN_USE', label: 'Digunakan', color: 'bg-blue-100 text-blue-800' },
  { value: 'UNDER_REPAIR', label: 'Dalam Perbaikan', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'DISPOSED', label: 'Dihapuskan', color: 'bg-gray-100 text-gray-800' },
];

// Inventory Items Hooks
export function useInventoryItems(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: ItemCategory;
  condition?: ItemCondition;
  status?: ItemStatus;
  unitId?: string;
}) {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<InventoryItem>>('/inventory', { params });
      return response.data;
    },
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: async () => {
      const response = await api.get<InventoryItem>(`/inventory/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      code: string;
      category: ItemCategory;
      description?: string;
      quantity: number;
      condition: ItemCondition;
      status?: ItemStatus;
      location?: string;
      unitId?: string;
      purchaseDate?: string;
      purchasePrice?: number;
      warrantyExpiry?: string;
      notes?: string;
    }) => {
      const response = await api.post<InventoryItem>('/inventory', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
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
      data: Partial<{
        name: string;
        code: string;
        category: ItemCategory;
        description: string;
        quantity: number;
        condition: ItemCondition;
        status: ItemStatus;
        location: string;
        unitId: string;
        purchaseDate: string;
        purchasePrice: number;
        warrantyExpiry: string;
        notes: string;
      }>;
    }) => {
      const response = await api.put<InventoryItem>(`/inventory/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
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
    },
  });
}

// Inventory Transactions Hooks
export function useInventoryTransactions(params?: {
  page?: number;
  limit?: number;
  itemId?: string;
  type?: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
}) {
  return useQuery({
    queryKey: ['inventory-transactions', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<InventoryTransaction>>('/inventory/transactions', { params });
      return response.data;
    },
  });
}

export function useCreateInventoryTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      itemId: string;
      type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
      quantity: number;
      fromLocation?: string;
      toLocation?: string;
      reason?: string;
    }) => {
      const response = await api.post<InventoryTransaction>('/inventory/transactions', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
    },
  });
}

// Inventory Summary Hook
export function useInventorySummary() {
  return useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: async () => {
      const response = await api.get<{
        totalItems: number;
        totalQuantity: number;
        totalValue: number;
        byCategory: { category: ItemCategory; count: number; quantity: number }[];
        byCondition: { condition: ItemCondition; count: number }[];
        byStatus: { status: ItemStatus; count: number }[];
        lowStock: InventoryItem[];
      }>('/inventory/summary');
      return response.data;
    },
  });
}
