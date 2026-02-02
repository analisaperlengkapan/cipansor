import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface PsychologyTest {
  id: string;
  unitId: string | null;
  name: string;
  type: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  unit?: { id: string; name: string };
}

export interface PsychologyRecord {
  id: string;
  studentId: string;
  testId: string;
  testDate: string;
  score: number | null;
  classification: string | null;
  analysis: string | null;
  details: any;
  attachmentUrl: string | null;
  recordedById: string;
  createdAt: string;
  updatedAt: string;
  student: {
      id: string;
      name: string;
      nis: string;
      enrollments: { class: { name: string } }[]
  };
  test: { id: string; name: string; type: string };
  recordedBy: { id: string; name: string };
}

// --- Tests ---

export function usePsychologyTests(unitId?: string) {
  return useQuery({
    queryKey: ['psychology-tests', unitId],
    queryFn: async () => {
      const res = await api.get('/psychology/tests', { params: { unitId } });
      return res.data.data as PsychologyTest[];
    },
  });
}

export function useCreatePsychologyTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PsychologyTest>) => {
      const res = await api.post('/psychology/tests', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychology-tests'] });
      toast.success('Alat tes berhasil dibuat');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal membuat alat tes');
    },
  });
}

export function useUpdatePsychologyTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PsychologyTest> }) => {
      const res = await api.patch(`/psychology/tests/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychology-tests'] });
      toast.success('Alat tes berhasil diperbarui');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal memperbarui alat tes');
    },
  });
}

export function useDeletePsychologyTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/psychology/tests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychology-tests'] });
      toast.success('Alat tes berhasil dihapus');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menghapus alat tes');
    },
  });
}

// --- Records ---

export interface PsychologyRecordFilters {
    studentId?: string;
    testId?: string;
    startDate?: string;
    endDate?: string;
}

export function usePsychologyRecords(filters: PsychologyRecordFilters = {}) {
  return useQuery({
    queryKey: ['psychology-records', filters],
    queryFn: async () => {
      const res = await api.get('/psychology/records', { params: filters });
      return res.data.data as PsychologyRecord[];
    },
  });
}

export function useCreatePsychologyRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/psychology/records', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychology-records'] });
      toast.success('Data asesmen berhasil disimpan');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menyimpan data asesmen');
    },
  });
}

export function useDeletePsychologyRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/psychology/records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychology-records'] });
      toast.success('Data asesmen berhasil dihapus');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menghapus data asesmen');
    },
  });
}
