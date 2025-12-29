import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Types
export interface DailyReport {
  id: string;
  studentId: string;
  unitId: string;
  academicYearId?: string;
  reportDate: string;
  unitType: 'PESANTREN' | 'TK_QURAN' | 'SD_IT' | 'SMP_IT' | 'SMA_QURAN' | 'OTHER';
  arrivalTime?: string;
  mood?: 'HAPPY' | 'NEUTRAL' | 'SAD' | 'TIRED' | 'EXCITED' | 'SICK';
  healthStatus?: string;
  temperature?: number;
  hadBreakfast?: boolean;
  mealStatus?: 'HABIS' | 'SETENGAH' | 'SEDIKIT' | 'TIDAK_MAU';
  snackStatus?: 'HABIS' | 'SETENGAH' | 'SEDIKIT' | 'TIDAK_MAU';
  napDuration?: number;
  toiletNotes?: string;
  sholatDhuha?: boolean;
  tahfidzActivity?: string;
  activitiesSummary?: string;
  achievements?: string;
  behaviorNotes?: string;
  teacherNotes?: string;
  homeActivity?: string;
  departureTime?: string;
  pickedUpBy?: string;
  parentReadAt?: string;
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
  unit?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
  photos?: DailyReportPhoto[];
}

export interface DailyReportPhoto {
  id: string;
  dailyReportId: string;
  photoUrl: string;
  caption?: string;
  activityType?: string;
  createdAt: string;
}

export interface DailyReportFilters {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  studentId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  attendanceStatus?: string;
  unitId?: string;
}

export interface CreateDailyReportData {
  studentId: string;
  unitId: string;
  academicYearId: string;
  reportDate: string;
  morningMood?: string;
  afternoonMood?: string;
  healthNotes?: string;
  temperature?: number;
  breakfastConsumption?: string;
  lunchConsumption?: string;
  snackConsumption?: string;
  napDurationMinutes?: number;
  napQuality?: string;
  bathroomCount?: number;
  toiletingNotes?: string;
  activitiesSummary?: string;
  learningAchievements?: string;
  specialMoments?: string;
  ibadahNotes?: string;
  doaPractice?: string;
  surahPractice?: string;
  socialInteraction?: string;
  behaviorNotes?: string;
  parentNotes?: string;
  homeworkSuggestion?: string;
  photoUrls?: string[];
}

export interface UpdateDailyReportData extends Partial<CreateDailyReportData> {
  parentNotes?: string;
}

export interface BulkCheckInData {
  classId: string;
  date: string;
  students: {
    studentId: string;
    checkInTime: string;
    attendanceStatus: string;
    moodStatus?: string;
    healthStatus?: string;
  }[];
}

export interface BulkCheckOutData {
  classId: string;
  date: string;
  students: {
    studentId: string;
    checkOutTime: string;
  }[];
}

// Query Keys
export const dailyReportKeys = {
  all: ['daily-reports'] as const,
  lists: () => [...dailyReportKeys.all, 'list'] as const,
  list: (filters: DailyReportFilters) => [...dailyReportKeys.lists(), filters] as const,
  details: () => [...dailyReportKeys.all, 'detail'] as const,
  detail: (id: string) => [...dailyReportKeys.details(), id] as const,
  byStudent: (studentId: string, filters?: Omit<DailyReportFilters, 'studentId'>) =>
    [...dailyReportKeys.all, 'student', studentId, filters] as const,
  byClass: (classId: string, date: string) =>
    [...dailyReportKeys.all, 'class', classId, date] as const,
  photos: (reportId: string) => [...dailyReportKeys.all, 'photos', reportId] as const,
};

// Hooks

// Get daily reports list
export function useDailyReports(filters: DailyReportFilters = {}) {
  return useQuery({
    queryKey: dailyReportKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
      const response = await apiClient.get(`/daily-report?${params.toString()}`);
      return response.data;
    },
  });
}

// Get single daily report
export function useDailyReport(id: string) {
  return useQuery({
    queryKey: dailyReportKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get(`/daily-report/${id}`);
      return response.data.data as DailyReport;
    },
    enabled: !!id,
  });
}

// Get daily reports by student
export function useStudentDailyReports(
  studentId: string,
  filters?: Omit<DailyReportFilters, 'studentId'>
) {
  return useQuery({
    queryKey: dailyReportKeys.byStudent(studentId, filters),
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
        `/daily-report/student/${studentId}?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!studentId,
  });
}

// Get daily reports by class for a specific date
export function useClassDailyReports(classId: string, date: string) {
  return useQuery({
    queryKey: dailyReportKeys.byClass(classId, date),
    queryFn: async () => {
      const response = await apiClient.get(`/daily-report/class/${classId}?date=${date}`);
      return response.data;
    },
    enabled: !!classId && !!date,
  });
}

// Get daily report photos
export function useDailyReportPhotos(reportId: string) {
  return useQuery({
    queryKey: dailyReportKeys.photos(reportId),
    queryFn: async () => {
      const response = await apiClient.get(`/daily-report/${reportId}/photos`);
      return response.data;
    },
    enabled: !!reportId,
  });
}

// Create daily report
export function useCreateDailyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDailyReportData) => {
      const response = await apiClient.post('/daily-report', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.all });
    },
  });
}

// Update daily report
export function useUpdateDailyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDailyReportData }) => {
      const response = await apiClient.put(`/daily-report/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.lists() });
    },
  });
}

// Delete daily report
export function useDeleteDailyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/daily-report/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.all });
    },
  });
}

// Bulk check-in
export function useBulkCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkCheckInData) => {
      const response = await apiClient.post('/daily-report/bulk-check-in', data);
      return response.data;
    },
    onSuccess: (_, { classId, date }) => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.byClass(classId, date) });
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.lists() });
    },
  });
}

// Bulk check-out
export function useBulkCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkCheckOutData) => {
      const response = await apiClient.post('/daily-report/bulk-check-out', data);
      return response.data;
    },
    onSuccess: (_, { classId, date }) => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.byClass(classId, date) });
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.lists() });
    },
  });
}

// Add photo to daily report
export function useAddDailyReportPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      data,
    }: {
      reportId: string;
      data: { photoUrl: string; caption?: string; activityType?: string };
    }) => {
      const response = await apiClient.post(`/daily-report/${reportId}/photos`, data);
      return response.data;
    },
    onSuccess: (_, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.photos(reportId) });
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.detail(reportId) });
    },
  });
}

// Delete photo from daily report
export function useDeleteDailyReportPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, photoId }: { reportId: string; photoId: string }) => {
      const response = await apiClient.delete(`/daily-report/${reportId}/photos/${photoId}`);
      return response.data;
    },
    onSuccess: (_, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.photos(reportId) });
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.detail(reportId) });
    },
  });
}

// Add parent notes
export function useAddParentNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, notes }: { reportId: string; notes: string }) => {
      const response = await apiClient.patch(`/daily-report/${reportId}/parent-notes`, {
        parentNotes: notes,
      });
      return response.data;
    },
    onSuccess: (_, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.detail(reportId) });
    },
  });
}
