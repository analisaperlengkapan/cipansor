import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// Types
export type ReportType = 
  | 'STUDENT_STATISTICS'
  | 'ATTENDANCE_SUMMARY'
  | 'FINANCE_REPORT'
  | 'ACADEMIC_PERFORMANCE'
  | 'TAHFIDZ_PROGRESS'
  | 'HEALTH_SUMMARY'
  | 'VIOLATION_SUMMARY';

export type TimeRange = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';

export interface ReportFilter {
  reportType?: ReportType;
  timeRange?: TimeRange;
  startDate?: string;
  endDate?: string;
  unitId?: string;
  classId?: string;
}

export interface StudentStatistics {
  totalStudents: number;
  activeStudents: number;
  newStudentsThisMonth: number;
  graduatedThisYear: number;
  byGender: {
    male: number;
    female: number;
  };
  byUnit: Array<{
    unitId: string;
    unitName: string;
    count: number;
  }>;
  byClass: Array<{
    classId: string;
    className: string;
    count: number;
  }>;
  trend: Array<{
    month: string;
    count: number;
  }>;
}

export interface AnalyticsAttendanceSummary {
  totalDays: number;
  presentRate: number;
  absentRate: number;
  lateRate: number;
  sickRate: number;
  permittedRate: number;
  byClass: Array<{
    classId: string;
    className: string;
    presentRate: number;
  }>;
  trend: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
  }>;
}

export interface FinanceReport {
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
  outstandingBills: number;
  collectionRate: number;
  revenueByCategory: Array<{
    category: string;
    amount: number;
  }>;
  expenseByCategory: Array<{
    category: string;
    amount: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    expense: number;
  }>;
}

export interface AcademicPerformance {
  averageGpa: number;
  passRate: number;
  topPerformers: Array<{
    studentId: string;
    studentName: string;
    gpa: number;
    classId: string;
    className: string;
  }>;
  bySubject: Array<{
    subjectId: string;
    subjectName: string;
    averageScore: number;
    passRate: number;
  }>;
  gradeDistribution: Array<{
    grade: string;
    count: number;
    percentage: number;
  }>;
  trend: Array<{
    semester: string;
    averageGpa: number;
  }>;
}

export interface TahfidzProgress {
  totalStudents: number;
  averageJuz: number;
  completedHafidz: number;
  byJuzRange: Array<{
    range: string;
    count: number;
  }>;
  topPerformers: Array<{
    studentId: string;
    studentName: string;
    totalJuz: number;
    totalAyat: number;
  }>;
  monthlyProgress: Array<{
    month: string;
    newMemorization: number;
    murajaah: number;
  }>;
}

export interface HealthSummary {
  totalRecords: number;
  sickStudents: number;
  healthyRate: number;
  byCondition: Array<{
    condition: string;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    sickCount: number;
    recoveredCount: number;
  }>;
}

export interface ViolationSummary {
  totalViolations: number;
  resolvedCount: number;
  pendingCount: number;
  byCategory: Array<{
    category: string;
    count: number;
    severity: string;
  }>;
  byClass: Array<{
    classId: string;
    className: string;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    count: number;
  }>;
}

export interface DashboardSummary {
  students: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  attendance: {
    todayRate: number;
    weeklyAverage: number;
  };
  finance: {
    monthlyRevenue: number;
    outstandingBills: number;
    collectionRate: number;
  };
  tahfidz: {
    averageJuz: number;
    completedHafidz: number;
  };
}

// Constants
export const REPORT_TYPES: ReportType[] = [
  'STUDENT_STATISTICS',
  'ATTENDANCE_SUMMARY',
  'FINANCE_REPORT',
  'ACADEMIC_PERFORMANCE',
  'TAHFIDZ_PROGRESS',
  'HEALTH_SUMMARY',
  'VIOLATION_SUMMARY',
];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  STUDENT_STATISTICS: 'Statistik Santri',
  ATTENDANCE_SUMMARY: 'Ringkasan Kehadiran',
  FINANCE_REPORT: 'Laporan Keuangan',
  ACADEMIC_PERFORMANCE: 'Performa Akademik',
  TAHFIDZ_PROGRESS: 'Progres Tahfidz',
  HEALTH_SUMMARY: 'Ringkasan Kesehatan',
  VIOLATION_SUMMARY: 'Ringkasan Pelanggaran',
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
