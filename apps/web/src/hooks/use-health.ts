import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { PaginatedResponse } from '@/lib/api';

// Types
export type HealthRecordType = 'CHECKUP' | 'ILLNESS' | 'TREATMENT' | 'VACCINATION' | 'REFERRAL';
export type HealthStatus = 'HEALTHY' | 'SICK' | 'RECOVERING' | 'HOSPITALIZED';

export interface HealthRecord {
  id: string;
  studentId: string;
  recordType: HealthRecordType;
  date: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  notes?: string;
  status: HealthStatus;
  followUpDate?: string;
  referredTo?: string;
  temperature?: number;
  bloodPressure?: string;
  heartRate?: number;
  weight?: number;
  height?: number;
  recordedById: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    name: string;
    nis: string;
    gender: string;
    birthDate?: string;
    class?: { name: string };
    unit?: { name: string };
    dormitory?: { name: string };
  };
  recordedBy?: { name: string };
  createdBy?: { name: string };
}

// Constants
export const HEALTH_RECORD_TYPES: { value: HealthRecordType; label: string }[] = [
  { value: 'CHECKUP', label: 'Pemeriksaan Rutin' },
  { value: 'ILLNESS', label: 'Sakit' },
  { value: 'TREATMENT', label: 'Perawatan' },
  { value: 'VACCINATION', label: 'Vaksinasi' },
  { value: 'REFERRAL', label: 'Rujukan' },
];

export const HEALTH_STATUSES: { value: HealthStatus; label: string; color: string }[] = [
  { value: 'HEALTHY', label: 'Sehat', color: 'bg-green-100 text-green-800' },
  { value: 'SICK', label: 'Sakit', color: 'bg-red-100 text-red-800' },
  { value: 'RECOVERING', label: 'Pemulihan', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'HOSPITALIZED', label: 'Rawat Inap', color: 'bg-purple-100 text-purple-800' },
];

// Health Records Hooks
export function useHealthRecords(params?: {
  page?: number;
  limit?: number;
  studentId?: string;
  recordType?: HealthRecordType;
  status?: HealthStatus;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['health-records', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<HealthRecord>>('/health-records', { params });
      return response.data;
    },
  });
}

export function useHealthRecord(id: string) {
  return useQuery({
    queryKey: ['health-records', id],
    queryFn: async () => {
      const response = await api.get<HealthRecord>(`/health-records/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useStudentHealthRecords(studentId: string) {
  return useQuery({
    queryKey: ['health-records', 'student', studentId],
    queryFn: async () => {
      const response = await api.get<HealthRecord[]>(`/health-records/student/${studentId}`);
      return response.data;
    },
    enabled: !!studentId,
  });
}

export function useCreateHealthRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      studentId: string;
      recordType: HealthRecordType;
      date: string;
      symptoms?: string;
      diagnosis?: string;
      treatment?: string;
      medication?: string;
      notes?: string;
      status: HealthStatus;
      followUpDate?: string;
      referredTo?: string;
      temperature?: number;
      bloodPressure?: string;
      heartRate?: number;
      weight?: number;
      height?: number;
    }) => {
      const response = await api.post<HealthRecord>('/health-records', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
    },
  });
}

export function useUpdateHealthRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        recordType?: HealthRecordType;
        date?: string;
        symptoms?: string;
        diagnosis?: string;
        treatment?: string;
        medication?: string;
        notes?: string;
        status?: HealthStatus;
        followUpDate?: string;
        referredTo?: string;
        temperature?: number;
        bloodPressure?: string;
        heartRate?: number;
        weight?: number;
        height?: number;
      };
    }) => {
      const response = await api.put<HealthRecord>(`/health-records/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
    },
  });
}

export function useDeleteHealthRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/health-records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
    },
  });
}

// Health Summary Hook
export function useHealthSummary(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['health-records', 'summary', params],
    queryFn: async () => {
      const response = await api.get<{
        totalRecords: number;
        byType: { recordType: HealthRecordType; count: number }[];
        byStatus: { status: HealthStatus; count: number }[];
        currentlySick: number;
        needFollowUp: number;
      }>('/health-records/summary', { params });
      return response.data;
    },
  });
}

// Get students who need follow-up
export function useHealthFollowUps() {
  return useQuery({
    queryKey: ['health-records', 'follow-ups'],
    queryFn: async () => {
      const response = await api.get<HealthRecord[]>('/health-records/follow-ups');
      return response.data;
    },
  });
}

// Get currently sick students
export function useCurrentlySickStudents() {
  return useQuery({
    queryKey: ['health-records', 'sick'],
    queryFn: async () => {
      const response = await api.get<HealthRecord[]>('/health-records/sick');
      return response.data;
    },
  });
}
