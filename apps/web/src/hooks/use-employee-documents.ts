import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type EmployeeDocumentType =
  | "KTP"
  | "KK"
  | "NPWP"
  | "IJAZAH"
  | "TRANSKRIP_NILAI"
  | "SERTIFIKAT"
  | "SK_PENGANGKATAN"
  | "KONTRAK_KERJA"
  | "CV"
  | "LAINNYA";

export interface EmployeeDocument {
  id: string;
  userId: string;
  name: string;
  type: EmployeeDocumentType;
  fileUrl: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
}

export function useEmployeeDocuments(userId: string) {
  return useQuery({
    queryKey: ["employee-documents", userId],
    queryFn: async () => {
      const response = await api.get(`/hr/employees/${userId}/documents`);
      return response.data.data as EmployeeDocument[];
    },
    enabled: !!userId,
  });
}

export function useCreateEmployeeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<EmployeeDocument>) => {
      const response = await api.post("/hr/documents", data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      if (variables.userId) {
        queryClient.invalidateQueries({
          queryKey: ["employee-documents", variables.userId],
        });
      }
    },
  });
}

export function useDeleteEmployeeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hr/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents"] });
    },
  });
}
