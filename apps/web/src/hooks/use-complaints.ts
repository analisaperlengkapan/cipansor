import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ComplaintStatus, ComplaintCategory } from "@cipansor/shared";
import { toast } from "sonner";

export interface Complaint {
  id: string;
  unitId: string;
  userId?: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  location?: string;
  status: ComplaintStatus;
  priority: string;
  isAnonymous: boolean;
  attachments?: string[];
  createdAt: string;
  resolution?: string;
  user?: {
    id: string;
    name: string;
    role: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
  _count?: {
    comments: number;
  };
  comments?: any[];
}

export interface ComplaintsResponse {
  data: Complaint[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const useComplaints = (params: {
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["complaints", params],
    queryFn: async () => {
      const response = await api.get<ComplaintsResponse>("/api/complaints", {
        params,
      });
      return response.data;
    },
  });
};

export const useComplaint = (id: string) => {
  return useQuery({
    queryKey: ["complaints", id],
    queryFn: async () => {
      const response = await api.get<Complaint>(`/api/complaints/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/api/complaints", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Aduan berhasil dikirim");
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal mengirim aduan");
    },
  });
};

export const useUpdateComplaintStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      resolution,
    }: {
      id: string;
      status: ComplaintStatus;
      resolution?: string;
    }) => {
      const response = await api.patch(`/api/complaints/${id}/status`, {
        status,
        resolution,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Status aduan diperbarui");
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["complaints", variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal memperbarui status");
    },
  });
};

export const useAddComplaintComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      content,
      isInternal,
    }: {
      id: string;
      content: string;
      isInternal?: boolean;
    }) => {
      const response = await api.post(`/api/complaints/${id}/comments`, {
        content,
        isInternal,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["complaints", variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal mengirim komentar");
    },
  });
};
