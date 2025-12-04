import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { ApiResponse, PaginatedResponse } from '@/lib/api';

export type CertificateType = 'GRADUATION' | 'TAHFIDZ' | 'ACHIEVEMENT' | 'COURSE_COMPLETION' | 'APPRECIATION';

export interface Certificate {
  id: string;
  studentId: string;
  type: CertificateType;
  title: string;
  description?: string;
  issuedDate: string;
  validUntil?: string;
  certificateNumber: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    name: string;
    nis: string;
    nisn?: string;
    birthDate: string;
    birthPlace?: string;
    parentName?: string;
    class?: { name: string };
    unit?: { name: string; level?: string };
  };
}

export interface CertificateTemplate {
  type: CertificateType;
  label: string;
  labelEn: string;
  description: string;
  icon: string;
  color: string;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'date' | 'number' | 'select';
    required?: boolean;
    options?: string[];
  }[];
}

export const CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  {
    type: 'GRADUATION',
    label: 'Ijazah / Surat Kelulusan',
    labelEn: 'Graduation Certificate',
    description: 'Sertifikat kelulusan untuk santri yang telah menyelesaikan pendidikan',
    icon: 'GraduationCap',
    color: 'bg-blue-100 text-blue-800',
    fields: [
      { key: 'graduationYear', label: 'Tahun Kelulusan', type: 'number', required: true },
      { key: 'finalGrade', label: 'Nilai Akhir', type: 'text' },
      { key: 'rank', label: 'Peringkat', type: 'number' },
      { key: 'program', label: 'Program Studi', type: 'text' },
    ],
  },
  {
    type: 'TAHFIDZ',
    label: 'Syahadah Tahfidz',
    labelEn: 'Quran Memorization Certificate',
    description: 'Sertifikat pencapaian hafalan Al-Quran',
    icon: 'BookOpen',
    color: 'bg-emerald-100 text-emerald-800',
    fields: [
      { key: 'juzCount', label: 'Jumlah Juz', type: 'number', required: true },
      { key: 'completedJuz', label: 'Juz yang Dikhatamkan', type: 'text', required: true },
      { key: 'grade', label: 'Predikat', type: 'select', options: ['Mumtaz', 'Jayyid Jiddan', 'Jayyid', 'Maqbul'], required: true },
      { key: 'teacherName', label: 'Nama Musyrif/ah', type: 'text', required: true },
    ],
  },
  {
    type: 'ACHIEVEMENT',
    label: 'Piagam Penghargaan',
    labelEn: 'Achievement Certificate',
    description: 'Penghargaan untuk prestasi akademik, ekstrakurikuler, atau lainnya',
    icon: 'Trophy',
    color: 'bg-amber-100 text-amber-800',
    fields: [
      { key: 'achievementType', label: 'Jenis Prestasi', type: 'select', options: ['Akademik', 'Ekstrakurikuler', 'Lomba', 'Kepribadian', 'Lainnya'], required: true },
      { key: 'achievement', label: 'Prestasi', type: 'text', required: true },
      { key: 'level', label: 'Tingkat', type: 'select', options: ['Kelas', 'Sekolah', 'Kecamatan', 'Kabupaten/Kota', 'Provinsi', 'Nasional', 'Internasional'] },
      { key: 'rank', label: 'Peringkat/Juara', type: 'text' },
    ],
  },
  {
    type: 'COURSE_COMPLETION',
    label: 'Sertifikat Kursus',
    labelEn: 'Course Completion Certificate',
    description: 'Sertifikat penyelesaian kursus atau pelatihan',
    icon: 'Award',
    color: 'bg-purple-100 text-purple-800',
    fields: [
      { key: 'courseName', label: 'Nama Kursus/Pelatihan', type: 'text', required: true },
      { key: 'duration', label: 'Durasi', type: 'text', required: true },
      { key: 'instructor', label: 'Instruktur/Pemateri', type: 'text' },
      { key: 'score', label: 'Nilai', type: 'text' },
    ],
  },
  {
    type: 'APPRECIATION',
    label: 'Surat Penghargaan',
    labelEn: 'Letter of Appreciation',
    description: 'Surat penghargaan untuk kontribusi atau partisipasi',
    icon: 'Heart',
    color: 'bg-pink-100 text-pink-800',
    fields: [
      { key: 'reason', label: 'Alasan Penghargaan', type: 'text', required: true },
      { key: 'event', label: 'Kegiatan', type: 'text' },
      { key: 'role', label: 'Peran/Kontribusi', type: 'text' },
    ],
  },
];

export interface CertificateParams {
  page?: number;
  limit?: number;
  studentId?: string;
  type?: CertificateType;
  startDate?: string;
  endDate?: string;
}

export function useCertificates(params: CertificateParams = {}) {
  return useQuery({
    queryKey: ['certificates', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Certificate>>('/certificates', { params });
      return response.data;
    },
  });
}

export function useCertificate(id: string) {
  return useQuery({
    queryKey: ['certificates', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Certificate>>(`/certificates/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useStudentCertificates(studentId: string) {
  return useQuery({
    queryKey: ['certificates', 'student', studentId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Certificate[]>>(`/certificates/student/${studentId}`);
      return response.data.data;
    },
    enabled: !!studentId,
  });
}

export interface CreateCertificateData {
  studentId: string;
  type: CertificateType;
  title: string;
  description?: string;
  issuedDate: string;
  validUntil?: string;
  metadata?: Record<string, unknown>;
}

export function useCreateCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCertificateData) => {
      const response = await api.post<ApiResponse<Certificate>>('/certificates', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
  });
}

export function useDeleteCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/certificates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
  });
}

// Generate certificate number
export function generateCertificateNumber(type: CertificateType, unitCode: string = 'CPN'): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const typeCode = type.substring(0, 3).toUpperCase();
  return `${unitCode}/${typeCode}/${year}${month}/${random}`;
}
