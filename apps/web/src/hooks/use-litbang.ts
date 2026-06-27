import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

// ── Research Projects ───────────────────────────────
export const useProjects = (params?: { status?: string; category?: string }) => {
  return useQuery({
    queryKey: ["litbang", "projects", params],
    queryFn: async () => (await api.get("/litbang/projects", { params })).data.data,
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ["litbang", "projects", id],
    queryFn: async () => (await api.get(`/litbang/projects/${id}`)).data.data,
    enabled: !!id,
  });
};

export const useProjectFinances = (id: string) => {
  return useQuery({
    queryKey: ["litbang", "projects", id, "finances"],
    queryFn: async () => (await api.get(`/litbang/projects/${id}/finances`)).data.data,
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post("/litbang/projects", data)).data,
    onSuccess: () => { toast.success("Proyek penelitian berhasil dibuat"); qc.invalidateQueries({ queryKey: ["litbang"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal membuat proyek"); },
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & any) => (await api.put(`/litbang/projects/${id}`, data)).data,
    onSuccess: () => { toast.success("Proyek berhasil diperbarui"); qc.invalidateQueries({ queryKey: ["litbang"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal memperbarui proyek"); },
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/litbang/projects/${id}`)).data,
    onSuccess: () => { toast.success("Proyek berhasil dihapus"); qc.invalidateQueries({ queryKey: ["litbang"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal menghapus proyek"); },
  });
};

// ── Milestones ──────────────────────────────────────
export const useCreateMilestone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post("/litbang/milestones", data)).data,
    onSuccess: () => { toast.success("Milestone berhasil ditambahkan"); qc.invalidateQueries({ queryKey: ["litbang"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal menambahkan milestone"); },
  });
};

export const useUpdateMilestone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & any) => (await api.put(`/litbang/milestones/${id}`, data)).data,
    onSuccess: () => { toast.success("Milestone berhasil diperbarui"); qc.invalidateQueries({ queryKey: ["litbang"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal memperbarui milestone"); },
  });
};

// ── Innovation Proposals ────────────────────────────
export const useProposals = (params?: { status?: string; category?: string }) => {
  return useQuery({
    queryKey: ["litbang", "proposals", params],
    queryFn: async () => (await api.get("/litbang/proposals", { params })).data.data,
  });
};

export const useCreateProposal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post("/litbang/proposals", data)).data,
    onSuccess: () => { toast.success("Usulan inovasi berhasil diajukan"); qc.invalidateQueries({ queryKey: ["litbang"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal mengajukan usulan"); },
  });
};

export const useUpdateProposal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & any) => (await api.put(`/litbang/proposals/${id}`, data)).data,
    onSuccess: () => { toast.success("Usulan berhasil diperbarui"); qc.invalidateQueries({ queryKey: ["litbang"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal memperbarui usulan"); },
  });
};

export const useEvaluateProposal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; score: number; feedback?: string }) => (await api.post(`/litbang/proposals/${id}/evaluate`, data)).data,
    onSuccess: () => { toast.success("Evaluasi berhasil disimpan"); qc.invalidateQueries({ queryKey: ["litbang"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal melakukan evaluasi"); },
  });
};

export const useDeleteProposal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/litbang/proposals/${id}`)).data,
    onSuccess: () => { toast.success("Usulan berhasil dihapus"); qc.invalidateQueries({ queryKey: ["litbang"] }); },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Gagal menghapus usulan"); },
  });
};

export const useLitbangSummary = () => {
  return useQuery({
    queryKey: ["litbang", "summary"],
    queryFn: async () => (await api.get("/litbang/summary")).data.data,
  });
};
