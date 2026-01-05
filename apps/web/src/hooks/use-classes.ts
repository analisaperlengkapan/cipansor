import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { PaginatedResponse, ApiResponse } from '@/lib/api';
import type { Class, CreateClassInput, UpdateClassInput, ClassEnrollment } from '@cipansor/shared';

export interface ClassListParams {
  page?: number;
  limit?: number;
  search?: string;
  unitId?: string;
  grade?: number;
  academicYearId?: string;
}

// Ensure the local type usage aligns with shared type or just use shared type directly.
// The shared 'Class' type is what we want.
// We remove the local 'Class', 'CreateClassData', 'UpdateClassData', 'Enrollment' interfaces.

export function useClasses(params: ClassListParams = {}) {
  return useQuery({
    queryKey: ['classes', params],
    queryFn: async () => {
      // The API returns PaginatedResponse<Class> where Class is the shared type
      const response = await api.get<PaginatedResponse<Class>>('/classes', { params });
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useClass(id: string) {
  return useQuery({
    queryKey: ['classes', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Class>>(`/classes/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useClassEnrollments(classId: string) {
  return useQuery({
    queryKey: ['classes', classId, 'enrollments'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ClassEnrollment[]>>(`/classes/${classId}/enrollments`);
      return response.data.data;
    },
    enabled: !!classId,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClassInput) => {
      const response = await api.post<ApiResponse<Class>>('/classes', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClassInput }) => {
      const response = await api.put<ApiResponse<Class>>(`/classes/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['classes', variables.id] });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useEnrollStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
      // The API expects { studentId } as body.
      const response = await api.post<ApiResponse<ClassEnrollment>>(`/classes/${classId}/enrollments`, {
        studentId,
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classes', variables.classId, 'enrollments'] });
    },
  });
}

export function useUnenrollStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
      await api.delete(`/classes/${classId}/enrollments/${studentId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classes', variables.classId, 'enrollments'] });
    },
  });
}
