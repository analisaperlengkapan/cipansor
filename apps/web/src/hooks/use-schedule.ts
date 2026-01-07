import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Schedule,
  CreateScheduleInput,
  UpdateScheduleInput,
  ScheduleQuery,
  ScheduleResponse
} from '@cipansor/shared';
import { toast } from 'sonner';

// Define error type
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const useSchedules = (params?: ScheduleQuery) => {
  return useQuery<ScheduleResponse>({
    queryKey: ['schedules', params],
    queryFn: async () => {
      const { data } = await api.get('/curriculum/schedules', { params });
      return data;
    },
  });
};

export const useClassSchedule = (classId: string) => {
  return useQuery<Schedule[]>({
    queryKey: ['schedules', 'class', classId],
    queryFn: async () => {
      const { data } = await api.get(`/curriculum/classes/${classId}/schedule`);
      return data;
    },
    enabled: !!classId,
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateScheduleInput) => {
      const response = await api.post('/curriculum/schedules', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Jadwal berhasil ditambahkan');
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menambahkan jadwal');
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateScheduleInput }) => {
      const response = await api.patch(`/curriculum/schedules/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Jadwal berhasil diperbarui');
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat memperbarui jadwal');
    },
  });
};

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/curriculum/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Jadwal berhasil dihapus');
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menghapus jadwal');
    },
  });
};
