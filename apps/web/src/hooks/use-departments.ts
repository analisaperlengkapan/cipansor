import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Department } from "@/hooks/use-hr"; // Import type from use-hr or define locally if needed

export function useDepartments(params?: {
  unitId?: string;
  isActive?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: ["departments", params],
    queryFn: async () => {
      const response = await api.get("/hr/departments", { params });
      return response.data.data as Department[];
    },
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: ["department", id],
    queryFn: async () => {
      const response = await api.get(`/hr/departments/${id}`);
      return response.data.data as Department;
    },
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Department>) => {
      const response = await api.post("/hr/departments", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Department>;
    }) => {
      const response = await api.patch(`/hr/departments/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["department"] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hr/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}
