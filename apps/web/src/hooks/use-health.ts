import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { SharedPaginatedResponse } from "@/lib/api";
import {
  MedicalRecord,
  MedicalRecordType,
  MedicalRecordType as HealthRecordType,
  HealthStatus,
  CreateMedicalRecordInput,
  UpdateMedicalRecordInput,
  HealthStats,
  Medication,
  CreateMedicationInput,
  UpdateMedicationInput,
  MedicationUsageLog,
  CreateMedicationUsageInput,
} from "@cipansor/shared";

export type { MedicalRecord };
export { HealthStatus, MedicalRecordType as HealthRecordType };

// --- LOCAL TYPES FOR IMMUNIZATION (Pending Shared Update) ---
export interface ImmunizationRecord {
  id: string;
  studentId: string;
  unitId: string;
  vaccineName: string;
  vaccineCode?: string | null;
  doseNumber: number;
  scheduledDate?: Date | string | null;
  administeredDate?: Date | string | null;
  administeredAt?: string | null;
  batchNumber?: string | null;
  notes?: string | null;
  status: "PENDING" | "COMPLETED" | "SKIPPED";

  student?: {
    id: string;
    user?: { name: string };
  };
  recordedBy?: {
    id: string;
    name: string;
  };
}

export interface CreateImmunizationRecordInput {
  studentId: string;
  unitId: string;
  vaccineName: string;
  vaccineCode?: string;
  doseNumber: number;
  scheduledDate?: Date | string;
  administeredDate?: Date | string;
  administeredAt?: string;
  batchNumber?: string;
  notes?: string;
  status?: "PENDING" | "COMPLETED" | "SKIPPED";
}

// Constants
export const HEALTH_RECORD_TYPES: {
  value: MedicalRecordType;
  label: string;
}[] = [
  { value: MedicalRecordType.CHECKUP, label: "Pemeriksaan Rutin" },
  { value: MedicalRecordType.ILLNESS, label: "Sakit" },
  { value: MedicalRecordType.INJURY, label: "Cedera" },
  { value: MedicalRecordType.FIRST_AID, label: "Pertolongan Pertama" },
  { value: MedicalRecordType.REFERRAL, label: "Rujukan" },
  { value: MedicalRecordType.VACCINATION, label: "Vaksinasi" },
];

export const HEALTH_STATUSES: {
  value: string;
  label: string;
  color: string;
}[] = [
  {
    value: HealthStatus.HEALTHY,
    label: "Sehat",
    color: "bg-green-100 text-green-800",
  },
  {
    value: HealthStatus.SICK,
    label: "Sakit",
    color: "bg-red-100 text-red-800",
  },
  {
    value: HealthStatus.RECOVERING,
    label: "Pemulihan",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: HealthStatus.HOSPITALIZED,
    label: "Rawat Inap",
    color: "bg-purple-100 text-purple-800",
  },
];

// Helper to extract status from notes if needed, or use future field
export function getRecordStatus(record: MedicalRecord): string {
  if (record.status) return record.status;
  // Fallback parsing from notes if status not direct field
  if (record.notes?.includes('"status":"SICK"')) return HealthStatus.SICK;
  return HealthStatus.HEALTHY;
}

// ==================== MEDICAL RECORDS ====================

export function useHealthRecords(params?: {
  page?: number;
  limit?: number;
  studentId?: string;
  recordType?: MedicalRecordType; // Fixed param name to match usage
  status?: HealthStatus; // Fixed type
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["health-records", params],
    queryFn: async () => {
      const response = await api.get<SharedPaginatedResponse<MedicalRecord>>(
        "/health/records",
        { params },
      );
      return response.data;
    },
  });
}

export function useHealthRecord(id: string) {
  return useQuery({
    queryKey: ["health-records", id],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: MedicalRecord }>(
        `/health/records/${id}`,
      );
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useStudentHealthRecords(studentId: string) {
  return useQuery({
    queryKey: ["health-records", "student", studentId],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: MedicalRecord[];
      }>(`/health/students/${studentId}/history`);
      return response.data.data;
    },
    enabled: !!studentId,
  });
}

