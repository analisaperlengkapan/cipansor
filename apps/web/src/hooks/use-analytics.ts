import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  ReportType,
  TimeRange,
  ReportFilter,
  StudentStatistics,
  AnalyticsAttendanceSummary,
  FinanceReport,
  AcademicPerformance,
  TahfidzProgress,
  HealthSummary,
  ViolationSummary,
  DashboardSummary
} from '@cipansor/shared';

export type {
  ReportType,
  TimeRange,
  ReportFilter,
  StudentStatistics,
  AnalyticsAttendanceSummary,
  FinanceReport,
  AcademicPerformance,
  TahfidzProgress,
  HealthSummary,
  ViolationSummary,
  DashboardSummary
};

// Constants
export const REPORT_TYPES: ReportType[] = [
  'STUDENT_STATISTICS',
  'ATTENDANCE_SUMMARY',
  'FINANCE_REPORT',
  'ACADEMIC_PERFORMANCE',
  'TAHFIDZ_PROGRESS',
  'HEALTH_SUMMARY',
  'VIOLATION_SUMMARY',
  'LIBRARY_STATISTICS',
  'PSB_STATISTICS',
];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  STUDENT_STATISTICS: 'Statistik Santri',
  ATTENDANCE_SUMMARY: 'Ringkasan Kehadiran',
  FINANCE_REPORT: 'Laporan Keuangan',
  ACADEMIC_PERFORMANCE: 'Performa Akademik',
  TAHFIDZ_PROGRESS: 'Progres Tahfidz',
  HEALTH_SUMMARY: 'Ringkasan Kesehatan',
  VIOLATION_SUMMARY: 'Ringkasan Pelanggaran',
  LIBRARY_STATISTICS: 'Statistik Perpustakaan',
  PSB_STATISTICS: 'Statistik PSB',
};

export const TIME_RANGES: TimeRange[] = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM'];

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  WEEKLY: 'Mingguan',
  MONTHLY: 'Bulanan',
  QUARTERLY: 'Triwulan',
  YEARLY: 'Tahunan',
  CUSTOM: 'Kustom',
};

// Hooks
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['analytics', 'dashboard-summary'],
    queryFn: async () => {
      const { data } = await api.get<{ data: DashboardSummary }>('/analytics/dashboard');
      return data;
    },
  });
}

export function useStudentStatistics(filter?: ReportFilter) {
  return useQuery({
    queryKey: ['analytics', 'student-statistics', filter],
    queryFn: async () => {
      const { data } = await api.get<{ data: StudentStatistics }>('/analytics/students', {
        params: filter,
      });
      return data;
    },
  });
}

export function useAttendanceSummaryAnalytics(filter?: ReportFilter) {
  return useQuery({
    queryKey: ['analytics', 'attendance-summary', filter],
    queryFn: async () => {
      const { data } = await api.get<{ data: AnalyticsAttendanceSummary }>('/analytics/attendance', {
        params: filter,
      });
      return data;
    },
  });
}

export function useFinanceReport(filter?: ReportFilter) {
  return useQuery({
    queryKey: ['analytics', 'finance-report', filter],
    queryFn: async () => {
      const { data } = await api.get<{ data: FinanceReport }>('/analytics/finance', {
        params: filter,
      });
      return data;
    },
  });
}

export function useAcademicPerformance(filter?: ReportFilter) {
  return useQuery({
    queryKey: ['analytics', 'academic-performance', filter],
    queryFn: async () => {
      const { data } = await api.get<{ data: AcademicPerformance }>('/analytics/academic', {
        params: filter,
      });
      return data;
    },
  });
}

export function useTahfidzProgress(filter?: ReportFilter) {
  return useQuery({
    queryKey: ['analytics', 'tahfidz-progress', filter],
    queryFn: async () => {
      const { data } = await api.get<{ data: TahfidzProgress }>('/analytics/tahfidz', {
        params: filter,
      });
      return data;
    },
  });
}

export function useHealthSummaryAnalytics(filter?: ReportFilter) {
  return useQuery({
    queryKey: ['analytics', 'health-summary', filter],
    queryFn: async () => {
      const { data } = await api.get<{ data: HealthSummary }>('/analytics/health', {
        params: filter,
      });
      return data;
    },
  });
}

export function useViolationSummaryAnalytics(filter?: ReportFilter) {
  return useQuery({
    queryKey: ['analytics', 'violation-summary', filter],
    queryFn: async () => {
      const { data } = await api.get<{ data: ViolationSummary }>('/analytics/violations', {
        params: filter,
      });
      return data;
    },
  });
}

export function useExportReport(reportType: ReportType, filter?: ReportFilter) {
  return useQuery({
    queryKey: ['analytics', 'export', reportType, filter],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/export/${reportType}`, {
        params: filter,
        responseType: 'blob',
      });
      return data;
    },
    enabled: false, // Only run when explicitly called
  });
}
