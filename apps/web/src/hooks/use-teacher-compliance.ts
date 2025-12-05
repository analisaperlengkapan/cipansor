import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { ApiResponse } from '@/lib/api';

// ==================== TYPES ====================

export const CERTIFICATION_STATUS = [
  { value: 'BELUM_SERTIFIKASI', label: 'Belum Sertifikasi' },
  { value: 'SUDAH_SERTIFIKASI', label: 'Sudah Sertifikasi' },
  { value: 'DALAM_PROSES', label: 'Dalam Proses' },
] as const;

export const GOLONGAN_TYPES = [
  { value: 'I/a', label: 'I/a - Juru Muda' },
  { value: 'I/b', label: 'I/b - Juru Muda Tingkat I' },
  { value: 'I/c', label: 'I/c - Juru' },
  { value: 'I/d', label: 'I/d - Juru Tingkat I' },
  { value: 'II/a', label: 'II/a - Pengatur Muda' },
  { value: 'II/b', label: 'II/b - Pengatur Muda Tingkat I' },
  { value: 'II/c', label: 'II/c - Pengatur' },
  { value: 'II/d', label: 'II/d - Pengatur Tingkat I' },
  { value: 'III/a', label: 'III/a - Penata Muda' },
  { value: 'III/b', label: 'III/b - Penata Muda Tingkat I' },
  { value: 'III/c', label: 'III/c - Penata' },
  { value: 'III/d', label: 'III/d - Penata Tingkat I' },
  { value: 'IV/a', label: 'IV/a - Pembina' },
  { value: 'IV/b', label: 'IV/b - Pembina Tingkat I' },
  { value: 'IV/c', label: 'IV/c - Pembina Utama Muda' },
  { value: 'IV/d', label: 'IV/d - Pembina Utama Madya' },
  { value: 'IV/e', label: 'IV/e - Pembina Utama' },
] as const;

export type CertificationStatus = typeof CERTIFICATION_STATUS[number]['value'];

export interface TeacherComplianceData {
  id: string;
  nip?: string;
  nuptk?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  
  // Identity
  nik?: string;
  noKK?: string;
  
  // Address
  address?: string;
  rt?: string;
  rw?: string;
  villageId?: string;
  village?: {
    id: string;
    name: string;
    district?: {
      id: string;
      name: string;
      regency?: {
        id: string;
        name: string;
        province?: {
          id: string;
          name: string;
        };
      };
    };
  };
  
  // Employment
  pangkat?: string;
  golongan?: string;
  tmtPNS?: string;
  tmtGuru?: string;
  employmentType?: string;
  
  // Education
  highestEducation?: string;
  educationMajor?: string;
  educationInstitution?: string;
  graduationYear?: number;
  
  // Certification
  certificationStatus?: CertificationStatus;
  certificationNumber?: string;
  certificationYear?: number;
  certificationSubject?: string;
  
  // Bank info
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  
  // Working hours
  weeklyHours?: number;
  
  // Unit info
  unit?: {
    id: string;
    name: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface TeacherComplianceReport {
  totalTeachers: number;
  complete: number;
  incomplete: number;
  completionRate: number;
  missingFields: {
    field: string;
    count: number;
    percentage: number;
  }[];
}

export interface SimtunReadyReport {
  total: number;
  ready: number;
  notReady: number;
  readyPercentage: number;
  issues: {
    teacherId: string;
    teacherName: string;
    nip?: string;
    missingFields: string[];
  }[];
}

export interface CertificationReport {
  total: number;
  certified: number;
  notCertified: number;
  inProcess: number;
  certifiedPercentage: number;
  byYear: {
    year: number;
    count: number;
  }[];
}

// ==================== HOOKS ====================

interface UseTeacherComplianceParams {
  page?: number;
  limit?: number;
  search?: string;
  unitId?: string;
}

export function useTeacherComplianceList(params?: UseTeacherComplianceParams) {
  return useQuery({
    queryKey: ['teacher-compliance', 'list', params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<TeacherComplianceData[]>>('/hr/teachers', { 
        params: {
          ...params,
          expand: 'compliance',
        }
      });
      return response.data.data;
    },
  });
}

export function useTeacherCompliance(teacherId: string) {
  return useQuery({
    queryKey: ['teacher-compliance', teacherId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<TeacherComplianceData>>(`/teacher-compliance/${teacherId}`);
      return response.data.data;
    },
    enabled: !!teacherId,
  });
}

export interface UpdateTeacherComplianceData {
  // Identity
  nik?: string;
  noKK?: string;
  nuptk?: string;
  
  // Address
  address?: string;
  rt?: string;
  rw?: string;
  villageId?: string;
  
  // Employment
  pangkat?: string;
  golongan?: string;
  tmtPNS?: string;
  tmtGuru?: string;
  employmentType?: string;
  
  // Education
  highestEducation?: string;
  educationMajor?: string;
  educationInstitution?: string;
  graduationYear?: number;
  
  // Certification
  certificationStatus?: CertificationStatus;
  certificationNumber?: string;
  certificationYear?: number;
  certificationSubject?: string;
  
  // Bank info
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  
  // Working hours
  weeklyHours?: number;
}

export function useUpdateTeacherCompliance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teacherId, data }: { teacherId: string; data: UpdateTeacherComplianceData }) => {
      const response = await api.put<ApiResponse<TeacherComplianceData>>(`/teacher-compliance/${teacherId}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-compliance', variables.teacherId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-compliance', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-compliance', 'report'] });
    },
  });
}

export function useBulkUpdateTeacherCompliance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: { teacherId: string; data: UpdateTeacherComplianceData }[]) => {
      const response = await api.post<ApiResponse<{ updated: number }>>('/teacher-compliance/bulk-update', {
        updates,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-compliance'] });
    },
  });
}

// ==================== REPORTS ====================

export function useTeacherComplianceReport(unitId?: string) {
  return useQuery({
    queryKey: ['teacher-compliance', 'report', 'completeness', unitId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<TeacherComplianceReport>>('/teacher-compliance/report/completeness', {
        params: unitId ? { unitId } : undefined,
      });
      return response.data.data;
    },
  });
}

export function useSimtunReadyReport(unitId?: string) {
  return useQuery({
    queryKey: ['teacher-compliance', 'report', 'simtun', unitId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<SimtunReadyReport>>('/teacher-compliance/report/simtun-ready', {
        params: unitId ? { unitId } : undefined,
      });
      return response.data.data;
    },
  });
}

export function useCertificationReport(unitId?: string) {
  return useQuery({
    queryKey: ['teacher-compliance', 'report', 'certification', unitId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<CertificationReport>>('/teacher-compliance/report/certification', {
        params: unitId ? { unitId } : undefined,
      });
      return response.data.data;
    },
  });
}
