import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface EmploymentContract {
  id: string;
  userId: string;
  contractNumber: string;
  type: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'RENEWED';
  documentUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export function useContracts(params?: { unitId?: string; search?: string; status?: string }) {
  return useQuery({
    queryKey: ['contracts', params],
    queryFn: async () => {
      const response = await api.get('/hr/contracts', { params });
      return response.data as {
        data: EmploymentContract[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      };
    },
  });
}

export function useUserContracts(userId: string) {
  return useQuery({
    queryKey: ['user-contracts', userId],
    queryFn: async () => {
      const response = await api.get(`/hr/contracts/user/${userId}`);
      return response.data.data as EmploymentContract[];
    },
    enabled: !!userId,
  });
}

export function useExpiringContracts(days: number = 30) {
  return useQuery({
    queryKey: ['expiring-contracts', days],
    queryFn: async () => {
      const response = await api.get('/hr/contracts/expiring', { params: { days } });
      return response.data.data as EmploymentContract[];
    },
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<EmploymentContract>) => {
      const response = await api.post('/hr/contracts', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['user-contracts'] });
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmploymentContract> }) => {
      const response = await api.patch(`/hr/contracts/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['user-contracts'] });
    },
  });
}
