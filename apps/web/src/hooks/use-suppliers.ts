import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Supplier, CreateSupplierInput, UpdateSupplierInput } from '@cipansor/shared';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function useSuppliers(params?: { search?: string; category?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append('search', params.search);
      if (params?.category) searchParams.append('category', params.category);
      if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive));

      const { data } = await api.get(`/suppliers?${searchParams.toString()}`);
      return data.data as Supplier[];
    },
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const { data } = await api.get(`/suppliers/${id}`);
      return data.data as Supplier;
    },
    enabled: !!id,
  });
}

export function useSupplierMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const create = useMutation({
    mutationFn: async (data: CreateSupplierInput) => {
      const res = await api.post('/suppliers', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier created successfully');
      router.push('/procurement/suppliers');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create supplier');
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSupplierInput }) => {
      const res = await api.put(`/suppliers/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier'] });
      toast.success('Supplier updated successfully');
      router.push('/procurement/suppliers');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update supplier');
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete supplier');
    },
  });

  return { create, update, remove };
}
