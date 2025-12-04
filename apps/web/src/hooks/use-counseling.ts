import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { ApiResponse, PaginatedResponse } from '@/lib/api';

// Types
export type CounselingCategory = 
  | 'ACADEMIC'      // Masalah akademik
  | 'SOCIAL'        // Masalah sosial/pertemanan
  | 'PERSONAL'      // Masalah pribadi
  | 'CAREER'        // Bimbingan karir
  | 'FAMILY'        // Masalah keluarga
  | 'BEHAVIOR'      // Masalah perilaku
  | 'RELIGIOUS'     // Bimbingan keagamaan
  | 'OTHER';

export type CounselingStatus = 
  | 'OPEN'          // Kasus masih terbuka
  | 'IN_PROGRESS'   // Sedang ditangani
  | 'FOLLOW_UP'     // Perlu follow up
  | 'RESOLVED'      // Selesai
  | 'REFERRED';     // Dirujuk ke pihak lain

export type CounselingPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type SessionType = 
  | 'INDIVIDUAL'    // Konseling individu
  | 'GROUP'         // Konseling kelompok
  | 'PARENT'        // Konseling dengan orang tua
  | 'HOME_VISIT'    // Kunjungan rumah
  | 'REFERRAL';     // Rujukan eksternal

export interface CounselingRecord {
  id: string;
  caseNumber: string; // Auto-generated: BK-2024-001
  studentId: string;
  student?: {
    id: string;
    nis: string;
    name: string;
    gender: string;
    currentClass?: {
      id: string;
      name: string;
    };
    parentName: string;
    parentPhone: string;
  };
  counselorId: string;
  counselor?: {
    id: string;
    name: string;
  };
  category: CounselingCategory;
  title: string;
  description: string;
  priority: CounselingPriority;
  status: CounselingStatus;
  isConfidential: boolean;
  reportedBy?: string;
  reportedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  sessions: CounselingSession[];
  unitId: string;
  unit?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CounselingSession {
  id: string;
  recordId: string;
  sessionNumber: number;
  type: SessionType;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees: string[]; // Names of people who attended
  summary: string;
  findings?: string;
  recommendations?: string;
  followUpDate?: string;
  followUpNotes?: string;
  parentNotified: boolean;
  parentNotifiedAt?: string;
  attachments?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CounselingStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  byCategory: Record<CounselingCategory, number>;
  byPriority: Record<CounselingPriority, number>;
  avgResolutionDays: number;
}

export interface CounselingListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: CounselingCategory;
  status?: CounselingStatus;
  priority?: CounselingPriority;
  studentId?: string;
  counselorId?: string;
  unitId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateCounselingInput {
  studentId: string;
  category: CounselingCategory;
  title: string;
  description: string;
  priority: CounselingPriority;
  isConfidential?: boolean;
  reportedBy?: string;
  unitId: string;
}

export interface UpdateCounselingInput extends Partial<CreateCounselingInput> {
  id: string;
  status?: CounselingStatus;
  resolutionNotes?: string;
}

export interface CreateSessionInput {
  recordId: string;
  type: SessionType;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees: string[];
  summary: string;
  findings?: string;
  recommendations?: string;
  followUpDate?: string;
  followUpNotes?: string;
  parentNotified?: boolean;
}

// Category config
export const COUNSELING_CATEGORIES: Array<{
  value: CounselingCategory;
  label: string;
  icon: string;
  color: string;
  description: string;
}> = [
  { 
    value: 'ACADEMIC', 
    label: 'Akademik', 
    icon: '📚', 
    color: 'bg-blue-100 text-blue-800',
    description: 'Masalah terkait belajar, nilai, motivasi belajar'
  },
  { 
    value: 'SOCIAL', 
    label: 'Sosial', 
    icon: '👥', 
    color: 'bg-green-100 text-green-800',
    description: 'Masalah pertemanan, bullying, adaptasi sosial'
  },
  { 
    value: 'PERSONAL', 
    label: 'Pribadi', 
    icon: '🔒', 
    color: 'bg-purple-100 text-purple-800',
    description: 'Masalah pribadi, kepercayaan diri, kecemasan'
  },
  { 
    value: 'CAREER', 
    label: 'Karir', 
    icon: '🎯', 
    color: 'bg-amber-100 text-amber-800',
    description: 'Bimbingan karir, pilihan jurusan, minat bakat'
  },
  { 
    value: 'FAMILY', 
    label: 'Keluarga', 
    icon: '🏠', 
    color: 'bg-pink-100 text-pink-800',
    description: 'Masalah keluarga, orang tua, ekonomi'
  },
  { 
    value: 'BEHAVIOR', 
    label: 'Perilaku', 
    icon: '⚠️', 
    color: 'bg-red-100 text-red-800',
    description: 'Masalah perilaku, disiplin, kebiasaan buruk'
  },
  { 
    value: 'RELIGIOUS', 
    label: 'Keagamaan', 
    icon: '📿', 
    color: 'bg-emerald-100 text-emerald-800',
    description: 'Bimbingan ibadah, akhlak, spiritual'
  },
  { 
    value: 'OTHER', 
    label: 'Lainnya', 
    icon: '📋', 
    color: 'bg-gray-100 text-gray-800',
    description: 'Kategori lainnya'
  },
];

export const COUNSELING_STATUSES: Array<{
  value: CounselingStatus;
  label: string;
  color: string;
}> = [
  { value: 'OPEN', label: 'Terbuka', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'IN_PROGRESS', label: 'Proses', color: 'bg-blue-100 text-blue-800' },
  { value: 'FOLLOW_UP', label: 'Follow Up', color: 'bg-purple-100 text-purple-800' },
  { value: 'RESOLVED', label: 'Selesai', color: 'bg-green-100 text-green-800' },
  { value: 'REFERRED', label: 'Dirujuk', color: 'bg-gray-100 text-gray-800' },
];

export const COUNSELING_PRIORITIES: Array<{
  value: CounselingPriority;
  label: string;
  color: string;
}> = [
  { value: 'LOW', label: 'Rendah', color: 'bg-gray-100 text-gray-800' },
  { value: 'MEDIUM', label: 'Sedang', color: 'bg-blue-100 text-blue-800' },
  { value: 'HIGH', label: 'Tinggi', color: 'bg-amber-100 text-amber-800' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

export const SESSION_TYPES: Array<{
  value: SessionType;
  label: string;
  icon: string;
}> = [
  { value: 'INDIVIDUAL', label: 'Konseling Individu', icon: '👤' },
  { value: 'GROUP', label: 'Konseling Kelompok', icon: '👥' },
  { value: 'PARENT', label: 'Konseling Orang Tua', icon: '👨‍👩‍👧' },
  { value: 'HOME_VISIT', label: 'Kunjungan Rumah', icon: '🏠' },
  { value: 'REFERRAL', label: 'Rujukan Eksternal', icon: '🏥' },
];

// Hooks
export function useCounselingRecords(params: CounselingListParams = {}) {
  return useQuery({
    queryKey: ['counseling-records', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<CounselingRecord>>('/counseling', { params });
      return response.data;
    },
  });
}

export function useCounselingRecord(id: string) {
  return useQuery({
    queryKey: ['counseling-records', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<CounselingRecord>>(`/counseling/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCounselingStats(unitId?: string) {
  return useQuery({
    queryKey: ['counseling-stats', unitId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<CounselingStats>>('/counseling/stats', {
        params: { unitId },
      });
      return response.data.data;
    },
  });
}

export function useStudentCounselingHistory(studentId: string) {
  return useQuery({
    queryKey: ['student-counseling-history', studentId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<CounselingRecord[]>>(`/counseling/student/${studentId}`);
      return response.data.data;
    },
    enabled: !!studentId,
  });
}

export function useCreateCounselingRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCounselingInput) => {
      const response = await api.post<ApiResponse<CounselingRecord>>('/counseling', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counseling-records'] });
      queryClient.invalidateQueries({ queryKey: ['counseling-stats'] });
    },
  });
}

export function useUpdateCounselingRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateCounselingInput) => {
      const response = await api.put<ApiResponse<CounselingRecord>>(`/counseling/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['counseling-records'] });
      queryClient.invalidateQueries({ queryKey: ['counseling-records', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['counseling-stats'] });
    },
  });
}

export function useResolveCounselingRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, resolutionNotes }: { id: string; resolutionNotes: string }) => {
      const response = await api.post<ApiResponse<CounselingRecord>>(`/counseling/${id}/resolve`, { 
        resolutionNotes 
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['counseling-records'] });
      queryClient.invalidateQueries({ queryKey: ['counseling-records', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['counseling-stats'] });
    },
  });
}

export function useDeleteCounselingRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/counseling/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counseling-records'] });
      queryClient.invalidateQueries({ queryKey: ['counseling-stats'] });
    },
  });
}

// Session hooks
export function useAddCounselingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSessionInput) => {
      const response = await api.post<ApiResponse<CounselingSession>>(
        `/counseling/${data.recordId}/sessions`,
        data
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['counseling-records', variables.recordId] });
    },
  });
}

export function useNotifyParent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordId, message }: { recordId: string; message: string }) => {
      const response = await api.post<ApiResponse<void>>(`/counseling/${recordId}/notify-parent`, { 
        message 
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['counseling-records', variables.recordId] });
    },
  });
}

// Helper functions
export function getCounselingCategoryConfig(category: CounselingCategory) {
  return COUNSELING_CATEGORIES.find((c) => c.value === category);
}

export function getCounselingStatusConfig(status: CounselingStatus) {
  return COUNSELING_STATUSES.find((s) => s.value === status);
}

export function getCounselingPriorityConfig(priority: CounselingPriority) {
  return COUNSELING_PRIORITIES.find((p) => p.value === priority);
}

export function getCounselingSessionTypeConfig(type: SessionType) {
  return SESSION_TYPES.find((t) => t.value === type);
}
