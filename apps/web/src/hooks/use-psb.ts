import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// Types
export type RegistrationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "DOCUMENT_REVIEW"
  | "TEST_SCHEDULED"
  | "TEST_COMPLETED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_COMPLETED"
  | "ACCEPTED"
  | "REJECTED"
  | "ENROLLED";

export const REGISTRATION_STATUSES: RegistrationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "DOCUMENT_REVIEW",
  "TEST_SCHEDULED",
  "TEST_COMPLETED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_COMPLETED",
  "ACCEPTED",
  "REJECTED",
  "ENROLLED",
];

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Diajukan",
  DOCUMENT_REVIEW: "Review Dokumen",
  TEST_SCHEDULED: "Tes Dijadwalkan",
  TEST_COMPLETED: "Tes Selesai",
  INTERVIEW_SCHEDULED: "Wawancara Dijadwalkan",
  INTERVIEW_COMPLETED: "Wawancara Selesai",
  ACCEPTED: "Diterima",
  REJECTED: "Ditolak",
  ENROLLED: "Terdaftar",
};

export const REGISTRATION_STATUS_COLORS: Record<RegistrationStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  DOCUMENT_REVIEW: "bg-yellow-100 text-yellow-800",
  TEST_SCHEDULED: "bg-purple-100 text-purple-800",
  TEST_COMPLETED: "bg-purple-100 text-purple-800",
  INTERVIEW_SCHEDULED: "bg-indigo-100 text-indigo-800",
  INTERVIEW_COMPLETED: "bg-indigo-100 text-indigo-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  ENROLLED: "bg-emerald-100 text-emerald-800",
};

export type Gender = "MALE" | "FEMALE";

export interface RegistrationPeriod {
  id: string;
  name: string;
  academicYearId: string;
  academicYear?: {
    id: string;
    name: string;
  };
  startDate: string;
  endDate: string;
  quota: number;
  registrationFee: number;
  isActive: boolean;
  description?: string;
  requirements?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  id: string;
  registrationNumber: string;
  periodId: string;
  period?: RegistrationPeriod;
  unitId: string;
  unit?: {
    id: string;
    name: string;
  };
  status: RegistrationStatus;

  // Student info
  fullName: string;
  nickname?: string;
  gender: Gender;
  birthPlace: string;
  birthDate: string;
  nationalId?: string;
  familyCardNumber?: string;

  // Previous school
  previousSchool?: string;
  previousSchoolAddress?: string;
  graduationYear?: number;

  // Parent info
  fatherName: string;
  fatherOccupation?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  motherName: string;
  motherOccupation?: string;
  motherPhone?: string;

  // Address
  address: string;
  village: string;
  district: string;
  city: string;
  province: string;
  postalCode?: string;

  // Quran ability
  quranAbility?: string;
  memorizedJuz?: number;

  // Documents
  photoUrl?: string;
  birthCertificateUrl?: string;
  familyCardUrl?: string;
  diplomaUrl?: string;
  healthCertificateUrl?: string;

  // Test & Interview
  testScore?: number;
  testDate?: string;
  testNotes?: string;
  interviewDate?: string;
  interviewNotes?: string;
  interviewScore?: number;

  // Decision
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  enrolledAt?: string;
  studentId?: string;

  // Marketing
  source?: string;
  campaignId?: string;
  campaign?: {
    id: string;
    name: string;
    code: string;
  };

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationStats {
  total: number;
  byStatus: Record<RegistrationStatus, number>;
  byGender: Record<Gender, number>;
  quota: number;
  accepted: number;
  enrolled: number;
}

// Period queries
export function useRegistrationPeriods(params?: {
  isActive?: boolean;
  academicYearId?: string;
}) {
  return useQuery({
    queryKey: ["registration-periods", params],
    queryFn: async () => {
      const response = await api.get("/psb/periods", { params });
      return response.data.data as RegistrationPeriod[];
    },
  });
}

export function useRegistrationPeriod(id: string) {
  return useQuery({
    queryKey: ["registration-period", id],
    queryFn: async () => {
      const response = await api.get(`/psb/periods/${id}`);
      return response.data.data as RegistrationPeriod;
    },
    enabled: !!id,
  });
}

export function useActivePeriod() {
  return useQuery({
    queryKey: ["active-registration-period"],
    queryFn: async () => {
      const response = await api.get("/psb/periods/active");
      return response.data.data as RegistrationPeriod;
    },
  });
}

export function useCreateRegistrationPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<RegistrationPeriod>) => {
      const response = await api.post("/psb/periods", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-periods"] });
    },
  });
}

