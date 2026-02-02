import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// Types
export interface Competency {
  id: string;
  name: string;
  description?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeCompetency {
  id: string;
  userId: string;
  competencyId: string;
  competency?: Competency;
  proficiency: number;
  targetLevel?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingProgram {
  id: string;
  name: string;
  provider?: string;
  description?: string;
  startDate: string;
  endDate: string;
  hours?: number;
  cost?: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    participations?: number;
  };
}

export interface EmployeeTraining {
  id: string;
  userId: string;
  trainingProgramId: string;
  program?: TrainingProgram;
  status: string;
  certificateUrl?: string;
  score?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceReview {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  reviewerId: string;
  reviewer?: {
    id: string;
    name: string;
  };
  cycleName: string;
  startDate: string;
  endDate: string;
  status: string;
  selfRating?: any;
  managerRating?: any;
  finalScore?: number;
  finalGrade?: string;
  goals?: string;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

// Competency Hooks
export function useCompetencies(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ["competencies", params],
    queryFn: async () => {
      const response = await api.get("/hr/talent/competencies", { params });
      return response.data as {
        data: Competency[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
    },
  });
}

export function useCreateCompetency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Competency>) => {
      const response = await api.post("/hr/talent/competencies", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competencies"] });
    },
  });
}

export function useUpdateCompetency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Competency> }) => {
      const response = await api.patch(`/hr/talent/competencies/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competencies"] });
    },
  });
}

export function useDeleteCompetency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hr/talent/competencies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competencies"] });
    },
  });
}

// Employee Competency Hooks
export function useEmployeeCompetencies(userId: string) {
  return useQuery({
    queryKey: ["employee-competencies", userId],
    queryFn: async () => {
      const response = await api.get(`/hr/talent/employees/${userId}/competencies`);
      return response.data.data as EmployeeCompetency[];
    },
    enabled: !!userId,
  });
}

export function useAddEmployeeCompetency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      userId: string;
      competencyId: string;
      proficiency: number;
      targetLevel?: number;
      notes?: string;
    }) => {
      const response = await api.post("/hr/talent/employees/competencies", data);
      return response.data.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["employee-competencies", userId] });
    },
  });
}

export function useUpdateEmployeeCompetency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { proficiency?: number; targetLevel?: number; notes?: string };
    }) => {
      const response = await api.patch(`/hr/talent/employees/competencies/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-competencies"] });
    },
  });
}

export function useRemoveEmployeeCompetency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hr/talent/employees/competencies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-competencies"] });
    },
  });
}

// Training Hooks
export function useTrainingPrograms(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ["training-programs", params],
    queryFn: async () => {
      const response = await api.get("/hr/talent/training/programs", { params });
      return response.data as {
        data: TrainingProgram[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
    },
  });
}

export function useCreateTrainingProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<TrainingProgram>) => {
      const response = await api.post("/hr/talent/training/programs", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
    },
  });
}

export function useUpdateTrainingProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TrainingProgram> }) => {
      const response = await api.patch(`/hr/talent/training/programs/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
    },
  });
}

export function useDeleteTrainingProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hr/talent/training/programs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
    },
  });
}

// Employee Training Hooks
export function useEmployeeTrainings(userId: string) {
  return useQuery({
    queryKey: ["employee-trainings", userId],
    queryFn: async () => {
      const response = await api.get(`/hr/talent/employees/${userId}/training`);
      return response.data.data as EmployeeTraining[];
    },
    enabled: !!userId,
  });
}

export function useEnrollEmployeeToTraining() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { userId: string; trainingProgramId: string }) => {
      const response = await api.post("/hr/talent/training/enroll", data);
      return response.data.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["employee-trainings", userId] });
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
    },
  });
}

// Performance Review Hooks
export function usePerformanceReviews(params?: {
  page?: number;
  limit?: number;
  userId?: string;
  reviewerId?: string;
  cycleName?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["performance-reviews", params],
    queryFn: async () => {
      const response = await api.get("/hr/talent/reviews", { params });
      return response.data as {
        data: PerformanceReview[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
    },
  });
}

export function useCreatePerformanceReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PerformanceReview>) => {
      const response = await api.post("/hr/talent/reviews", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-reviews"] });
    },
  });
}

export function useUpdatePerformanceReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PerformanceReview> }) => {
      const response = await api.patch(`/hr/talent/reviews/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-reviews"] });
    },
  });
}

export function useDeletePerformanceReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hr/talent/reviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-reviews"] });
    },
  });
}
