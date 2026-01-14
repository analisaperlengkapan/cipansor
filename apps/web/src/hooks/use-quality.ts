import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  QualityDashboardSummary,
  QualityStandard,
  CreateQualityEvidenceInput
} from '@cipansor/shared';
import { toast } from 'sonner';

export const useQualityDashboard = (unitId: string, academicYearId: string) => {
  return useQuery({
    queryKey: ['quality', 'dashboard', unitId, academicYearId],
    queryFn: async () => {
      const response = await api.get<QualityDashboardSummary[]>(
        '/api/quality/dashboard/summary',
        { params: { unitId, academicYearId } }
      );
      return response.data.data;
    },
    enabled: !!unitId && !!academicYearId
  });
};

export const useQualityStandards = () => {
  return useQuery({
    queryKey: ['quality', 'standards'],
    queryFn: async () => {
      const response = await api.get<QualityStandard[]>('/api/quality/standards');
      return response.data.data;
    }
  });
};

export const useStandardDetails = (id: string, unitId: string, academicYearId: string) => {
  return useQuery({
    queryKey: ['quality', 'standard', id, unitId, academicYearId],
    queryFn: async () => {
      const response = await api.get<QualityStandard>(
        `/api/quality/standards/${id}`,
        { params: { unitId, academicYearId } }
      );
      return response.data.data;
    },
    enabled: !!id && !!unitId && !!academicYearId
  });
};

export const useCreateEvidence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQualityEvidenceInput) => {
      const response = await api.post('/api/quality/evidence', data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Bukti berhasil diunggah');
      queryClient.invalidateQueries({
        queryKey: ['quality', 'standard']
      });
      queryClient.invalidateQueries({
        queryKey: ['quality', 'dashboard', variables.unitId, variables.academicYearId]
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal mengunggah bukti');
    }
  });
};

export const useDeleteEvidence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/quality/evidence/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Bukti berhasil dihapus');
      queryClient.invalidateQueries({
        queryKey: ['quality', 'standard']
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menghapus bukti');
    }
  });
};
