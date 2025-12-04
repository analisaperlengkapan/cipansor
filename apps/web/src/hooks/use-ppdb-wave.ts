import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Types
export type WaveStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'COMPLETED';

export interface AdmissionWave {
  id: string;
  name: string;
  periodId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  quota: number;
  registeredCount: number;
  registrationFee: number;
  status: WaveStatus;
  requirements: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  period?: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    name: string;
  };
  _count?: {
    registrants: number;
  };
}

export interface WaveRegistrant {
  id: string;
  waveId: string;
  studentId: string | null;
  registrationNumber: string;
  studentName: string;
  birthDate: string;
  gender: string;
  parentName: string;
  parentPhone: string;
  address: string;
  previousSchool: string | null;
  status: RegistrantStatus;
  registrationDate: string;
  notes: string | null;
  documents: string[];
  testScore: number | null;
  interviewScore: number | null;
  finalScore: number | null;
  createdAt: string;
  updatedAt: string;
  wave?: AdmissionWave;
  student?: {
    id: string;
    name: string;
    nis: string;
  };
}

export type RegistrantStatus = 
  | 'REGISTERED'
  | 'DOCUMENT_REVIEW'
  | 'DOCUMENT_APPROVED'
  | 'DOCUMENT_REJECTED'
  | 'TEST_SCHEDULED'
  | 'TEST_COMPLETED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_COMPLETED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'ENROLLED';

export interface WaveStats {
  totalWaves: number;
  openWaves: number;
  totalRegistrants: number;
  acceptedRegistrants: number;
  pendingRegistrants: number;
  totalQuota: number;
  usedQuota: number;
}

// Constants
export const WAVE_STATUSES: { value: WaveStatus; label: string; color: string }[] = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'OPEN', label: 'Dibuka', color: 'bg-green-100 text-green-800' },
  { value: 'CLOSED', label: 'Ditutup', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'COMPLETED', label: 'Selesai', color: 'bg-blue-100 text-blue-800' },
];

