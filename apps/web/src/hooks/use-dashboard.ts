import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Types
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalUnits: number;
  studentsGrowth: number;
  attendanceRate: number;
  activeAcademicYear?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
}

export interface AttendanceStats {
  date: string;
  present: number;
  absent: number;
  sick: number;
  excused: number;
}

export interface FinanceStats {
  totalBilled: number;
  totalPaid: number;
  totalUnpaid: number;
  recentPayments: {
    id: string;
    studentName: string;
    amount: number;
    date: string;
  }[];
}

export interface TahfidzStats {
  totalMemorized: number;
  averageJuz: number;
  topStudents: {
    id: string;
    name: string;
    totalJuz: number;
    totalAyat: number;
  }[];
  monthlyProgress: {
    month: string;
    totalAyat: number;
  }[];
}

export interface ViolationRewardStats {
  totalViolations: number;
  totalRewards: number;
  violationsByCategory: {
    category: string;
    count: number;
  }[];
  rewardsByCategory: {
    category: string;
    count: number;
  }[];
}

// Dashboard Hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get<DashboardStats>('/dashboard/stats');
      return response.data;
    },
  });
}

export function useAttendanceStats(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['dashboard', 'attendance', params],
    queryFn: async () => {
      const response = await api.get<AttendanceStats[]>('/dashboard/attendance', { params });
      return response.data;
    },
  });
}

export function useFinanceStats(params?: { period?: 'week' | 'month' | 'year' }) {
  return useQuery({
    queryKey: ['dashboard', 'finance', params],
    queryFn: async () => {
      const response = await api.get<FinanceStats>('/dashboard/finance', { params });
      return response.data;
    },
  });
}

export function useTahfidzStats(params?: { period?: 'week' | 'month' | 'year' }) {
  return useQuery({
    queryKey: ['dashboard', 'tahfidz', params],
    queryFn: async () => {
      const response = await api.get<TahfidzStats>('/dashboard/tahfidz', { params });
      return response.data;
    },
  });
}

export function useViolationRewardStats(params?: { period?: 'week' | 'month' | 'year' }) {
  return useQuery({
    queryKey: ['dashboard', 'violation-reward', params],
    queryFn: async () => {
      const response = await api.get<ViolationRewardStats>('/dashboard/violation-reward', { params });
      return response.data;
    },
  });
}

// Analytics/Reports Hooks
export interface ReportParams {
  type: 'attendance' | 'finance' | 'tahfidz' | 'violations' | 'rewards' | 'students';
  startDate?: string;
  endDate?: string;
  unitId?: string;
  classId?: string;
  format?: 'json' | 'csv' | 'pdf';
}

export function useGenerateReport() {
  return useMutation({
    mutationFn: async (params: ReportParams) => {
      const response = await api.get('/reports/generate', { params, responseType: 'blob' });
      return response.data;
    },
  });
}

export function useReportHistory(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['reports', 'history', params],
    queryFn: async () => {
      const response = await api.get<{
        data: {
          id: string;
          type: string;
          generatedAt: string;
          generatedBy: string;
          downloadUrl: string;
        }[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>('/reports/history', { params });
      return response.data;
    },
  });
}

// Profile/Settings Hooks
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
  unitId?: string;
  unit?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get<UserProfile>('/auth/profile');
      return response.data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name?: string; phone?: string; avatar?: string }) => {
      const response = await api.put<UserProfile>('/auth/profile', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.put('/auth/password', data);
      return response.data;
    },
  });
}

// Dashboard Notification Hooks (simplified for dashboard display)
export interface DashboardNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export function useDashboardNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
  return useQuery({
    queryKey: ['dashboard-notifications', params],
    queryFn: async () => {
      const response = await api.get<{
        data: DashboardNotification[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
          unreadCount: number;
        };
      }>('/notifications', { params });
      return response.data;
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.put('/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
