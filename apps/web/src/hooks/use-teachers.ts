import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { ApiResponse, User, PaginatedResponse } from '@/lib/api';

// ==================== TYPES ====================

export interface Teacher {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  nip?: string;
  nuptk?: string;
  unitId: string;
  unit?: {
    id: string;
    name: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  employmentType?: 'PERMANENT' | 'CONTRACT' | 'PART_TIME';
  specialization?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherSubject {
  id: string;
  teacherId: string;
  subjectId: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  classId?: string;
  class?: {
    id: string;
    name: string;
    level: string;
  };
  academicYearId: string;
  academicYear?: {
    id: string;
    name: string;
  };
  isActive: boolean;
}

export interface TeacherSchedule {
  id: string;
  teacherId: string;
  subjectId: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  classId: string;
  class: {
    id: string;
    name: string;
    level: string;
  };
  dayOfWeek: number; // 0-6
  startTime: string;
  endTime: string;
  room?: string;
  academicYearId: string;
}

export interface TeacherStats {
  totalClasses: number;
  totalSubjects: number;
  weeklyHours: number;
  totalStudents: number;
  attendanceRate?: number;
}

// ==================== QUERY PARAMS ====================

interface UseTeachersParams {
  unitId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  search?: string;
  page?: number;
  limit?: number;
}

// ==================== HOOKS ====================

/**
 * Get list of teachers (from users with TEACHER role)
 */
export function useTeachers(params?: UseTeachersParams) {
  return useQuery({
    queryKey: ['teachers', params],
    queryFn: async () => {
      const queryParams = { 
        role: 'TEACHER', 
        ...params 
      };
      const response = await api.get<ApiResponse<User[]>>('/users', { params: queryParams });
      return response.data.data;
    },
  });
}

/**
 * Get paginated list of teachers
 */
export function useTeachersPaginated(params?: UseTeachersParams) {
  return useQuery({
    queryKey: ['teachers', 'paginated', params],
    queryFn: async () => {
      const queryParams = { 
        role: 'TEACHER', 
        ...params 
      };
      const response = await api.get<PaginatedResponse<User>>('/users', { params: queryParams });
      return response.data;
    },
  });
}

/**
 * Get single teacher details
 */
export function useTeacher(teacherId: string) {
  return useQuery({
    queryKey: ['teachers', teacherId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Teacher>>(`/hr/teachers/${teacherId}`);
      return response.data.data;
    },
    enabled: !!teacherId,
  });
}

// NOTE: For teacher subjects and schedule, use the hooks from use-curriculum.ts:
// - useTeacherSubjects (from use-curriculum)
// - useTeacherSchedule (from use-curriculum)


/**
 * Get teacher's statistics/summary
 */
export function useTeacherStats(teacherId: string, academicYearId?: string) {
  return useQuery({
    queryKey: ['teachers', teacherId, 'stats', academicYearId],
    queryFn: async () => {
      const params = academicYearId ? { academicYearId } : undefined;
      const response = await api.get<ApiResponse<TeacherStats>>(
        `/curriculum/teachers/${teacherId}/stats`,
        { params }
      );
      return response.data.data;
    },
    enabled: !!teacherId,
  });
}

/**
 * Get teacher's teaching history (PKG)
 */
export function useTeacherHistory(teacherId: string) {
  return useQuery({
    queryKey: ['teachers', teacherId, 'history'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>(`/pkg/teachers/${teacherId}/history`);
      return response.data.data;
    },
    enabled: !!teacherId,
  });
}

// ==================== MUTATIONS ====================

interface CreateTeacherInput {
  userId: string;
  unitId: string;
  nip?: string;
  nuptk?: string;
  specialization?: string;
  bio?: string;
}

interface UpdateTeacherInput {
  nip?: string;
  nuptk?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  employmentType?: 'PERMANENT' | 'CONTRACT' | 'PART_TIME';
  specialization?: string;
  bio?: string;
}

/**
 * Create new teacher record
 */
export function useCreateTeacher() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateTeacherInput) => {
      const response = await api.post<ApiResponse<Teacher>>('/hr/teachers', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}

/**
 * Update teacher record
 */
export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teacherId, data }: { teacherId: string; data: UpdateTeacherInput }) => {
      const response = await api.put<ApiResponse<Teacher>>(`/hr/teachers/${teacherId}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teachers', variables.teacherId] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}

/**
 * Assign subject to teacher
 */
export function useAssignTeacherSubject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      teacherId, 
      subjectId, 
      classId,
      academicYearId 
    }: { 
      teacherId: string; 
      subjectId: string;
      classId?: string;
      academicYearId: string;
    }) => {
      const response = await api.post<ApiResponse<TeacherSubject>>(
        `/curriculum/teachers/${teacherId}/subjects`,
        { subjectId, classId, academicYearId }
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teachers', variables.teacherId, 'subjects'] });
    },
  });
}

/**
 * Remove subject assignment from teacher
 */
export function useRemoveTeacherSubject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teacherId, assignmentId }: { teacherId: string; assignmentId: string }) => {
      await api.delete(`/curriculum/teachers/${teacherId}/subjects/${assignmentId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teachers', variables.teacherId, 'subjects'] });
    },
  });
}

// ==================== UTILITY HOOKS ====================

/**
 * Get teachers by subject (teachers who teach a specific subject)
 */
export function useTeachersBySubject(subjectId: string) {
  return useQuery({
    queryKey: ['teachers', 'by-subject', subjectId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Teacher[]>>('/curriculum/subject-teachers', {
        params: { subjectId }
      });
      return response.data.data;
    },
    enabled: !!subjectId,
  });
}

/**
 * Get teachers by class (homeroom and subject teachers)
 */
export function useTeachersByClass(classId: string) {
  return useQuery({
    queryKey: ['teachers', 'by-class', classId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ homeroom?: Teacher; subjects: TeacherSubject[] }>>(
        `/classes/${classId}/teachers`
      );
      return response.data.data;
    },
    enabled: !!classId,
  });
}

/**
 * Search teachers with autocomplete
 */
export function useTeacherSearch(query: string, unitId?: string) {
  return useQuery({
    queryKey: ['teachers', 'search', query, unitId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<User[]>>('/users', {
        params: {
          role: 'TEACHER',
          search: query,
          unitId,
          limit: 10,
        }
      });
      return response.data.data;
    },
    enabled: query.length >= 2,
  });
}
