import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  GuestBook,
  StudentVisit,
  StudentPackage,
  CreateGuestBookInput,
  UpdateGuestBookInput,
  CreateStudentVisitInput,
  UpdateStudentVisitInput,
  CreateStudentPackageInput,
  UpdateStudentPackageInput,
  ReceptionStats,
} from "@cipansor/shared";

// Re-export types
export type { GuestBook, StudentVisit, StudentPackage, ReceptionStats };

// --- Stats ---

export function useReceptionStats() {
  return useQuery({
    queryKey: ["reception", "stats"],
    queryFn: async () => {
      const response = await api.get<{ data: ReceptionStats }>(
        "/reception/stats",
      );
      return response.data.data;
    },
  });
}

// --- Guest Book ---

export function useGuestBooks(params?: { date?: string }) {
  return useQuery({
    queryKey: ["reception", "guests", params],
    queryFn: async () => {
      const response = await api.get<{ data: GuestBook[] }>(
        "/reception/guests",
        { params },
      );
      return response.data.data;
    },
  });
}

export function useCreateGuestBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateGuestBookInput) => {
      const response = await api.post<{ data: GuestBook }>(
        "/reception/guests",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reception", "guests"] });
      queryClient.invalidateQueries({ queryKey: ["reception", "stats"] });
    },
  });
}

export function useUpdateGuestBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateGuestBookInput;
    }) => {
      const response = await api.patch<{ data: GuestBook }>(
        `/reception/guests/${id}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reception", "guests"] });
    },
  });
}

// --- Student Visits ---

export function useStudentVisits(params?: {
  date?: string;
  studentId?: string;
}) {
  return useQuery({
    queryKey: ["reception", "visits", params],
    queryFn: async () => {
      const response = await api.get<{ data: StudentVisit[] }>(
        "/reception/visits",
        { params },
      );
      return response.data.data;
    },
  });
}

export function useCreateStudentVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStudentVisitInput) => {
      const response = await api.post<{ data: StudentVisit }>(
        "/reception/visits",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reception", "visits"] });
      queryClient.invalidateQueries({ queryKey: ["reception", "stats"] });
    },
  });
}

export function useUpdateStudentVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateStudentVisitInput;
    }) => {
      const response = await api.patch<{ data: StudentVisit }>(
        `/reception/visits/${id}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reception", "visits"] });
      queryClient.invalidateQueries({ queryKey: ["reception", "stats"] });
    },
  });
}

// --- Packages ---

export function useStudentPackages(params?: {
  status?: string;
  studentId?: string;
  date?: string;
}) {
  return useQuery({
    queryKey: ["reception", "packages", params],
    queryFn: async () => {
      const response = await api.get<{ data: StudentPackage[] }>(
        "/reception/packages",
        { params },
      );
      return response.data.data;
    },
  });
}

// Alias for compatibility with page imports
export const usePackages = useStudentPackages;

export function useCreatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStudentPackageInput) => {
      const response = await api.post<{ data: StudentPackage }>(
        "/reception/packages",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reception", "packages"] });
      queryClient.invalidateQueries({ queryKey: ["reception", "stats"] });
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateStudentPackageInput;
    }) => {
      const response = await api.patch<{ data: StudentPackage }>(
        `/reception/packages/${id}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reception", "packages"] });
      queryClient.invalidateQueries({ queryKey: ["reception", "stats"] });
    },
  });
}

// Legacy alias exports if needed, but updated page uses CreatePackage
export const useCreateStudentPackage = useCreatePackage;
export const useUpdateStudentPackage = useUpdatePackage;
