import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ClassEnrollment } from "@cipansor/shared";

// Response types
interface EnrollmentsResponse {
  data: ClassEnrollment[];
}

interface EnrollmentResponse {
  data: ClassEnrollment;
}

// Keys
const classKeys = {
  all: ["classes"] as const,
  lists: () => [...classKeys.all, "list"] as const,
  details: () => [...classKeys.all, "detail"] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
  enrollments: (classId: string) =>
    [...classKeys.detail(classId), "enrollments"] as const,
};

// Hooks

export function useClassEnrollments(classId: string) {
  return useQuery({
    queryKey: classKeys.enrollments(classId),
    queryFn: async () => {
      if (!classId) return [];
      const { data } = await api.get<EnrollmentsResponse>(
        `/classes/${classId}/enrollments`,
      );
      return data.data;
    },
    enabled: !!classId && classId !== "ALL",
  });
}

// Add other hooks if needed (enrollStudent, removeStudent)
export function useEnrollStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classId,
      studentId,
    }: {
      classId: string;
      studentId: string;
    }) => {
      const { data } = await api.post<EnrollmentResponse>(
        `/classes/${classId}/enrollments`,
        { studentId },
      );
      return data.data;
    },
    onSuccess: (_, { classId }) => {
      queryClient.invalidateQueries({
        queryKey: classKeys.enrollments(classId),
      });
    },
  });
}
