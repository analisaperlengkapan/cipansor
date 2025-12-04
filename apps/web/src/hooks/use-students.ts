import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { PaginatedResponse, ApiResponse } from '@/lib/api';

// Types
export interface Student {
  id: string;
  nis: string;
  nisn?: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  birthPlace: string;
  address: string;
  phone?: string;
  email?: string;
  parentName: string;
  parentPhone: string;
  fatherName?: string;
  motherName?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'DROPPED_OUT';
  enrollmentDate: string;
  unitId: string;
  unit?: {
    id: string;
    name: string;
    type: string;
    code?: string;
  };
  currentClass?: {
    id: string;
    name: string;
    grade: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StudentListParams {
  page?: number;
  limit?: number;
  search?: string;
  unitId?: string;
  status?: string;
  classId?: string;
}

export interface CreateStudentData {
  nis: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  birthPlace: string;
  address: string;
  phone?: string;
  email?: string;
  parentName: string;
  parentPhone: string;
  unitId: string;
  enrollmentDate?: string;
}

export interface UpdateStudentData extends Partial<CreateStudentData> {
  status?: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'DROPPED_OUT';
}

// Hooks
export function useStudents(params: StudentListParams = {}) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Student>>('/students', { params });
      return response.data;
    },
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Student>>(`/students/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateStudentData) => {
      const response = await api.post<ApiResponse<Student>>('/students', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateStudentData }) => {
      const response = await api.put<ApiResponse<Student>>(`/students/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', variables.id] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
