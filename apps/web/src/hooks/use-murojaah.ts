import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Types
export interface MurojaahRecord {
  id: string;
  studentId: string;
  teacherId: string;
  date: string;
  surahId: string;
  surahName: string;
  startAyat: number;
  endAyat: number;
  repetitions: number;
  status: 'PENDING' | 'REVIEWED' | 'PASSED' | 'NEED_IMPROVEMENT';
  grade?: number;
  notes?: string;
  reviewedAt?: string;
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
  teacher?: {
    id: string;
    user?: {
      name: string;
    };
  };
  mistakes?: MurojaahMistake[];
}

export interface MurojaahMistake {
  id: string;
  murojaahId: string;
  ayatNumber: number;
  mistakeType: 'TAJWID' | 'MAKHROJ' | 'HARAKAT' | 'WAQF' | 'LAFAZ' | 'OTHER';
  description?: string;
  createdAt: string;
}

export interface MurojaahFilters {
  page?: number;
  limit?: number;
  search?: string;
  studentId?: string;
  teacherId?: string;
  surahId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  classId?: string;
  unitId?: string;
}

export interface CreateMurojaahData {
  studentId: string;
  teacherId: string;
  date: string;
  surahId: string;
  surahName: string;
  startAyat: number;
  endAyat: number;
  repetitions?: number;
  status?: string;
  notes?: string;
}

export interface UpdateMurojaahData extends Partial<CreateMurojaahData> {
  grade?: number;
  reviewedAt?: string;
}

export interface AddMistakeData {
  ayatNumber: number;
  mistakeType: string;
  description?: string;
}

export interface StudentMurojaahSummary {
  studentId: string;
  studentName: string;
  totalRecords: number;
  passedRecords: number;
  pendingRecords: number;
  averageGrade: number;
  surahsCompleted: string[];
  lastActivity?: string;
}

// Query Keys
export const murojaahKeys = {
  all: ['murojaah'] as const,
  lists: () => [...murojaahKeys.all, 'list'] as const,
  list: (filters: MurojaahFilters) => [...murojaahKeys.lists(), filters] as const,
  details: () => [...murojaahKeys.all, 'detail'] as const,
  detail: (id: string) => [...murojaahKeys.details(), id] as const,
  byStudent: (studentId: string, filters?: Omit<MurojaahFilters, 'studentId'>) =>
    [...murojaahKeys.all, 'student', studentId, filters] as const,
  mistakes: (murojaahId: string) => [...murojaahKeys.all, 'mistakes', murojaahId] as const,
  summary: (studentId: string) => [...murojaahKeys.all, 'summary', studentId] as const,
  classSummary: (classId: string) => [...murojaahKeys.all, 'class-summary', classId] as const,
};

// Hooks

// Get murojaah records list
export function useMurojaahRecords(filters: MurojaahFilters = {}) {
  return useQuery({
    queryKey: murojaahKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
      const response = await apiClient.get(`/murojaah?${params.toString()}`);
      return response.data;
    },
  });
}

// Get single murojaah record
export function useMurojaah(id: string) {
  return useQuery({
    queryKey: murojaahKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get(`/murojaah/${id}`);
      return response.data.data as MurojaahRecord;
    },
    enabled: !!id,
  });
}

// Get murojaah records by student
export function useStudentMurojaah(
  studentId: string,
  filters?: Omit<MurojaahFilters, 'studentId'>
) {
  return useQuery({
    queryKey: murojaahKeys.byStudent(studentId, filters),
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
        `/murojaah/student/${studentId}?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!studentId,
  });
}

// Get murojaah mistakes
export function useMurojaahMistakes(murojaahId: string) {
  return useQuery({
    queryKey: murojaahKeys.mistakes(murojaahId),
    queryFn: async () => {
      const response = await apiClient.get(`/murojaah/${murojaahId}/mistakes`);
      return response.data;
    },
    enabled: !!murojaahId,
  });
}

// Get student murojaah summary
export function useStudentMurojaahSummary(studentId: string) {
  return useQuery({
    queryKey: murojaahKeys.summary(studentId),
    queryFn: async () => {
      const response = await apiClient.get(`/murojaah/student/${studentId}/summary`);
      return response.data.data as StudentMurojaahSummary;
    },
    enabled: !!studentId,
  });
}

// Get class murojaah summary
export function useClassMurojaahSummary(classId: string) {
  return useQuery({
    queryKey: murojaahKeys.classSummary(classId),
    queryFn: async () => {
      const response = await apiClient.get(`/murojaah/class/${classId}/summary`);
      return response.data;
    },
    enabled: !!classId,
  });
}

// Create murojaah record
export function useCreateMurojaah() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMurojaahData) => {
      const response = await apiClient.post('/murojaah', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: murojaahKeys.all });
    },
  });
}

// Update murojaah record
export function useUpdateMurojaah() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMurojaahData }) => {
      const response = await apiClient.put(`/murojaah/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: murojaahKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: murojaahKeys.lists() });
    },
  });
}

// Delete murojaah record
export function useDeleteMurojaah() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/murojaah/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: murojaahKeys.all });
    },
  });
}

// Add mistake to murojaah
export function useAddMurojaahMistake() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ murojaahId, data }: { murojaahId: string; data: AddMistakeData }) => {
      const response = await apiClient.post(`/murojaah/${murojaahId}/mistakes`, data);
      return response.data;
    },
    onSuccess: (_, { murojaahId }) => {
      queryClient.invalidateQueries({ queryKey: murojaahKeys.mistakes(murojaahId) });
      queryClient.invalidateQueries({ queryKey: murojaahKeys.detail(murojaahId) });
    },
  });
}

// Delete mistake
export function useDeleteMurojaahMistake() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ murojaahId, mistakeId }: { murojaahId: string; mistakeId: string }) => {
      const response = await apiClient.delete(`/murojaah/${murojaahId}/mistakes/${mistakeId}`);
      return response.data;
    },
    onSuccess: (_, { murojaahId }) => {
      queryClient.invalidateQueries({ queryKey: murojaahKeys.mistakes(murojaahId) });
      queryClient.invalidateQueries({ queryKey: murojaahKeys.detail(murojaahId) });
    },
  });
}

// Review murojaah (update status and grade)
export function useReviewMurojaah() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      grade,
      notes,
    }: {
      id: string;
      status: string;
      grade?: number;
      notes?: string;
    }) => {
      const response = await apiClient.patch(`/murojaah/${id}/review`, {
        status,
        grade,
        notes,
        reviewedAt: new Date().toISOString(),
      });
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: murojaahKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: murojaahKeys.lists() });
    },
  });
}
