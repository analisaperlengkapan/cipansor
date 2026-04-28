import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// --- Admission Periods ---
export function useAdmissionPeriods(params?: any) {
  return useQuery({
    queryKey: ["admission-periods", params],
    queryFn: async () => {
      const response = await api.get("/admissions/periods", { params });
      return response.data;
    },
  });
}

export function useAdmissionPeriod(id: string) {
  return useQuery({
    queryKey: ["admission-period", id],
    queryFn: async () => {
      const response = await api.get(`/admissions/periods/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

// --- Admission Waves ---
export function useAdmissionWaves(params?: any) {
  return useQuery({
    queryKey: ["admission-waves", params],
    queryFn: async () => {
      const response = await api.get("/admissions/waves", { params });
      return response.data;
    },
  });
}

export function useAdmissionWave(id: string) {
  return useQuery({
    queryKey: ["admission-wave", id],
    queryFn: async () => {
      const response = await api.get(`/admissions/waves/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

// --- Registrants ---
export function useRegistrants(params?: any) {
  return useQuery({
    queryKey: ["admission-registrants", params],
    queryFn: async () => {
      const response = await api.get("/admissions/registrants", { params });
      return response.data;
    },
  });
}

export function useRegistrant(id: string) {
  return useQuery({
    queryKey: ["admission-registrant", id],
    queryFn: async () => {
      const response = await api.get(`/admissions/registrants/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useOnboardRegistrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post(`/admissions/registrants/${payload.registrantId}/onboard`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-registrants"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useUpdateRegistrantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: any) => {
      const response = await api.patch(`/admissions/registrants/${id}/status`, { status, notes });
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["admission-registrants"] });
      queryClient.invalidateQueries({ queryKey: ["admission-registrant", id] });
    },
  });
}

// Backward compatibility aliases
export { useAdmissionPeriods as useRegistrationPeriods };
export { useRegistrants as useRegistrations };

export function usePriorityLeads() {
  return useQuery({
    queryKey: ["priority-leads"],
    queryFn: async () => {
      const response = await api.get("/admissions/leads/priority");
      return response.data;
    },
  });
}