export const REGISTRANT_STATUSES: { value: RegistrantStatus; label: string; color: string }[] = [
  { value: 'REGISTERED', label: 'Terdaftar', color: 'bg-blue-100 text-blue-800' },
  { value: 'DOCUMENT_REVIEW', label: 'Review Dokumen', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'DOCUMENT_APPROVED', label: 'Dokumen Disetujui', color: 'bg-green-100 text-green-800' },
  { value: 'DOCUMENT_REJECTED', label: 'Dokumen Ditolak', color: 'bg-red-100 text-red-800' },
  { value: 'TEST_SCHEDULED', label: 'Tes Dijadwalkan', color: 'bg-purple-100 text-purple-800' },
  { value: 'TEST_COMPLETED', label: 'Tes Selesai', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Wawancara Dijadwalkan', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'INTERVIEW_COMPLETED', label: 'Wawancara Selesai', color: 'bg-teal-100 text-teal-800' },
  { value: 'ACCEPTED', label: 'Diterima', color: 'bg-green-100 text-green-800' },
  { value: 'REJECTED', label: 'Ditolak', color: 'bg-red-100 text-red-800' },
  { value: 'ENROLLED', label: 'Terdaftar Siswa', color: 'bg-emerald-100 text-emerald-800' },
];

// API Functions
const waveApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: WaveStatus;
    unitId?: string;
    periodId?: string;
  }) => {
    const response = await api.get('/ppdb-waves', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/ppdb-waves/${id}`);
    return response.data;
  },

  getOpen: async (params?: { unitId?: string }) => {
    const response = await api.get('/ppdb-waves/open', { params });
    return response.data;
  },

  create: async (data: Partial<AdmissionWave>) => {
    const response = await api.post('/ppdb-waves', data);
    return response.data;
  },

  update: async ({ id, ...data }: Partial<AdmissionWave> & { id: string }) => {
    const response = await api.put(`/ppdb-waves/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/ppdb-waves/${id}`);
    return response.data;
  },

  updateStatus: async ({ id, status }: { id: string; status: WaveStatus }) => {
    const response = await api.patch(`/ppdb-waves/${id}/status`, { status });
    return response.data;
  },

  // Registrants
  getRegistrants: async (waveId: string, params?: {
    page?: number;
    limit?: number;
    status?: RegistrantStatus;
    search?: string;
  }) => {
    const response = await api.get(`/ppdb-waves/${waveId}/registrants`, { params });
    return response.data;
  },

  createRegistrant: async ({ waveId, ...data }: Partial<WaveRegistrant> & { waveId: string }) => {
    const response = await api.post(`/ppdb-waves/${waveId}/registrants`, data);
    return response.data;
  },

  updateRegistrant: async ({ waveId, id, ...data }: Partial<WaveRegistrant> & { waveId: string; id: string }) => {
    const response = await api.put(`/ppdb-waves/${waveId}/registrants/${id}`, data);
    return response.data;
  },

  updateRegistrantStatus: async ({ waveId, id, status, notes }: {
    waveId: string;
    id: string;
    status: RegistrantStatus;
    notes?: string;
  }) => {
    const response = await api.patch(`/ppdb-waves/${waveId}/registrants/${id}/status`, { status, notes });
    return response.data;
  },

  updateRegistrantScores: async ({ waveId, id, testScore, interviewScore }: {
    waveId: string;
    id: string;
    testScore?: number;
    interviewScore?: number;
  }) => {
    const response = await api.patch(`/ppdb-waves/${waveId}/registrants/${id}/scores`, {
      testScore,
      interviewScore,
    });
    return response.data;
  },

  getStats: async (params?: { unitId?: string; periodId?: string }) => {
    const response = await api.get('/ppdb-waves/stats', { params });
    return response.data;
  },
};

// Hooks
export function useWaves(params?: {
  page?: number;
  limit?: number;
  status?: WaveStatus;
  unitId?: string;
  periodId?: string;
}) {
  return useQuery({
    queryKey: ['waves', params],
    queryFn: () => waveApi.getAll(params),
  });
}

export function useWave(id: string) {
  return useQuery({
    queryKey: ['wave', id],
    queryFn: () => waveApi.getById(id),
    enabled: !!id,
  });
}

export function useOpenWaves(unitId?: string) {
  return useQuery({
    queryKey: ['waves', 'open', unitId],
    queryFn: () => waveApi.getOpen({ unitId }),
  });
}

export function useCreateWave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: waveApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waves'] });
    },
  });
}

export function useUpdateWave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: waveApi.update,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['waves'] });
      queryClient.invalidateQueries({ queryKey: ['wave', variables.id] });
    },
  });
}

export function useDeleteWave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: waveApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waves'] });
    },
  });
}

export function useUpdateWaveStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: waveApi.updateStatus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['waves'] });
      queryClient.invalidateQueries({ queryKey: ['wave', variables.id] });
    },
  });
}

// Registrant Hooks
export function useWaveRegistrants(waveId: string, params?: {
  page?: number;
  limit?: number;
  status?: RegistrantStatus;
  search?: string;
}) {
  return useQuery({
    queryKey: ['wave-registrants', waveId, params],
    queryFn: () => waveApi.getRegistrants(waveId, params),
    enabled: !!waveId,
  });
}

export function useCreateRegistrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: waveApi.createRegistrant,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wave-registrants', variables.waveId] });
      queryClient.invalidateQueries({ queryKey: ['wave', variables.waveId] });
      queryClient.invalidateQueries({ queryKey: ['waves'] });
    },
  });
}

export function useUpdateRegistrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: waveApi.updateRegistrant,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wave-registrants', variables.waveId] });
    },
  });
}

export function useUpdateRegistrantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: waveApi.updateRegistrantStatus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wave-registrants', variables.waveId] });
      queryClient.invalidateQueries({ queryKey: ['wave', variables.waveId] });
    },
  });
}

export function useUpdateRegistrantScores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: waveApi.updateRegistrantScores,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wave-registrants', variables.waveId] });
    },
  });
}

export function useWaveStats(params?: { unitId?: string; periodId?: string }) {
  return useQuery({
    queryKey: ['wave-stats', params],
    queryFn: () => waveApi.getStats(params),
  });
}

// Utility Functions
export function formatRegistrationFee(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function calculateQuotaPercentage(registered: number, quota: number): number {
  if (quota === 0) return 0;
  return Math.round((registered / quota) * 100);
}

export function getNextStatus(currentStatus: RegistrantStatus): RegistrantStatus | null {
  const statusFlow: Record<RegistrantStatus, RegistrantStatus | null> = {
    REGISTERED: 'DOCUMENT_REVIEW',
    DOCUMENT_REVIEW: 'DOCUMENT_APPROVED',
    DOCUMENT_APPROVED: 'TEST_SCHEDULED',
    DOCUMENT_REJECTED: null,
    TEST_SCHEDULED: 'TEST_COMPLETED',
    TEST_COMPLETED: 'INTERVIEW_SCHEDULED',
    INTERVIEW_SCHEDULED: 'INTERVIEW_COMPLETED',
    INTERVIEW_COMPLETED: 'ACCEPTED',
    ACCEPTED: 'ENROLLED',
    REJECTED: null,
    ENROLLED: null,
  };
  return statusFlow[currentStatus];
}
