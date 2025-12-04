import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Types
export type AssessmentType = 'DAILY' | 'WEEKLY' | 'MIDTERM' | 'FINAL' | 'PRACTICAL' | 'PROJECT' | 'QUIZ';
export type GradeType = 'LETTER' | 'NUMERIC' | 'PERCENTAGE';

export const ASSESSMENT_TYPES: AssessmentType[] = ['DAILY', 'WEEKLY', 'MIDTERM', 'FINAL', 'PRACTICAL', 'PROJECT', 'QUIZ'];
export const GRADE_TYPES: GradeType[] = ['LETTER', 'NUMERIC', 'PERCENTAGE'];

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  DAILY: 'Harian',
  WEEKLY: 'Mingguan',
  MIDTERM: 'UTS',
  FINAL: 'UAS',
  PRACTICAL: 'Praktik',
  PROJECT: 'Proyek',
  QUIZ: 'Kuis',
};

export const GRADE_TYPE_LABELS: Record<GradeType, string> = {
  LETTER: 'Huruf',
  NUMERIC: 'Angka',
  PERCENTAGE: 'Persentase',
};

export interface Assessment {
  id: string;
  name: string;
  description?: string;
  type: AssessmentType;
  subjectId: string;
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  classId: string;
  class?: {
    id: string;
    name: string;
  };
  teacherId: string;
  teacher?: {
    id: string;
    name: string;
  };
  academicYearId: string;
  academicYear?: {
    id: string;
    name: string;
  };
  semester: number;
  date: string;
  maxScore: number;
  passingScore?: number;
  weight: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  assessmentId: string;
  assessment?: Assessment;
  studentId: string;
  student?: {
    id: string;
    name: string;
    nis: string;
  };
  score: number;
  letterGrade?: string;
  notes?: string;
  gradedById?: string;
  gradedBy?: {
    id: string;
    name: string;
  };
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportCard {
  id: string;
  studentId: string;
  student?: {
    id: string;
    name: string;
    nis: string;
    nisn?: string;
  };
  classId: string;
  class?: {
    id: string;
    name: string;
    teacher?: {
      id: string;
      name: string;
    };
  };
  academicYearId: string;
  academicYear?: {
    id: string;
    name: string;
  };
  semester: number;
  subjects: ReportCardSubject[];
  totalScore: number;
  averageScore: number;
  rank?: number;
  totalStudents?: number;
  attendance?: {
    present: number;
    sick: number;
    permitted: number;
    absent: number;
  };
  attendancePercentage?: number;
  teacherNotes?: string;
  principalNotes?: string;
  isPublished: boolean;
  publishedAt?: string;
  printedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportCardSubject {
  id?: string;
  subjectId: string;
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  subjectName?: string;
  subjectCode?: string;
  dailyScore?: number;
  midtermScore?: number;
  knowledgeScore?: number;
  skillScore?: number;
  finalScore: number;
  practicalScore?: number;
  finalGrade?: number;
  letterGrade?: string;
  notes?: string;
  teacherNotes?: string;
}

export interface GradeStats {
  assessmentId: string;
  totalStudents: number;
  gradedCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passCount: number;
  failCount: number;
  passRate: number;
}

export interface StudentGradeSummary {
  studentId: string;
  studentName: string;
  nis: string;
  averageScore: number;
  totalAssessments: number;
  rank?: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

// Assessment queries
export function useAssessments(params?: {
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  type?: AssessmentType;
  academicYearId?: string;
  semester?: number;
  isPublished?: boolean;
}) {
  return useQuery({
    queryKey: ['assessments', params],
    queryFn: async () => {
      const response = await api.get('/assessments', { params });
      return response.data.data as Assessment[];
    },
  });
}

export function useAssessment(id: string) {
  return useQuery({
    queryKey: ['assessment', id],
    queryFn: async () => {
      const response = await api.get(`/assessments/${id}`);
      return response.data.data as Assessment;
    },
    enabled: !!id,
  });
}

export function useAssessmentStats(id: string) {
  return useQuery({
    queryKey: ['assessment-stats', id],
    queryFn: async () => {
      const response = await api.get(`/assessments/${id}/stats`);
      return response.data.data as GradeStats;
    },
    enabled: !!id,
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Assessment>) => {
      const response = await api.post('/assessments', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
}

export function useUpdateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Assessment> }) => {
      const response = await api.put(`/assessments/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
}

export function usePublishAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/assessments/${id}/publish`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
}

export function useDeleteAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assessments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
}

// Grade queries
export function useGrades(assessmentId: string) {
  return useQuery({
    queryKey: ['grades', assessmentId],
    queryFn: async () => {
      const response = await api.get(`/assessments/${assessmentId}/grades`);
      return response.data.data as Grade[];
    },
    enabled: !!assessmentId,
  });
}

export function useStudentGrades(studentId: string, params?: {
  academicYearId?: string;
  semester?: number;
  subjectId?: string;
}) {
  return useQuery({
    queryKey: ['student-grades', studentId, params],
    queryFn: async () => {
      const response = await api.get(`/students/${studentId}/grades`, { params });
      return response.data.data as Grade[];
    },
    enabled: !!studentId,
  });
}

export function useSubmitGrades() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assessmentId,
      grades,
    }: {
      assessmentId: string;
      grades: Array<{ studentId: string; score: number; notes?: string }>;
    }) => {
      const response = await api.post(`/assessments/${assessmentId}/grades`, { grades });
      return response.data.data;
    },
    onSuccess: (_, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['grades', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessment-stats', assessmentId] });
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assessmentId,
      gradeId,
      data,
    }: {
      assessmentId: string;
      gradeId: string;
      data: { score: number; notes?: string };
    }) => {
      const response = await api.put(`/assessments/${assessmentId}/grades/${gradeId}`, data);
      return response.data.data;
    },
    onSuccess: (_, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['grades', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessment-stats', assessmentId] });
    },
  });
}

