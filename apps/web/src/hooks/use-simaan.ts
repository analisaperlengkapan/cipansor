import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Types
export interface SimaanExam {
  id: string;
  studentId: string;
  examDate: string;
  examType: 'JUZ_30' | 'JUZ_1_15' | 'JUZ_16_30' | 'FULL_30_JUZ' | 'CUSTOM';
  startJuz?: number;
  endJuz?: number;
  startSurah?: string;
  endSurah?: string;
  duration: number; // in minutes
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  overallGrade?: number;
  hafalanGrade?: number;
  tajwidGrade?: number;
  fashahahGrade?: number;
  notes?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    nis: string;
    photoUrl?: string;
    user?: {
      name: string;
    };
  };
  examiners?: SimaanExaminer[];
  _count?: {
    examiners: number;
  };
}

export interface SimaanExaminer {
  id: string;
  simaanExamId: string;
  examinerId: string;
  role: 'MAIN' | 'ASSISTANT';
  grade?: number;
  notes?: string;
  examiner?: {
    id: string;
    user?: {
      name: string;
    };
  };
}

export interface SimaanFilters {
  page?: number;
  limit?: number;
  search?: string;
  studentId?: string;
  examType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  classId?: string;
  unitId?: string;
}

export interface CreateSimaanData {
  studentId: string;
  examDate: string;
  examType: string;
  startJuz?: number;
  endJuz?: number;
  startSurah?: string;
  endSurah?: string;
  duration?: number;
  notes?: string;
  examinerIds?: string[];
}

export interface UpdateSimaanData extends Partial<CreateSimaanData> {
  status?: string;
  overallGrade?: number;
  hafalanGrade?: number;
  tajwidGrade?: number;
  fashahahGrade?: number;
}

export interface AddExaminerData {
  examinerId: string;
  role: 'MAIN' | 'ASSISTANT';
}

export interface UpdateExaminerScoreData {
visibleExaminerId: string;
  grade: number;
  notes?: string;
}

// Query Keys
export const simaanKeys = {
  all: ['simaan'] as const,
  lists: () => [...simaanKeys.all, 'list'] as const,
  list: (filters: SimaanFilters) => [...simaanKeys.lists(), filters] as const,
  details: () => [...simaanKeys.all, 'detail'] as const,
  detail: (id: string) => [...simaanKeys.details(), id] as const,
  byStudent: (studentId: string, filters?: Omit<SimaanFilters, 'studentId'>) =>
    [...simaanKeys.all, 'student', studentId, filters] as const,
  examiners: (simaanId: string) => [...simaanKeys.all, 'examiners', simaanId] as const,
  upcoming: () => [...simaanKeys.all, 'upcoming'] as const,
};

// Hooks

// Get simaan exams list
export function useSimaanExams(filters: SimaanFilters = {}) {
  return useQuery({
    queryKey: simaanKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
      const response = await apiClient.get(`/simaan?${params.toString()}`);
      return response.data;
    },
  });
}

// Get single simaan exam
export function useSimaanExam(id: string) {
  return useQuery({
    queryKey: simaanKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get(`/simaan/${id}`);
      return response.data.data as SimaanExam;
    },
    enabled: !!id,
  });
}

// Get simaan exams by student
export function useStudentSimaan(
  studentId: string,
  filters?: Omit<SimaanFilters, 'studentId'>
) {
  return useQuery({
    queryKey: simaanKeys.byStudent(studentId, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      const response = await apiClient.get(
        `/simaan/student/${studentId}?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!studentId,
  });
}

// Get simaan examiners
export function useSimaanExaminers(simaanId: string) {
  return useQuery({
    queryKey: simaanKeys.examiners(simaanId),
    queryFn: async () => {
      const response = await apiClient.get(`/simaan/${simaanId}/examiners`);
      return response.data;
    },
    enabled: !!simaanId,
  });
}

// Get upcoming simaan
export function useUpcomingSimaan() {
  return useQuery({
    queryKey: simaanKeys.upcoming(),
    queryFn: async () => {
      const response = await apiClient.get('/simaan/upcoming');
      return response.data;
    },
  });
}

// Create simaan exam
export function useCreateSimaan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSimaanData) => {
      const response = await apiClient.post('/simaan', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: simaanKeys.all });
    },
  });
}

// Update simaan exam
export function useUpdateSimaan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSimaanData }) => {
      const response = await apiClient.put(`/simaan/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: simaanKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: simaanKeys.lists() });
    },
  });
}

// Delete simaan exam
export function useDeleteSimaan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/simaan/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: simaanKeys.all });
    },
  });
}

// Add examiner to simaan
export function useAddSimaanExaminer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ simaanId, data }: { simaanId: string; data: AddExaminerData }) => {
      const response = await apiClient.post(`/simaan/${simaanId}/examiners`, data);
      return response.data;
    },
    onSuccess: (_, { simaanId }) => {
      queryClient.invalidateQueries({ queryKey: simaanKeys.examiners(simaanId) });
      queryClient.invalidateQueries({ queryKey: simaanKeys.detail(simaanId) });
    },
  });
}

// Remove examiner from simaan
export function useRemoveSimaanExaminer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ simaanId, examinerId }: { simaanId: string; examinerId: string }) => {
      const response = await apiClient.delete(`/simaan/${simaanId}/examiners/${examinerId}`);
      return response.data;
    },
    onSuccess: (_, { simaanId }) => {
      queryClient.invalidateQueries({ queryKey: simaanKeys.examiners(simaanId) });
      queryClient.invalidateQueries({ queryKey: simaanKeys.detail(simaanId) });
    },
  });
}

// Update examiner score
export function useUpdateExaminerScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      simaanId,
      examinerId,
      data,
    }: {
      simaanId: string;
      examinerId: string;
      data: { grade: number; notes?: string };
    }) => {
      const response = await apiClient.patch(
        `/simaan/${simaanId}/examiners/${examinerId}/score`,
        data
      );
      return response.data;
    },
    onSuccess: (_, { simaanId }) => {
      queryClient.invalidateQueries({ queryKey: simaanKeys.examiners(simaanId) });
      queryClient.invalidateQueries({ queryKey: simaanKeys.detail(simaanId) });
    },
  });
}

// Start simaan exam
export function useStartSimaan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch(`/simaan/${id}/start`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: simaanKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: simaanKeys.lists() });
    },
  });
}

// Complete simaan exam
export function useCompleteSimaan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        overallGrade: number;
        hafalanGrade?: number;
        tajwidGrade?: number;
        fashahahGrade?: number;
        notes?: string;
      };
    }) => {
      const response = await apiClient.patch(`/simaan/${id}/complete`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: simaanKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: simaanKeys.lists() });
    },
  });
}

// Cancel simaan exam
export function useCancelSimaan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await apiClient.patch(`/simaan/${id}/cancel`, { reason });
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: simaanKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: simaanKeys.lists() });
    },
  });
}