export function useUpdateRegistrationPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<RegistrationPeriod>;
    }) => {
      const response = await api.put(`/psb/periods/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-periods"] });
    },
  });
}

export function useDeleteRegistrationPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/psb/periods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-periods"] });
    },
  });
}

// Registration queries
export function useRegistrations(params?: {
  periodId?: string;
  status?: RegistrationStatus;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["registrations", params],
    queryFn: async () => {
      const response = await api.get("/psb/registrations", { params });
      return response.data as {
        data: Registration[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
    },
  });
}

export function useRegistration(id: string) {
  return useQuery({
    queryKey: ["registration", id],
    queryFn: async () => {
      const response = await api.get(`/psb/registrations/${id}`);
      return response.data.data as Registration;
    },
    enabled: !!id,
  });
}

export function useRegistrationStats(periodId?: string) {
  return useQuery({
    queryKey: ["registration-stats", periodId],
    queryFn: async () => {
      const response = await api.get("/psb/registrations/stats", {
        params: { periodId },
      });
      return response.data.data as RegistrationStats;
    },
  });
}

export function useCreateRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post("/psb/registrations", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registration-stats"] });
    },
  });
}

export function useUpdateRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const response = await api.put(`/psb/registrations/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registration", id] });
      queryClient.invalidateQueries({ queryKey: ["registration-stats"] });
    },
  });
}

export function useUpdateRegistrationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: RegistrationStatus;
      notes?: string;
    }) => {
      const response = await api.patch(`/psb/registrations/${id}/status`, {
        status,
        notes,
      });
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registration", id] });
      queryClient.invalidateQueries({ queryKey: ["registration-stats"] });
    },
  });
}

export function useScheduleTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      testDate,
      notes,
    }: {
      id: string;
      testDate: string;
      notes?: string;
    }) => {
      const response = await api.post(
        `/psb/registrations/${id}/schedule-test`,
        {
          testDate,
          notes,
        },
      );
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registration", id] });
    },
  });
}

export function useRecordTestResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      score,
      notes,
    }: {
      id: string;
      score: number;
      notes?: string;
    }) => {
      const response = await api.post(`/psb/registrations/${id}/test-result`, {
        score,
        notes,
      });
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registration", id] });
    },
  });
}

export function useScheduleInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      interviewDate,
      notes,
    }: {
      id: string;
      interviewDate: string;
      notes?: string;
    }) => {
      const response = await api.post(
        `/psb/registrations/${id}/schedule-interview`,
        {
          interviewDate,
          notes,
        },
      );
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registration", id] });
    },
  });
}

export function useRecordInterviewResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      score,
      notes,
    }: {
      id: string;
      score: number;
      notes?: string;
    }) => {
      const response = await api.post(
        `/psb/registrations/${id}/interview-result`,
        {
          score,
          notes,
        },
      );
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registration", id] });
    },
  });
}

export function useAcceptRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await api.post(`/psb/registrations/${id}/accept`, {
        notes,
      });
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registration", id] });
      queryClient.invalidateQueries({ queryKey: ["registration-stats"] });
    },
  });
}

export function useRejectRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.post(`/psb/registrations/${id}/reject`, {
        reason,
      });
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registration", id] });
      queryClient.invalidateQueries({ queryKey: ["registration-stats"] });
    },
  });
}

export function useEnrollRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      classId,
      roomId,
    }: {
      id: string;
      classId: string;
      roomId?: string;
    }) => {
      const response = await api.post(`/psb/registrations/${id}/enroll`, {
        classId,
        roomId,
      });
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registration", id] });
      queryClient.invalidateQueries({ queryKey: ["registration-stats"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

/**
 * End-to-End Orchestrator API trigger
 * Memicu integrasi PPDB -> Finance -> Health -> Akademik
 */
export function useOnboardRegistrant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      registrantId: string;
      unitId: string;
      academicYearId: string;
      parentUserId: string;
      assignedClassId?: string;
    }) => {
      // Endpoint ini berada di ppdb-wave router sesuai master plan
      const response = await api.post(`/ppdb-wave/onboard-registrant`, payload);
      return response.data;
    },
    onSuccess: (_, { registrantId }) => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registration", registrantId] });
      queryClient.invalidateQueries({ queryKey: ["registration-stats"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      // We might also want to invalidate finance, medical, etc, or just let them fetch fresh data on navigation
    },
  });
}

export function useDeleteRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/psb/registrations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registration-stats"] });
    },
  });
}
