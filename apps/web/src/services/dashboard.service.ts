/**
 * Dashboard API Service
 * Centralized API calls for dashboard functionality
 */

import { api } from "@/lib/api";
import type {
  ApiResponse,
  PeriodParams,
  UnitFilterParams,
  DateRangeParams,
} from "./types";
import type {
  DashboardStats,
  AttendanceStats,
  FinanceStats,
  TahfidzStats,
  ViolationRewardStats,
  DashboardMetrics,
  DashboardAlert,
  DashboardMetricsResponse,
} from "@cipansor/shared";

export interface QuickStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  todayAttendance: number;
  attendanceRate: number;
}

export interface DashboardMetricsData {
  current: DashboardMetrics;
  recent: DashboardMetrics[];
  alerts: DashboardAlert[];
}

/**
 * Dashboard Service
 */
export const dashboardService = {
  /**
   * Get main dashboard statistics
   */
  async getStats(params?: UnitFilterParams): Promise<DashboardStats> {
    const response = await api.get<ApiResponse<DashboardStats>>(
      "/dashboard/stats",
      {
        params,
      },
    );
    return response.data.data;
  },

  /**
   * Get quick stats for dashboard cards
   */
  async getQuickStats(params?: UnitFilterParams): Promise<QuickStats> {
    const response = await api.get<ApiResponse<QuickStats>>(
      "/dashboard/quick-stats",
      {
        params,
      },
    );
    return response.data.data;
  },

  /**
   * Get dashboard metrics with history and alerts
   */
  async getMetrics(params?: UnitFilterParams): Promise<DashboardMetricsData> {
    const response = await api.get<ApiResponse<DashboardMetricsData>>(
      "/dashboard/metrics",
      {
        params,
      },
    );
    return response.data.data;
  },

  /**
   * Get attendance statistics
   */
  async getAttendanceStats(
    params?: UnitFilterParams & DateRangeParams,
  ): Promise<AttendanceStats[]> {
    const response = await api.get<ApiResponse<AttendanceStats[]>>(
      "/dashboard/attendance",
      { params },
    );
    return response.data.data;
  },

  /**
   * Get finance statistics
   */
  async getFinanceStats(params?: UnitFilterParams): Promise<FinanceStats> {
    const response = await api.get<ApiResponse<FinanceStats>>(
      "/dashboard/finance",
      {
        params,
      },
    );
    return response.data.data;
  },

  /**
   * Get tahfidz statistics
   */
  async getTahfidzStats(
    params?: UnitFilterParams & PeriodParams,
  ): Promise<TahfidzStats> {
    const response = await api.get<ApiResponse<TahfidzStats>>(
      "/dashboard/tahfidz",
      {
        params,
      },
    );
    return response.data.data;
  },

  /**
   * Get violation and reward statistics
   */
  async getViolationRewardStats(
    params?: UnitFilterParams & PeriodParams,
  ): Promise<ViolationRewardStats> {
    const response = await api.get<ApiResponse<ViolationRewardStats>>(
      "/dashboard/violation-reward",
      { params },
    );
    return response.data.data;
  },
};