// Report Card queries
export function useReportCards(params?: {
  classId?: string;
  academicYearId?: string;
  semester?: number;
  isPublished?: boolean;
}) {
  return useQuery({
    queryKey: ['report-cards', params],
    queryFn: async () => {
      const response = await api.get('/report-cards', { params });
      return response.data.data as ReportCard[];
    },
  });
}

export function useReportCard(id: string) {
  return useQuery({
    queryKey: ['report-card', id],
    queryFn: async () => {
      const response = await api.get(`/report-cards/${id}`);
      return response.data.data as ReportCard;
    },
    enabled: !!id,
  });
}

export function useStudentReportCard(studentId: string, academicYearId: string, semester: number) {
  return useQuery({
    queryKey: ['student-report-card', studentId, academicYearId, semester],
    queryFn: async () => {
      const response = await api.get(`/students/${studentId}/report-card`, {
        params: { academicYearId, semester },
      });
      return response.data.data as ReportCard;
    },
    enabled: !!studentId && !!academicYearId,
  });
}

export function useGenerateReportCards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classId,
      academicYearId,
      semester,
      options,
    }: {
      classId: string;
      academicYearId: string;
      semester: number;
      options?: {
        includeAttendance?: boolean;
        includeTahfidz?: boolean;
        includeExtracurricular?: boolean;
      };
    }) => {
      const response = await api.post('/report-cards/generate', {
        classId,
        academicYearId,
        semester,
        ...options,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
    },
  });
}

export function usePublishReportCards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params:
        | { classId: string; academicYearId: string; semester: number }
        | string[]
    ) => {
      if (Array.isArray(params)) {
        const response = await api.post('/report-cards/publish', { ids: params });
        return response.data.data;
      }
      const response = await api.post('/report-cards/publish', params);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
    },
  });
}

export function useUpdateReportCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { teacherNotes?: string; principalNotes?: string };
    }) => {
      const response = await api.put(`/report-cards/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
    },
  });
}

// Class grade summary
export function useClassGradeSummary(classId: string, params?: {
  academicYearId?: string;
  semester?: number;
}) {
  return useQuery({
    queryKey: ['class-grade-summary', classId, params],
    queryFn: async () => {
      const response = await api.get(`/classes/${classId}/grade-summary`, { params });
      return response.data.data as StudentGradeSummary[];
    },
    enabled: !!classId,
  });
}
