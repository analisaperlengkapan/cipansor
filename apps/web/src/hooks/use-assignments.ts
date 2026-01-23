import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { PaginatedResponse, ApiResponse } from "@/lib/api";
import type {
  Assignment,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  SubmitAssignmentRequest,
  AssignmentSubmission,
  GradeSubmissionRequest,
} from "@cipansor/shared";

export interface AssignmentListParams {
  page?: number;
  limit?: number;
  unitId?: string;
  academicYearId?: string;
  teacherId?: string;
  classId?: string;
  subjectId?: string;
  studentId?: string;
}

export function useAssignments(params: AssignmentListParams = {}) {
  return useQuery({
    queryKey: ["assignments", params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Assignment>>(
        "/assignments",
        { params },
      );
      return response.data;
    },
  });
}

export function useAssignment(id: string) {
  return useQuery({
    queryKey: ["assignments", id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Assignment>>(
        `/assignments/${id}`,
      );
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useAssignmentSubmissions(assignmentId: string) {
  return useQuery({
    queryKey: ["assignments", assignmentId, "submissions"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AssignmentSubmission[]>>(
        `/assignments/${assignmentId}/submissions`,
      );
      return response.data.data;
    },
    enabled: !!assignmentId,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssignmentRequest) => {
      const response = await api.post<ApiResponse<Assignment>>(
        "/assignments",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAssignmentRequest;
    }) => {
      const response = await api.put<ApiResponse<Assignment>>(
        `/assignments/${id}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({
        queryKey: ["assignments", variables.id],
      });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: SubmitAssignmentRequest;
    }) => {
      const response = await api.post<ApiResponse<AssignmentSubmission>>(
        `/assignments/${id}/submit`,
        data,
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["assignments", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      studentId,
      data,
    }: {
      assignmentId: string;
      studentId: string;
      data: GradeSubmissionRequest;
    }) => {
      const response = await api.post<ApiResponse<AssignmentSubmission>>(
        `/assignments/${assignmentId}/submissions/${studentId}/grade`,
        data,
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["assignments", variables.assignmentId, "submissions"],
      });
    },
  });
}
