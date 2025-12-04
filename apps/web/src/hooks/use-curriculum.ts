import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Types
export type SubjectType = 'REQUIRED' | 'ELECTIVE' | 'EXTRACURRICULAR';
export type ScheduleDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export const SUBJECT_TYPES: SubjectType[] = ['REQUIRED', 'ELECTIVE', 'EXTRACURRICULAR'];
export const SCHEDULE_DAYS: ScheduleDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const SUBJECT_TYPE_LABELS: Record<SubjectType, string> = {
  REQUIRED: 'Wajib',
  ELECTIVE: 'Pilihan',
  EXTRACURRICULAR: 'Ekstrakurikuler',
};

export const SCHEDULE_DAY_LABELS: Record<ScheduleDay, string> = {
  MONDAY: 'Senin',
  TUESDAY: 'Selasa',
  WEDNESDAY: 'Rabu',
  THURSDAY: 'Kamis',
  FRIDAY: 'Jumat',
  SATURDAY: 'Sabtu',
  SUNDAY: 'Minggu',
};

export interface Subject {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: SubjectType;
  credits: number;
  hoursPerWeek: number;
  unitId: string;
  unit?: {
    id: string;
    name: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Curriculum {
  id: string;
  name: string;
  code: string;
  description?: string;
  academicYearId: string;
  academicYear?: {
    id: string;
    name: string;
  };
  unitId: string;
  unit?: {
    id: string;
    name: string;
  };
  gradeLevel: number;
  isActive: boolean;
  subjects?: CurriculumSubject[];
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumSubject {
  id: string;
  curriculumId: string;
  subjectId: string;
  subject?: Subject;
  semester: number;
  sequence: number;
  isRequired: boolean;
}

export interface Schedule {
  id: string;
  classId: string;
  class?: {
    id: string;
    name: string;
  };
  subjectId: string;
  subject?: Subject;
  teacherId: string;
  teacher?: {
    id: string;
    name: string;
  };
  day: ScheduleDay;
  startTime: string;
  endTime: string;
  room?: string;
  notes?: string;
  isActive: boolean;
  academicYearId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  teacher?: {
    id: string;
    name: string;
  };
  subjectId: string;
  subject?: Subject;
  classId: string;
  class?: {
    id: string;
    name: string;
  };
  academicYearId: string;
  academicYear?: {
    id: string;
    name: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Subject queries
export function useSubjects(params?: {
  unitId?: string;
  type?: SubjectType;
  isActive?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: ['subjects', params],
    queryFn: async () => {
      const response = await api.get('/curriculum/subjects', { params });
      return response.data.data as Subject[];
    },
  });
}

export function useSubject(id: string) {
  return useQuery({
    queryKey: ['subject', id],
    queryFn: async () => {
      const response = await api.get(`/curriculum/subjects/${id}`);
      return response.data.data as Subject;
    },
    enabled: !!id,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Subject>) => {
      const response = await api.post('/curriculum/subjects', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Subject> }) => {
      const response = await api.put(`/curriculum/subjects/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/curriculum/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

// Curriculum queries
export function useCurriculums(params?: {
  unitId?: string;
  academicYearId?: string;
  gradeLevel?: number;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: ['curriculums', params],
    queryFn: async () => {
      const response = await api.get('/curriculum/curriculums', { params });
      return response.data.data as Curriculum[];
    },
  });
}

export function useCurriculum(id: string) {
  return useQuery({
    queryKey: ['curriculum', id],
    queryFn: async () => {
      const response = await api.get(`/curriculum/curriculums/${id}`);
      return response.data.data as Curriculum;
    },
    enabled: !!id,
  });
}

export function useCreateCurriculum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Curriculum>) => {
      const response = await api.post('/curriculum/curriculums', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculums'] });
    },
  });
}

export function useUpdateCurriculum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Curriculum> }) => {
      const response = await api.put(`/curriculum/curriculums/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculums'] });
    },
  });
}

export function useDeleteCurriculum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/curriculum/curriculums/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculums'] });
    },
  });
}

export function useAddSubjectToCurriculum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      curriculumId,
      subjectId,
      semester,
      sequence,
      isRequired,
    }: {
      curriculumId: string;
      subjectId: string;
      semester: number;
      sequence: number;
      isRequired: boolean;
    }) => {
      const response = await api.post(`/curriculum/curriculums/${curriculumId}/subjects`, {
        subjectId,
        semester,
        sequence,
        isRequired,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculums'] });
    },
  });
}

export function useRemoveSubjectFromCurriculum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      curriculumId,
      curriculumSubjectId,
    }: {
      curriculumId: string;
      curriculumSubjectId: string;
    }) => {
      await api.delete(`/curriculum/curriculums/${curriculumId}/subjects/${curriculumSubjectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculums'] });
    },
  });
}

// Schedule queries
export function useSchedules(params?: {
  classId?: string;
  teacherId?: string;
  subjectId?: string;
  day?: ScheduleDay;
  academicYearId?: string;
}) {
  return useQuery({
    queryKey: ['schedules', params],
    queryFn: async () => {
      const response = await api.get('/curriculum/schedules', { params });
      return response.data.data as Schedule[];
    },
  });
}

export function useClassSchedule(classId: string, academicYearId?: string) {
  return useQuery({
    queryKey: ['class-schedule', classId, academicYearId],
    queryFn: async () => {
      const response = await api.get(`/curriculum/schedules/class/${classId}`, {
        params: { academicYearId },
      });
      return response.data.data as Schedule[];
    },
    enabled: !!classId,
  });
}

export function useTeacherSchedule(teacherId: string, academicYearId?: string) {
  return useQuery({
    queryKey: ['teacher-schedule', teacherId, academicYearId],
    queryFn: async () => {
      const response = await api.get(`/curriculum/schedules/teacher/${teacherId}`, {
        params: { academicYearId },
      });
      return response.data.data as Schedule[];
    },
    enabled: !!teacherId,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Schedule>) => {
      const response = await api.post('/curriculum/schedules', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['class-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-schedule'] });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Schedule> }) => {
      const response = await api.put(`/curriculum/schedules/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['class-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-schedule'] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/curriculum/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['class-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-schedule'] });
    },
  });
}

// Teacher Assignment queries
export function useTeacherAssignments(params?: {
  teacherId?: string;
  subjectId?: string;
  classId?: string;
  academicYearId?: string;
}) {
  return useQuery({
    queryKey: ['teacher-assignments', params],
    queryFn: async () => {
      const response = await api.get('/curriculum/teacher-assignments', { params });
      return response.data.data as TeacherAssignment[];
    },
  });
}

export function useCreateTeacherAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TeacherAssignment>) => {
      const response = await api.post('/curriculum/teacher-assignments', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
    },
  });
}

export function useDeleteTeacherAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/curriculum/teacher-assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
    },
  });
}