export function useCreateHealthRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMedicalRecordInput) => {
      const response = await api.post<{
        success: boolean;
        data: MedicalRecord;
      }>("/health/records", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-records"] });
      queryClient.invalidateQueries({ queryKey: ["health-stats"] });
      queryClient.invalidateQueries({ queryKey: ["health-summary"] });
    },
  });
}

export function useUpdateHealthRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMedicalRecordInput;
    }) => {
      const response = await api.put<{ success: boolean; data: MedicalRecord }>(
        `/health/records/${id}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-records"] });
    },
  });
}

export function useDeleteHealthRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/health/records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-records"] });
    },
  });
}

// ==================== MEDICATIONS ====================

export function useMedications(params?: {
  page?: number;
  limit?: number;
  unitId?: string;
  search?: string;
  lowStock?: boolean;
}) {
  return useQuery({
    queryKey: ["medications", params],
    queryFn: async () => {
      const response = await api.get<SharedPaginatedResponse<Medication>>(
        "/health/medications",
        { params },
      );
      return response.data;
    },
  });
}

export function useMedication(id: string) {
  return useQuery({
    queryKey: ["medications", id],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Medication }>(
        `/health/medications/${id}`,
      );
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMedicationInput) => {
      const response = await api.post<{ success: boolean; data: Medication }>(
        "/health/medications",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      queryClient.invalidateQueries({ queryKey: ["health-summary"] });
    },
  });
}

export function useUpdateMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMedicationInput;
    }) => {
      const response = await api.put<{ success: boolean; data: Medication }>(
        `/health/medications/${id}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}

export function useDeleteMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/health/medications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}

export function useAddMedicationStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      quantity,
    }: {
      id: string;
      quantity: number;
    }) => {
      const response = await api.post<{ success: boolean; data: Medication }>(
        `/health/medications/${id}/stock`,
        { quantity },
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      queryClient.invalidateQueries({ queryKey: ["health-summary"] });
    },
  });
}

// ==================== MEDICATION USAGE ====================

export function useMedicationUsageLogs(params?: {
  page?: number;
  limit?: number;
  medicationId?: string;
  studentId?: string;
}) {
  return useQuery({
    queryKey: ["medication-usage", params],
    queryFn: async () => {
      const response = await api.get<SharedPaginatedResponse<MedicationUsageLog>>(
        "/health/usage",
        { params },
      );
      return response.data;
    },
  });
}

export function useCreateMedicationUsage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMedicationUsageInput) => {
      const response = await api.post<{
        success: boolean;
        data: MedicationUsageLog;
      }>("/health/usage", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medication-usage"] });
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}

// ==================== IMMUNIZATION ====================

export function useImmunizationRecords(params?: {
  page?: number;
  limit?: number;
  studentId?: string;
  vaccineName?: string;
}) {
  return useQuery({
    queryKey: ["immunization", params],
    queryFn: async () => {
      const response = await api.get<
        SharedPaginatedResponse<ImmunizationRecord>
      >("/health/immunization", { params });
      return response.data;
    },
  });
}

export function useCreateImmunizationRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateImmunizationRecordInput) => {
      const response = await api.post<{
        success: boolean;
        data: ImmunizationRecord;
      }>("/health/immunization", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["immunization"] });
    },
  });
}

// ==================== STATS ====================

export function useHealthStats(unitId: string) {
  return useQuery({
    queryKey: ["health-stats", unitId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: HealthStats }>(
        `/health/stats/${unitId}`,
      );
      return response.data.data;
    },
    enabled: !!unitId,
  });
}

export function useHealthSummary() {
  return useQuery({
    queryKey: ["health-summary"],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: HealthStats }>(
        "/health/summary",
      );
      return response.data.data;
    },
  });
}
