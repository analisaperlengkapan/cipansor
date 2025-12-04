import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { ApiResponse, PaginatedResponse } from '@/lib/api';

export interface TahfidzRecord {
  id: string;
  studentId: string;
  teacherId: string;
  date: string;
  surah: string;
  juz?: number;
  startAyah: number;
  endAyah: number;
  type: TahfidzType;
  grade: TahfidzGrade;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    name: string;
    nis: string;
    class?: { name: string };
    unit?: { name: string };
  };
  teacher?: {
    id: string;
    name: string;
  };
}

export type TahfidzType = 'SETORAN' | 'MURAJAAH' | 'TASMI';
export type TahfidzGrade = 'MUMTAZ' | 'JAYYID_JIDDAN' | 'JAYYID' | 'MAQBUL' | 'RASIB';

export const TAHFIDZ_TYPES: { value: TahfidzType; label: string }[] = [
  { value: 'SETORAN', label: 'Setoran Baru' },
  { value: 'MURAJAAH', label: 'Murajaah (Pengulangan)' },
  { value: 'TASMI', label: 'Tasmi (Tes)' },
];

export const TAHFIDZ_GRADES: { value: TahfidzGrade; label: string; color: string }[] = [
  { value: 'MUMTAZ', label: 'Mumtaz (Sangat Baik)', color: 'bg-green-100 text-green-800' },
  { value: 'JAYYID_JIDDAN', label: 'Jayyid Jiddan (Baik Sekali)', color: 'bg-blue-100 text-blue-800' },
  { value: 'JAYYID', label: 'Jayyid (Baik)', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'MAQBUL', label: 'Maqbul (Cukup)', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'RASIB', label: 'Rasib (Kurang)', color: 'bg-red-100 text-red-800' },
];

export const SURAH_LIST = [
  'Al-Fatihah', 'Al-Baqarah', 'Ali Imran', 'An-Nisa', 'Al-Maidah', 'Al-Anam', 'Al-Araf',
  'Al-Anfal', 'At-Taubah', 'Yunus', 'Hud', 'Yusuf', 'Ar-Ra\'d', 'Ibrahim', 'Al-Hijr',
  'An-Nahl', 'Al-Isra', 'Al-Kahf', 'Maryam', 'Taha', 'Al-Anbiya', 'Al-Hajj', 'Al-Mu\'minun',
  'An-Nur', 'Al-Furqan', 'Asy-Syu\'ara', 'An-Naml', 'Al-Qasas', 'Al-Ankabut', 'Ar-Rum',
  'Luqman', 'As-Sajdah', 'Al-Ahzab', 'Saba', 'Fatir', 'Yasin', 'As-Saffat', 'Sad',
  'Az-Zumar', 'Ghafir', 'Fussilat', 'Asy-Syura', 'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jasiyah',
  'Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujurat', 'Qaf', 'Az-Zariyat', 'At-Tur',
  'An-Najm', 'Al-Qamar', 'Ar-Rahman', 'Al-Waqi\'ah', 'Al-Hadid', 'Al-Mujadilah',
  'Al-Hasyr', 'Al-Mumtahanah', 'As-Saff', 'Al-Jumu\'ah', 'Al-Munafiqun', 'At-Tagabun',
  'At-Talaq', 'At-Tahrim', 'Al-Mulk', 'Al-Qalam', 'Al-Haqqah', 'Al-Ma\'arij', 'Nuh',
  'Al-Jinn', 'Al-Muzzammil', 'Al-Muddassir', 'Al-Qiyamah', 'Al-Insan', 'Al-Mursalat',
  'An-Naba', 'An-Nazi\'at', 'Abasa', 'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin',
  'Al-Insyiqaq', 'Al-Buruj', 'At-Tariq', 'Al-A\'la', 'Al-Gasyiyah', 'Al-Fajr',
  'Al-Balad', 'Asy-Syams', 'Al-Lail', 'Ad-Duha', 'Al-Insyirah', 'At-Tin', 'Al-Alaq',
  'Al-Qadr', 'Al-Bayyinah', 'Az-Zalzalah', 'Al-Adiyat', 'Al-Qari\'ah', 'At-Takasur',
  'Al-Asr', 'Al-Humazah', 'Al-Fil', 'Quraisy', 'Al-Ma\'un', 'Al-Kausar', 'Al-Kafirun',
  'An-Nasr', 'Al-Lahab', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas',
];

export interface TahfidzParams {
  page?: number;
  limit?: number;
  studentId?: string;
  teacherId?: string;
  type?: TahfidzType;
  startDate?: string;
  endDate?: string;
  surah?: string;
}

export function useTahfidzRecords(params: TahfidzParams = {}) {
  return useQuery({
    queryKey: ['tahfidz', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<TahfidzRecord>>('/tahfidz', { params });
      return response.data;
    },
  });
}

export function useTahfidzRecord(id: string) {
  return useQuery({
    queryKey: ['tahfidz', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<TahfidzRecord>>(`/tahfidz/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useStudentTahfidzProgress(studentId: string) {
  return useQuery({
    queryKey: ['tahfidz', 'progress', studentId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{
        totalSurah: number;
        totalAyah: number;
        completedSurah: string[];
        inProgressSurah: string[];
        lastRecord?: TahfidzRecord;
      }>>(`/tahfidz/progress/${studentId}`);
      return response.data.data;
    },
    enabled: !!studentId,
  });
}

export interface CreateTahfidzData {
  studentId: string;
  date: string;
  surah: string;
  startAyah: number;
  endAyah: number;
  type: TahfidzType;
  grade: TahfidzGrade;
  notes?: string;
}

export function useCreateTahfidz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTahfidzData) => {
      const response = await api.post<ApiResponse<TahfidzRecord>>('/tahfidz', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tahfidz'] });
    },
  });
}

export function useUpdateTahfidz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTahfidzData> }) => {
      const response = await api.patch<ApiResponse<TahfidzRecord>>(`/tahfidz/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tahfidz'] });
      queryClient.invalidateQueries({ queryKey: ['tahfidz', variables.id] });
    },
  });
}

export function useDeleteTahfidz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tahfidz/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tahfidz'] });
    },
  });
}

// Dashboard stats for Tahfidz progress visualization
export interface TahfidzDashboardStats {
  totalRecords: number;
  totalStudents: number;
  recordsByType: {
    type: TahfidzType;
    count: number;
  }[];
  recordsByGrade: {
    grade: TahfidzGrade;
    count: number;
  }[];
  progressByJuz: {
    juz: number;
    studentCount: number;
    completedCount: number;
  }[];
  monthlyActivity: {
    month: string;
    setoran: number;
    murajaah: number;
    tasmi: number;
  }[];
  topStudents: {
    studentId: string;
    studentName: string;
    nis: string;
    totalAyah: number;
    completedJuz: number;
  }[];
  recentRecords: TahfidzRecord[];
}

export interface TahfidzDashboardParams {
  unitId?: string;
  year?: number;
  month?: number;
}

export function useTahfidzDashboard(params: TahfidzDashboardParams = {}) {
  return useQuery({
    queryKey: ['tahfidz', 'dashboard', params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<TahfidzDashboardStats>>('/tahfidz/dashboard', { params });
      return response.data.data;
    },
  });
}
