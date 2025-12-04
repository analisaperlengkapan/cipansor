import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { PaginatedResponse, ApiResponse } from '@/lib/api';

export interface Class {
  id: string;
  name: string;
  grade: number;
  section?: string;
  schedule?: string;
  maxStudents?: number;
  academicYearId: string;
  academicYear?: {
    id: string;
    name: string;
    isActive: boolean;
  };
  unitId: string;
  unit?: {
    id: string;
    name: string;
  };
  homeroomTeacherId?: string;
  homeroomTeacher?: {
    id: string;
    name: string;
  };
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClassListParams {
  page?: number;
  limit?: number;
  search?: string;
  unitId?: string;
  grade?: number;
  academicYearId?: string;
}

export interface CreateClassData {
  name: string;
  grade: number;
  section?: string;
  schedule?: string;
  maxStudents?: number;
  academicYearId: string;
  unitId: string;
  homeroomTeacherId?: string;
}

export interface UpdateClassData extends Partial<CreateClassData> {}

export interface Enrollment {
  id: string;
  studentId: string;
  student: {
    id: string;
    nis: string;
    name: string;
    gender: string;
  };
  classId: string;
  enrolledAt: string;
}

export function useClasses(params: ClassListParams = {}) {
  return useQuery({
    queryKey: ['classes', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Class>>('/classes', { params });
      return response.data;
    },
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
      const response = await api.get<ApiResponse<Enrollment[]>>(`/classes/${classId}/enrollments`);
      return response.data.data;
    },
    enabled: !!classId,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateClassData) => {
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
    mutationFn: async ({ id, data }: { id: string; data: UpdateClassData }) => {
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
      const response = await api.post<ApiResponse<Enrollment>>(`/classes/${classId}/enrollments`, {
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
