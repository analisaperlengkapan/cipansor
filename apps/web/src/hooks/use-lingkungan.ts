import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const useEnvironmentPrograms = (params?: { status?: string; category?: string }) => {
  return useQuery({
    queryKey: ["lingkungan", "programs", params],
    queryFn: async () => (await api.get("/api/lingkungan/programs", { params })).data.data,
  });
};

export const useWasteRecords = () => {
  return useQuery({
    queryKey: ["lingkungan", "waste"],
    queryFn: async () => (await api.get("/api/lingkungan/waste")).data.data,
  });
};

export const useWasteSummary = () => {
  return useQuery({
    queryKey: ["lingkungan", "waste", "summary"],
    queryFn: async () => (await api.get("/api/lingkungan/waste/summary")).data.data,
  });
};

export const useGreenIndicators = () => {
  return useQuery({
    queryKey: ["lingkungan", "indicators"],
    queryFn: async () => (await api.get("/api/lingkungan/indicators")).data.data,
  });
};

export const useCreateProgram = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post("/api/lingkungan/programs", data)).data,
    onSuccess: () => { toast.success("Program lingkungan berhasil dibuat"); qc.invalidateQueries({ queryKey: ["lingkungan"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal membuat program"); },
  });
};

export const useCreateWasteRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post("/api/lingkungan/waste", data)).data,
    onSuccess: () => { toast.success("Data sampah berhasil dicatat"); qc.invalidateQueries({ queryKey: ["lingkungan"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal mencatat data"); },
  });
};

export const useUpdateProgram = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & any) => (await api.put(`/api/lingkungan/programs/${id}`, data)).data,
    onSuccess: () => { toast.success("Program berhasil diperbarui"); qc.invalidateQueries({ queryKey: ["lingkungan"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal memperbarui program"); },
  });
};

export const useDeleteProgram = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/lingkungan/programs/${id}`)).data,
    onSuccess: () => { toast.success("Program berhasil dihapus"); qc.invalidateQueries({ queryKey: ["lingkungan"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal menghapus program"); },
  });
};

export const useCreateIndicator = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post("/api/lingkungan/indicators", data)).data,
    onSuccess: () => { toast.success("Indikator berhasil ditambahkan"); qc.invalidateQueries({ queryKey: ["lingkungan"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal menambahkan indikator"); },
  });
};

// Alias for backwards compatibility
export const useCreateGreenIndicator = useCreateIndicator;
