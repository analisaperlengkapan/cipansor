import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface LeaveBalance {
  id: string;
  userId: string;
  unitId: string;
  academicYearId: string;
  leaveType: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  notes?: string;
  updatedAt: string;
}

export function useLeaveBalances(userId: string, academicYearId?: string) {
  return useQuery({
    queryKey: ["leave-balances", userId, academicYearId],
    queryFn: async () => {
      const response = await api.get(`/hr/leave-balances/user/${userId}`, {
        params: { academicYearId },
      });
      return response.data.data as LeaveBalance[];
    },
    enabled: !!userId && !!academicYearId,
  });
}

export function useInitializeLeaveBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      academicYearId: string;
      leaveType: string;
      totalDays: number;
    }) => {
      const response = await api.post("/hr/leave-balances/initialize", data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["leave-balances", variables.userId],
      });
    },
  });
}

export function useUpdateLeaveBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      totalDays,
      userId,
    }: {
      id: string;
      totalDays: number;
      userId: string;
    }) => {
      const response = await api.patch(`/hr/leave-balances/${id}`, {
        totalDays,
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["leave-balances", variables.userId],
      });
    },
  });
}
