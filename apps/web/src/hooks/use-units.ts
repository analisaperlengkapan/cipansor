import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { ApiResponse } from '@/lib/api';

export interface Unit {
  id: string;
  name: string;
  type: 'PESANTREN' | 'SD_IT' | 'SMP_IT' | 'SMA_IT' | 'MA';
  address?: string;
  phone?: string;
  email?: string;
  headName?: string;
  createdAt: string;
  updatedAt: string;
}

export type UnitType = Unit['type'];

export const UNIT_TYPES: { value: UnitType; label: string }[] = [
  { value: 'PESANTREN', label: 'Pesantren' },
  { value: 'SD_IT', label: 'SD IT' },
  { value: 'SMP_IT', label: 'SMP IT' },
  { value: 'SMA_IT', label: 'SMA IT' },
  { value: 'MA', label: 'MA (Madrasah Aliyah)' },
];

interface UseUnitsParams {
  page?: number;
  limit?: number;
}

export function useUnits(params?: UseUnitsParams) {
  return useQuery({
    queryKey: ['units', params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Unit[]>>('/units', { params });
      return response.data.data;
    },
  });
}

// Hook to get current user's unit based on stored unitId
export function useCurrentUnit() {
  const unitId = typeof window !== 'undefined' 
    ? localStorage.getItem('unitId') 
    : null;
    
  return useQuery({
    queryKey: ['units', unitId],
    queryFn: async () => {
      if (!unitId) return null;
      const response = await api.get<ApiResponse<Unit>>(`/units/${unitId}`);
      return response.data.data;
    },
    enabled: !!unitId,
  });
}

export function useUnit(id: string) {
  return useQuery({
    queryKey: ['units', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Unit>>(`/units/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export interface CreateUnitData {
  name: string;
  type: UnitType;
  address?: string;
  phone?: string;
  email?: string;
  headName?: string;
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateUnitData) => {
      const response = await api.post<ApiResponse<Unit>>('/units', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateUnitData> }) => {
      const response = await api.patch<ApiResponse<Unit>>(`/units/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['units', variables.id] });
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/units/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}
