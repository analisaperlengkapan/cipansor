import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type EmploymentAction =
  | "HIRED"
  | "PROMOTED"
  | "DEMOTED"
  | "TRANSFERRED"
  | "TERMINATED"
  | "RESIGNED"
  | "RETIRED"
  | "SALARY_ADJUSTMENT";

export interface EmploymentHistory {
  id: string;
  userId: string;
  action: EmploymentAction;
  previousPosition?: string;
  newPosition: string;
  previousDepartment?: string;
  newDepartment?: string;
  effectiveDate: string;
  notes?: string;
  createdAt: string;
}

export function useEmploymentHistory(userId: string) {
  return useQuery({
    queryKey: ["employment-history", userId],
    queryFn: async () => {
      const response = await api.get(`/hr/employees/${userId}/history`);
      return response.data.data as EmploymentHistory[];
    },
    enabled: !!userId,
  });
}

export function useCreateEmploymentHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<EmploymentHistory>) => {
      const response = await api.post("/hr/history", data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      if (variables.userId) {
        queryClient.invalidateQueries({
          queryKey: ["employment-history", variables.userId],
        });
      }
    },
  });
}
