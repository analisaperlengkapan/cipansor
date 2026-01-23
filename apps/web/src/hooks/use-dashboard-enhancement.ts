"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  SharedPaginatedResponse,
  DashboardOverview,
  QuickStats,
  MetricSnapshot,
  TrendData,
  UnitComparison,
} from "@cipansor/shared";

// Queries

export function useDashboardOverview(
  params: { unitId?: string; academicYearId?: string } = {},
) {
  return useQuery({
    queryKey: ["dashboard-enhancement", "overview", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.unitId) queryParams.append("unitId", params.unitId);
      if (params.academicYearId)
        queryParams.append("academicYearId", params.academicYearId);

      const response = await api.get<{ data: DashboardOverview }>(
        `/dashboard-enhancement/overview?${queryParams}`,
      );
      return response.data.data;
    },
    // Keep data fresh but don't over-fetch
    staleTime: 60 * 1000,
  });
}

export function useQuickStats(params: { unitId?: string } = {}) {
  return useQuery({
    queryKey: ["dashboard-enhancement", "quick-stats", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.unitId) queryParams.append("unitId", params.unitId);

      const response = await api.get<{ data: QuickStats }>(
        `/dashboard-enhancement/quick-stats?${queryParams}`,
      );
      return response.data.data;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

export function useMetricSnapshots(params: {
  page?: number;
  limit?: number;
  unitId?: string;
  metricType?: string;
  periodType?: string;
}) {
  return useQuery({
    queryKey: ["dashboard-enhancement", "metrics", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", String(params.page));
      if (params.limit) queryParams.append("limit", String(params.limit));
      if (params.unitId) queryParams.append("unitId", params.unitId);
      if (params.metricType)
        queryParams.append("metricType", params.metricType);
      if (params.periodType)
        queryParams.append("periodType", params.periodType);

      const response = await api.get<SharedPaginatedResponse<MetricSnapshot>>(
        `/dashboard-enhancement/metrics?${queryParams}`,
      );
      const result = response.data;
      return {
        data: result.data,
        pagination: result.meta.pagination,
      };
    },
  });
}

export function useMetricTrend(params: {
  metricType: string;
  periodType: string;
  unitId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["dashboard-enhancement", "trend", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append("metricType", params.metricType);
      queryParams.append("periodType", params.periodType);
      if (params.unitId) queryParams.append("unitId", params.unitId);
      if (params.startDate) queryParams.append("startDate", params.startDate);
      if (params.endDate) queryParams.append("endDate", params.endDate);
      if (params.limit) queryParams.append("limit", String(params.limit));

      const response = await api.get<{ data: TrendData }>(
        `/dashboard-enhancement/trends?${queryParams}`,
      );
      return response.data.data;
    },
    enabled: !!params.metricType && !!params.periodType,
  });
}

export function useUnitComparison(params: {
  metricType: string;
  academicYearId?: string;
  periodStart?: string;
  periodEnd?: string;
}) {
  return useQuery({
    queryKey: ["dashboard-enhancement", "comparison", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append("metricType", params.metricType);
      if (params.academicYearId)
        queryParams.append("academicYearId", params.academicYearId);
      if (params.periodStart)
        queryParams.append("periodStart", params.periodStart);
      if (params.periodEnd) queryParams.append("periodEnd", params.periodEnd);

      const response = await api.get<{ data: UnitComparison }>(
        `/dashboard-enhancement/comparison?${queryParams}`,
      );
      return response.data.data;
    },
    enabled: !!params.metricType,
  });
}

// Mutations

export function useCreateMetricSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      unitId?: string;
      academicYearId?: string;
      metricType: string;
      metricValue: number;
      metricData?: any;
      periodType: string;
      periodDate: string;
    }) => {
      const response = await api.post("/dashboard-enhancement/metrics", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard-enhancement", "metrics"],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-enhancement", "trend"],
      });
    },
  });
}

export function useGenerateDashboardReport() {
  return useMutation({
    mutationFn: async (data: {
      unitId?: string;
      reportType: string;
      periodType: string;
      periodStart: string;
      periodEnd: string;
      academicYearId?: string;
    }) => {
      const response = await api.post("/dashboard-enhancement/reports", data);
      return response.data;
    },
  });
}

export function useTriggerDashboardJob() {
  return useMutation({
    mutationFn: async (data: {
      jobType: "daily-snapshot" | "weekly-summary" | "cleanup";
    }) => {
      const response = await api.post(
        "/dashboard-enhancement/jobs/trigger",
        data,
      );
      return response.data;
    },
  });
}
