import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

// Define types locally if needed or import from shared
interface BehaviorRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  category: string;
  description: string;
  date: string;
  points?: number;
  actionTaken?: string;
  witnessedBy?: string;
  createdAt: string;
}

interface CreateBehaviorRecordInput {
  studentId: string;
  behaviorType: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  category: string;
  description: string;
  points?: number;
  actionTaken?: string;
  date: string;
}

export function useBehaviorRecords(params?: any) {
  return useQuery({
    queryKey: ['behavior-records', params],
    queryFn: async () => {
      const response = await api.get('/homeroom/behavior', { params });
      return response.data.data;
    },
  });
}

export function useCreateBehaviorRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBehaviorRecordInput) => {
      const response = await api.post('/homeroom/behavior', data);
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Catatan perilaku berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['behavior-records'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menambahkan catatan');
    },
  });
}
