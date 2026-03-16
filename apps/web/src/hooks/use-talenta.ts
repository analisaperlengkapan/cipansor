import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const useTalentProfiles = (params?: { category?: string }) => {
  return useQuery({
    queryKey: ["talenta", "profiles", params],
    queryFn: async () => (await api.get("/api/talenta/profiles", { params })).data.data,
  });
};

export const useTalentProfile = (id: string) => {
  return useQuery({
    queryKey: ["talenta", "profiles", id],
    queryFn: async () => (await api.get(`/api/talenta/profiles/${id}`)).data.data,
    enabled: !!id,
  });
};

export const useTrainings = (params?: { status?: string }) => {
  return useQuery({
    queryKey: ["talenta", "trainings", params],
    queryFn: async () => (await api.get("/api/talenta/trainings", { params })).data.data,
  });
};

export const useSuccessions = () => {
  return useQuery({
    queryKey: ["talenta", "successions"],
    queryFn: async () => (await api.get("/api/talenta/successions")).data.data,
  });
};

export const useCreateTalentProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post("/api/talenta/profiles", data)).data,
    onSuccess: () => { toast.success("Profil talenta berhasil dibuat"); qc.invalidateQueries({ queryKey: ["talenta"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal membuat profil"); },
  });
};

export const useCreateAssessment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post("/api/talenta/assessments", data)).data,
    onSuccess: () => { toast.success("Penilaian berhasil dicatat"); qc.invalidateQueries({ queryKey: ["talenta"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal mencatat penilaian"); },
  });
};

export const useCreateTraining = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post("/api/talenta/trainings", data)).data,
    onSuccess: () => { toast.success("Program pelatihan berhasil dibuat"); qc.invalidateQueries({ queryKey: ["talenta"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal membuat pelatihan"); },
  });
};

export const useEnrollTraining = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { programId: string; userId: string }) => (await api.post("/api/talenta/trainings/enroll", data)).data,
    onSuccess: () => { toast.success("Peserta berhasil didaftarkan"); qc.invalidateQueries({ queryKey: ["talenta"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal mendaftarkan peserta"); },
  });
};

export const useCreateSuccession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post("/api/talenta/successions", data)).data,
    onSuccess: () => { toast.success("Rencana suksesi berhasil dibuat"); qc.invalidateQueries({ queryKey: ["talenta"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal membuat rencana suksesi"); },
  });
};

export const useUpdateSuccession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => (await api.put(`/api/talenta/successions/${id}`, data)).data,
    onSuccess: () => { toast.success("Rencana suksesi berhasil diperbarui"); qc.invalidateQueries({ queryKey: ["talenta"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal memperbarui rencana suksesi"); },
  });
};

export const useDeleteProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/talenta/profiles/${id}`)).data,
    onSuccess: () => { toast.success("Profil talenta berhasil dihapus"); qc.invalidateQueries({ queryKey: ["talenta"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal menghapus profil"); },
  });
};

export const useDeleteTraining = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/talenta/trainings/${id}`)).data,
    onSuccess: () => { toast.success("Program pelatihan berhasil dihapus"); qc.invalidateQueries({ queryKey: ["talenta"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal menghapus pelatihan"); },
  });
};

export const useDeleteSuccession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/talenta/successions/${id}`)).data,
    onSuccess: () => { toast.success("Rencana suksesi berhasil dihapus"); qc.invalidateQueries({ queryKey: ["talenta"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal menghapus rencana suksesi"); },
  });
};

// Aliases for consistent naming in pages
export const useCreateProfile = useCreateTalentProfile;

