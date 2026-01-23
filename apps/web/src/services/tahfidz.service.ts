/**
 * Tahfidz API Service
 * Centralized API calls for tahfidz (Quran memorization) functionality
 */

import { api } from "@/lib/api";
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  DateRangeParams,
  UnitFilterParams,
} from "./types";
import type {
  TahfidzRecord,
  CreateTahfidzInput,
  UpdateTahfidzInput,
  TahfidzStudentSummary,
  TahfidzDashboardStats,
} from "@cipansor/shared";

export interface ListTahfidzParams
  extends PaginationParams, DateRangeParams, UnitFilterParams {
  studentId?: string;
  activityType?: "ZIYADAH" | "MUROJAAH" | "TASMI";
  surah?: string;
}

export interface StudentTahfidzProgress {
  studentId: string;
  studentName: string;
  totalJuz: number;
  totalAyah: number;
  lastActivityDate: string;
  currentSurah?: string;
  progressPercentage: number;
}

/**
 * Tahfidz Service
 */
export const tahfidzService = {
  /**
   * Get paginated list of tahfidz records
   */
  async list(
    params?: ListTahfidzParams,
  ): Promise<PaginatedResponse<TahfidzRecord>> {
    const response = await api.get<PaginatedResponse<TahfidzRecord>>(
      "/tahfidz",
      {
        params,
      },
    );
    return response.data;
  },

  /**
   * Get single tahfidz record by ID
   */
  async getById(id: string): Promise<TahfidzRecord> {
    const response = await api.get<ApiResponse<TahfidzRecord>>(
      `/tahfidz/${id}`,
    );
    return response.data.data;
  },

  /**
   * Create new tahfidz record
   */
  async create(input: CreateTahfidzInput): Promise<TahfidzRecord> {
    const response = await api.post<ApiResponse<TahfidzRecord>>(
      "/tahfidz",
      input,
    );
    return response.data.data;
  },

  /**
   * Update existing tahfidz record
   */
  async update(id: string, input: UpdateTahfidzInput): Promise<TahfidzRecord> {
    const response = await api.patch<ApiResponse<TahfidzRecord>>(
      `/tahfidz/${id}`,
      input,
    );
    return response.data.data;
  },

  /**
   * Delete tahfidz record
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/tahfidz/${id}`);
  },

  /**
   * Get student's tahfidz summary
   */
  async getStudentSummary(studentId: string): Promise<TahfidzStudentSummary> {
    const response = await api.get<ApiResponse<TahfidzStudentSummary>>(
      `/tahfidz/students/${studentId}/summary`,
    );
    return response.data.data;
  },

  /**
   * Get tahfidz dashboard statistics
   */
  async getDashboardStats(
    params?: UnitFilterParams,
  ): Promise<TahfidzDashboardStats> {
    const response = await api.get<ApiResponse<TahfidzDashboardStats>>(
      "/tahfidz/stats/dashboard",
      { params },
    );
    return response.data.data;
  },

  /**
   * Get students' tahfidz progress
   */
  async getStudentsProgress(
    params?: UnitFilterParams & PaginationParams,
  ): Promise<PaginatedResponse<StudentTahfidzProgress>> {
    const response = await api.get<PaginatedResponse<StudentTahfidzProgress>>(
      "/tahfidz/progress",
      { params },
    );
    return response.data;
  },

  /**
   * Get leaderboard of top hafidz students
   */
  async getLeaderboard(
    params?: UnitFilterParams & { limit?: number },
  ): Promise<{
    students: Array<{
      rank: number;
      studentId: string;
      studentName: string;
      unitName: string;
      totalJuz: number;
      totalAyah: number;
    }>;
  }> {
    const response = await api.get<ApiResponse<{ students: any[] }>>(
      "/tahfidz/leaderboard",
      { params },
    );
    return response.data.data;
  },

  /**
   * Generate tahfidz certificate for student
   */
  async generateCertificate(
    studentId: string,
    options?: {
      type: "juz" | "surah" | "full";
      juzNumber?: number;
      surahNumber?: number;
    },
  ): Promise<{ downloadUrl: string; certificateId: string }> {
    const response = await api.post<
      ApiResponse<{ downloadUrl: string; certificateId: string }>
    >(`/tahfidz/students/${studentId}/certificate`, options);
    return response.data.data;
  },
};
