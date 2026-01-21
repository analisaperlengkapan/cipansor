import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { PaginatedResponse } from "@/lib/api";

// Types
export type ViolationCategory = "LIGHT" | "MEDIUM" | "HEAVY";

export interface ViolationType {
  id: string;
  name: string;
  description?: string;
  category: ViolationCategory;
  points: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Violation {
  id: string;
  studentId: string;
  violationTypeId: string;
  date: string;
  description?: string;
  witness?: string;
  actionTaken?: string;
  reportedById: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    name: string;
    nis: string;
    class?: { name: string };
    unit?: { name: string };
  };
  violationType?: ViolationType;
  reportedBy?: { name: string };
}

// Constants
export const VIOLATION_CATEGORIES: {
  value: ViolationCategory;
  label: string;
  color: string;
}[] = [
  { value: "LIGHT", label: "Ringan", color: "bg-yellow-100 text-yellow-800" },
  { value: "MEDIUM", label: "Sedang", color: "bg-orange-100 text-orange-800" },
  { value: "HEAVY", label: "Berat", color: "bg-red-100 text-red-800" },
];

// Violation Types Hooks
export function useViolationTypes(params?: {
  category?: ViolationCategory;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: ["violation-types", params],
    queryFn: async () => {
      const response = await api.get<ViolationType[]>("/violation-types", {
        params,
      });
      return response.data;
    },
  });
}

export function useViolationType(id: string) {
  return useQuery({
    queryKey: ["violation-types", id],
    queryFn: async () => {
      const response = await api.get<ViolationType>(`/violation-types/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateViolationType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      category: ViolationCategory;
      points: number;
      isActive?: boolean;
    }) => {
      const response = await api.post<ViolationType>("/violation-types", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["violation-types"] });
    },
  });
}

export function useUpdateViolationType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        description?: string;
        category?: ViolationCategory;
        points?: number;
        isActive?: boolean;
      };
    }) => {
      const response = await api.put<ViolationType>(
        `/violation-types/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["violation-types"] });
    },
  });
}

export function useDeleteViolationType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/violation-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["violation-types"] });
    },
  });
}

// Violations Hooks
export function useViolations(params?: {
  page?: number;
  limit?: number;
  studentId?: string;
  violationTypeId?: string;
  category?: ViolationCategory;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["violations", params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Violation>>(
        "/violations",
        { params },
      );
      return response.data;
    },
  });
}

export function useViolation(id: string) {
  return useQuery({
    queryKey: ["violations", id],
    queryFn: async () => {
      const response = await api.get<Violation>(`/violations/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useStudentViolations(studentId: string) {
  return useQuery({
    queryKey: ["violations", "student", studentId],
    queryFn: async () => {
      const response = await api.get<Violation[]>(
        `/violations/student/${studentId}`,
      );
      return response.data;
    },
    enabled: !!studentId,
  });
}

export function useCreateViolation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      studentId: string;
      violationTypeId: string;
      date: string;
      description?: string;
      witness?: string;
      actionTaken?: string;
    }) => {
      const response = await api.post<Violation>("/violations", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["violations"] });
    },
  });
}

export function useUpdateViolation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        violationTypeId?: string;
        date?: string;
        description?: string;
        witness?: string;
        actionTaken?: string;
      };
    }) => {
      const response = await api.put<Violation>(`/violations/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["violations"] });
    },
  });
}

export function useDeleteViolation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/violations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["violations"] });
    },
  });
}

// Violation Summary Hooks
export function useViolationSummary(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["violations", "summary", params],
    queryFn: async () => {
      const response = await api.get<{
        totalViolations: number;
        byCategory: { category: ViolationCategory; count: number }[];
        topViolationTypes: {
          violationTypeId: string;
          name: string;
          count: number;
        }[];
        topStudents: {
          studentId: string;
          name: string;
          count: number;
          points: number;
        }[];
      }>("/violations/summary", { params });
      return response.data;
    },
  });
}

export function useStudentViolationPoints(studentId: string) {
  return useQuery({
    queryKey: ["violations", "points", studentId],
    queryFn: async () => {
      const response = await api.get<{
        totalPoints: number;
        violations: Violation[];
      }>(`/violations/student/${studentId}/points`);
      return response.data;
    },
    enabled: !!studentId,
  });
}
