import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Types
export interface DigitalCertificate {
  id: string;
  studentId: string;
  student?: {
    id: string;
    name: string;
    nis: string;
    photoUrl?: string;
    class?: { id: string; name: string };
  };
  certificateType: string;
  title: string;
  description?: string;
  certificateNumber: string;
  qrCode: string;
  verificationUrl: string;
  grade?: string;
  rank?: number;
  issueDate: string;
  signatoryName: string;
  signatoryTitle: string;
  signatureUrl?: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  downloadCount: number;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface SanadRecord {
  id: string;
  enrollmentId: string;
  enrollment?: {
    id: string;
    studentId: string;
    student?: {
      id: string;
      name: string;
      nis: string;
    };
  };
  teacherId: string;
  teacher?: {
    id: string;
    name: string;
    nip?: string;
  };
  juz: number;
  surahStart?: number;
  surahEnd?: number;
  certifiedAt: string;
  grade?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateFilters {
  studentId?: string;
  certificateType?: string;
  issueDateFrom?: string;
  issueDateTo?: string;
  isPublic?: boolean;
  page?: number;
  limit?: number;
}

export interface SanadFilters {
  enrollmentId?: string;
  teacherId?: string;
  juz?: number;
  certifiedFrom?: string;
  certifiedTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateCertificateData {
  studentId: string;
  certificateType: string;
  title: string;
  description?: string;
  grade?: string;
  rank?: number;
  issueDate: string;
  signatoryName: string;
  signatoryTitle: string;
  signatureUrl?: string;
  isPublic?: boolean;
}

export interface CreateSanadData {
  enrollmentId: string;
  teacherId: string;
  juz: number;
  surahStart?: number;
  surahEnd?: number;
  certifiedAt: string;
  grade?: string;
  notes?: string;
}

// Query Keys
export const certificateKeys = {
  all: ['certificates'] as const,
  lists: () => [...certificateKeys.all, 'list'] as const,
  list: (filters?: CertificateFilters) => [...certificateKeys.lists(), filters] as const,
  details: () => [...certificateKeys.all, 'detail'] as const,
  detail: (id: string) => [...certificateKeys.details(), id] as const,
  byStudent: (studentId: string) => [...certificateKeys.all, 'student', studentId] as const,
  verification: (code: string) => [...certificateKeys.all, 'verify', code] as const,
};

export const sanadKeys = {
  all: ['sanad'] as const,
  lists: () => [...sanadKeys.all, 'list'] as const,
  list: (filters?: SanadFilters) => [...sanadKeys.lists(), filters] as const,
  details: () => [...sanadKeys.all, 'detail'] as const,
  detail: (id: string) => [...sanadKeys.details(), id] as const,
  byEnrollment: (enrollmentId: string) => [...sanadKeys.all, 'enrollment', enrollmentId] as const,
  byStudent: (studentId: string) => [...sanadKeys.all, 'student', studentId] as const,
};

// Certificate Hooks

export function useCertificates(filters?: CertificateFilters) {
  return useQuery({
    queryKey: certificateKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      const response = await api.get<{
        data: DigitalCertificate[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>(`/certificates?${params.toString()}`);
      return response.data;
    },
  });
}

export function useCertificate(id: string) {
  return useQuery({
    queryKey: certificateKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<DigitalCertificate>(`/certificates/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useStudentCertificates(studentId: string) {
  return useQuery({
    queryKey: certificateKeys.byStudent(studentId),
    queryFn: async () => {
      const response = await api.get<{
        data: DigitalCertificate[];
        meta: { total: number };
      }>(`/certificates/student/${studentId}`);
      return response.data;
    },
    enabled: !!studentId,
  });
}

export function useVerifyCertificate(code: string) {
  return useQuery({
    queryKey: certificateKeys.verification(code),
    queryFn: async () => {
      const response = await api.get<{
        valid: boolean;
        certificate?: DigitalCertificate;
        message?: string;
      }>(`/certificates/verify/${code}`);
      return response.data;
    },
    enabled: !!code,
  });
}

export function useCreateCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCertificateData) => {
      const response = await api.post<DigitalCertificate>('/certificates', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.lists() });
    },
  });
}

export function useUpdateCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateCertificateData> }) => {
      const response = await api.put<DigitalCertificate>(`/certificates/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: certificateKeys.lists() });
    },
  });
}

export function useDeleteCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/certificates/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.lists() });
    },
  });
}

export function useGenerateCertificatePDF() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<{ pdfUrl: string }>(`/certificates/${id}/generate-pdf`);
      return response.data;
    },
  });
}

export function useDownloadCertificate() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.get(`/certificates/${id}/download`, {
        responseType: 'blob',
      });
      return response.data;
    },
  });
}

// Sanad Hooks

export function useSanadRecords(filters?: SanadFilters) {
  return useQuery({
    queryKey: sanadKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      const response = await api.get<{
        data: SanadRecord[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>(`/sanad?${params.toString()}`);
      return response.data;
    },
  });
}

export function useSanadRecord(id: string) {
  return useQuery({
    queryKey: sanadKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<SanadRecord>(`/sanad/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useStudentSanadRecords(studentId: string) {
  return useQuery({
    queryKey: sanadKeys.byStudent(studentId),
    queryFn: async () => {
      const response = await api.get<{
        data: SanadRecord[];
        totalJuz: number;
        juzList: number[];
      }>(`/sanad/student/${studentId}`);
      return response.data;
    },
    enabled: !!studentId,
  });
}

export function useEnrollmentSanadRecords(enrollmentId: string) {
  return useQuery({
    queryKey: sanadKeys.byEnrollment(enrollmentId),
    queryFn: async () => {
      const response = await api.get<{
        data: SanadRecord[];
        totalJuz: number;
      }>(`/sanad/enrollment/${enrollmentId}`);
      return response.data;
    },
    enabled: !!enrollmentId,
  });
}

export function useCreateSanad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSanadData) => {
      const response = await api.post<SanadRecord>('/sanad', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sanadKeys.lists() });
    },
  });
}

export function useUpdateSanad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateSanadData> }) => {
      const response = await api.put<SanadRecord>(`/sanad/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sanadKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: sanadKeys.lists() });
    },
  });
}

export function useDeleteSanad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/sanad/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sanadKeys.lists() });
    },
  });
}

// Generate sanad certificate
export function useGenerateSanadCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const response = await api.post<{
        certificate: DigitalCertificate;
        sanadRecords: SanadRecord[];
      }>(`/sanad/enrollment/${enrollmentId}/generate-certificate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.lists() });
    },
  });
}
