'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  User,
  CheckCircle2,
  Clock,
  Target,
  ChevronRight,
  Star,
  Filter,
  Info,
} from 'lucide-react';

import { MainLayout } from '@/components/layout/main-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useStudents } from '@/hooks/use-students';
import { useDebounce } from '@/hooks/use-debounce';

// Quran data - 114 surahs with juz distribution
const QURAN_SURAHS = [
  { number: 1, name: 'Al-Fatihah', arabicName: 'الفاتحة', verses: 7, juz: 1 },
  { number: 2, name: 'Al-Baqarah', arabicName: 'البقرة', verses: 286, juz: 1 },
  { number: 3, name: 'Ali \'Imran', arabicName: 'آل عمران', verses: 200, juz: 3 },
  { number: 4, name: 'An-Nisa', arabicName: 'النساء', verses: 176, juz: 4 },
  { number: 5, name: 'Al-Ma\'idah', arabicName: 'المائدة', verses: 120, juz: 6 },
  { number: 6, name: 'Al-An\'am', arabicName: 'الأنعام', verses: 165, juz: 7 },
  { number: 7, name: 'Al-A\'raf', arabicName: 'الأعراف', verses: 206, juz: 8 },
  { number: 8, name: 'Al-Anfal', arabicName: 'الأنفال', verses: 75, juz: 9 },
  { number: 9, name: 'At-Taubah', arabicName: 'التوبة', verses: 129, juz: 10 },
  { number: 10, name: 'Yunus', arabicName: 'يونس', verses: 109, juz: 11 },
  { number: 11, name: 'Hud', arabicName: 'هود', verses: 123, juz: 11 },
  { number: 12, name: 'Yusuf', arabicName: 'يوسف', verses: 111, juz: 12 },
  { number: 13, name: 'Ar-Ra\'d', arabicName: 'الرعد', verses: 43, juz: 13 },
  { number: 14, name: 'Ibrahim', arabicName: 'ابراهيم', verses: 52, juz: 13 },
  { number: 15, name: 'Al-Hijr', arabicName: 'الحجر', verses: 99, juz: 14 },
  { number: 16, name: 'An-Nahl', arabicName: 'النحل', verses: 128, juz: 14 },
  { number: 17, name: 'Al-Isra', arabicName: 'الإسراء', verses: 111, juz: 15 },
  { number: 18, name: 'Al-Kahf', arabicName: 'الكهف', verses: 110, juz: 15 },
  { number: 19, name: 'Maryam', arabicName: 'مريم', verses: 98, juz: 16 },
  { number: 20, name: 'Ta-Ha', arabicName: 'طه', verses: 135, juz: 16 },
  { number: 21, name: 'Al-Anbiya', arabicName: 'الأنبياء', verses: 112, juz: 17 },
  { number: 22, name: 'Al-Hajj', arabicName: 'الحج', verses: 78, juz: 17 },
  { number: 23, name: 'Al-Mu\'minun', arabicName: 'المؤمنون', verses: 118, juz: 18 },
  { number: 24, name: 'An-Nur', arabicName: 'النور', verses: 64, juz: 18 },
  { number: 25, name: 'Al-Furqan', arabicName: 'الفرقان', verses: 77, juz: 18 },
  { number: 26, name: 'Ash-Shu\'ara', arabicName: 'الشعراء', verses: 227, juz: 19 },
  { number: 27, name: 'An-Naml', arabicName: 'النمل', verses: 93, juz: 19 },
  { number: 28, name: 'Al-Qasas', arabicName: 'القصص', verses: 88, juz: 20 },
  { number: 29, name: 'Al-\'Ankabut', arabicName: 'العنكبوت', verses: 69, juz: 20 },
  { number: 30, name: 'Ar-Rum', arabicName: 'الروم', verses: 60, juz: 21 },
  { number: 31, name: 'Luqman', arabicName: 'لقمان', verses: 34, juz: 21 },
  { number: 32, name: 'As-Sajdah', arabicName: 'السجدة', verses: 30, juz: 21 },
  { number: 33, name: 'Al-Ahzab', arabicName: 'الأحزاب', verses: 73, juz: 21 },
  { number: 34, name: 'Saba', arabicName: 'سبإ', verses: 54, juz: 22 },
  { number: 35, name: 'Fatir', arabicName: 'فاطر', verses: 45, juz: 22 },
  { number: 36, name: 'Ya-Sin', arabicName: 'يس', verses: 83, juz: 22 },
  { number: 37, name: 'As-Saffat', arabicName: 'الصافات', verses: 182, juz: 23 },
  { number: 38, name: 'Sad', arabicName: 'ص', verses: 88, juz: 23 },
  { number: 39, name: 'Az-Zumar', arabicName: 'الزمر', verses: 75, juz: 23 },
  { number: 40, name: 'Ghafir', arabicName: 'غافر', verses: 85, juz: 24 },
  { number: 41, name: 'Fussilat', arabicName: 'فصلت', verses: 54, juz: 24 },
  { number: 42, name: 'Ash-Shura', arabicName: 'الشورى', verses: 53, juz: 25 },
  { number: 43, name: 'Az-Zukhruf', arabicName: 'الزخرف', verses: 89, juz: 25 },
  { number: 44, name: 'Ad-Dukhan', arabicName: 'الدخان', verses: 59, juz: 25 },
  { number: 45, name: 'Al-Jathiyah', arabicName: 'الجاثية', verses: 37, juz: 25 },
  { number: 46, name: 'Al-Ahqaf', arabicName: 'الأحقاف', verses: 35, juz: 26 },
  { number: 47, name: 'Muhammad', arabicName: 'محمد', verses: 38, juz: 26 },
  { number: 48, name: 'Al-Fath', arabicName: 'الفتح', verses: 29, juz: 26 },
  { number: 49, name: 'Al-Hujurat', arabicName: 'الحجرات', verses: 18, juz: 26 },
  { number: 50, name: 'Qaf', arabicName: 'ق', verses: 45, juz: 26 },
  { number: 51, name: 'Adh-Dhariyat', arabicName: 'الذاريات', verses: 60, juz: 26 },
  { number: 52, name: 'At-Tur', arabicName: 'الطور', verses: 49, juz: 27 },
  { number: 53, name: 'An-Najm', arabicName: 'النجم', verses: 62, juz: 27 },
  { number: 54, name: 'Al-Qamar', arabicName: 'القمر', verses: 55, juz: 27 },
  { number: 55, name: 'Ar-Rahman', arabicName: 'الرحمن', verses: 78, juz: 27 },
  { number: 56, name: 'Al-Waqi\'ah', arabicName: 'الواقعة', verses: 96, juz: 27 },
  { number: 57, name: 'Al-Hadid', arabicName: 'الحديد', verses: 29, juz: 27 },
  { number: 58, name: 'Al-Mujadilah', arabicName: 'المجادلة', verses: 22, juz: 28 },
  { number: 59, name: 'Al-Hashr', arabicName: 'الحشر', verses: 24, juz: 28 },
  { number: 60, name: 'Al-Mumtahanah', arabicName: 'الممتحنة', verses: 13, juz: 28 },
  { number: 61, name: 'As-Saff', arabicName: 'الصف', verses: 14, juz: 28 },
  { number: 62, name: 'Al-Jumu\'ah', arabicName: 'الجمعة', verses: 11, juz: 28 },
  { number: 63, name: 'Al-Munafiqun', arabicName: 'المنافقون', verses: 11, juz: 28 },
  { number: 64, name: 'At-Taghabun', arabicName: 'التغابن', verses: 18, juz: 28 },
  { number: 65, name: 'At-Talaq', arabicName: 'الطلاق', verses: 12, juz: 28 },
  { number: 66, name: 'At-Tahrim', arabicName: 'التحريم', verses: 12, juz: 28 },
  { number: 67, name: 'Al-Mulk', arabicName: 'الملك', verses: 30, juz: 29 },
  { number: 68, name: 'Al-Qalam', arabicName: 'القلم', verses: 52, juz: 29 },
  { number: 69, name: 'Al-Haqqah', arabicName: 'الحاقة', verses: 52, juz: 29 },
  { number: 70, name: 'Al-Ma\'arij', arabicName: 'المعارج', verses: 44, juz: 29 },
  { number: 71, name: 'Nuh', arabicName: 'نوح', verses: 28, juz: 29 },
  { number: 72, name: 'Al-Jinn', arabicName: 'الجن', verses: 28, juz: 29 },
  { number: 73, name: 'Al-Muzzammil', arabicName: 'المزمل', verses: 20, juz: 29 },
  { number: 74, name: 'Al-Muddathir', arabicName: 'المدثر', verses: 56, juz: 29 },
  { number: 75, name: 'Al-Qiyamah', arabicName: 'القيامة', verses: 40, juz: 29 },
  { number: 76, name: 'Al-Insan', arabicName: 'الانسان', verses: 31, juz: 29 },
  { number: 77, name: 'Al-Mursalat', arabicName: 'المرسلات', verses: 50, juz: 29 },
  { number: 78, name: 'An-Naba', arabicName: 'النبإ', verses: 40, juz: 30 },
  { number: 79, name: 'An-Nazi\'at', arabicName: 'النازعات', verses: 46, juz: 30 },
  { number: 80, name: '\'Abasa', arabicName: 'عبس', verses: 42, juz: 30 },
  { number: 81, name: 'At-Takwir', arabicName: 'التكوير', verses: 29, juz: 30 },
  { number: 82, name: 'Al-Infitar', arabicName: 'الإنفطار', verses: 19, juz: 30 },
  { number: 83, name: 'Al-Mutaffifin', arabicName: 'المطففين', verses: 36, juz: 30 },
  { number: 84, name: 'Al-Inshiqaq', arabicName: 'الإنشقاق', verses: 25, juz: 30 },
  { number: 85, name: 'Al-Buruj', arabicName: 'البروج', verses: 22, juz: 30 },
  { number: 86, name: 'At-Tariq', arabicName: 'الطارق', verses: 17, juz: 30 },
  { number: 87, name: 'Al-A\'la', arabicName: 'الأعلى', verses: 19, juz: 30 },
  { number: 88, name: 'Al-Ghashiyah', arabicName: 'الغاشية', verses: 26, juz: 30 },
  { number: 89, name: 'Al-Fajr', arabicName: 'الفجر', verses: 30, juz: 30 },
  { number: 90, name: 'Al-Balad', arabicName: 'البلد', verses: 20, juz: 30 },
  { number: 91, name: 'Ash-Shams', arabicName: 'الشمس', verses: 15, juz: 30 },
  { number: 92, name: 'Al-Layl', arabicName: 'الليل', verses: 21, juz: 30 },
  { number: 93, name: 'Ad-Duha', arabicName: 'الضحى', verses: 11, juz: 30 },
  { number: 94, name: 'Ash-Sharh', arabicName: 'الشرح', verses: 8, juz: 30 },
  { number: 95, name: 'At-Tin', arabicName: 'التين', verses: 8, juz: 30 },
  { number: 96, name: 'Al-\'Alaq', arabicName: 'العلق', verses: 19, juz: 30 },
  { number: 97, name: 'Al-Qadr', arabicName: 'القدر', verses: 5, juz: 30 },
  { number: 98, name: 'Al-Bayyinah', arabicName: 'البينة', verses: 8, juz: 30 },
  { number: 99, name: 'Az-Zalzalah', arabicName: 'الزلزلة', verses: 8, juz: 30 },
  { number: 100, name: 'Al-\'Adiyat', arabicName: 'العاديات', verses: 11, juz: 30 },
  { number: 101, name: 'Al-Qari\'ah', arabicName: 'القارعة', verses: 11, juz: 30 },
  { number: 102, name: 'At-Takathur', arabicName: 'التكاثر', verses: 8, juz: 30 },
  { number: 103, name: 'Al-\'Asr', arabicName: 'العصر', verses: 3, juz: 30 },
  { number: 104, name: 'Al-Humazah', arabicName: 'الهمزة', verses: 9, juz: 30 },
  { number: 105, name: 'Al-Fil', arabicName: 'الفيل', verses: 5, juz: 30 },
  { number: 106, name: 'Quraysh', arabicName: 'قريش', verses: 4, juz: 30 },
  { number: 107, name: 'Al-Ma\'un', arabicName: 'الماعون', verses: 7, juz: 30 },
  { number: 108, name: 'Al-Kawthar', arabicName: 'الكوثر', verses: 3, juz: 30 },
  { number: 109, name: 'Al-Kafirun', arabicName: 'الكافرون', verses: 6, juz: 30 },
  { number: 110, name: 'An-Nasr', arabicName: 'النصر', verses: 3, juz: 30 },
  { number: 111, name: 'Al-Masad', arabicName: 'المسد', verses: 5, juz: 30 },
  { number: 112, name: 'Al-Ikhlas', arabicName: 'الإخلاص', verses: 4, juz: 30 },
  { number: 113, name: 'Al-Falaq', arabicName: 'الفلق', verses: 5, juz: 30 },
  { number: 114, name: 'An-Nas', arabicName: 'الناس', verses: 6, juz: 30 },
];

// Mock progress data - in real app this comes from API
const getMockProgress = (studentId: string) => {
  // Simulate different progress for different students
  const seed = studentId ? studentId.charCodeAt(0) : 0;
  const memorized: number[] = [];
  const inProgress: number[] = [];
  
  // Randomly mark some surahs as memorized (more from Juz 30)
  QURAN_SURAHS.forEach((surah) => {
    const random = ((surah.number + seed) % 10) / 10;
    if (surah.juz === 30 && random > 0.3) {
      memorized.push(surah.number);
    } else if (surah.juz >= 28 && random > 0.5) {
      memorized.push(surah.number);
    } else if (random > 0.85) {
      memorized.push(surah.number);
    } else if (random > 0.75) {
      inProgress.push(surah.number);
    }
  });

  return { memorized, inProgress };
};

type ProgressStatus = 'memorized' | 'in-progress' | 'not-started';

interface SurahProgress {
  surahNumber: number;
  status: ProgressStatus;
  memorizedVerses?: number;
  totalVerses: number;
  lastReview?: string;
}

export default function QuranMapPage() {
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedJuz, setSelectedJuz] = useState<number | 'all'>('all');
  const [selectedSurah, setSelectedSurah] = useState<typeof QURAN_SURAHS[0] | null>(null);
  const [viewMode, setViewMode] = useState<'surah' | 'juz'>('surah');

  const debouncedStudentSearch = useDebounce(studentSearch, 300);

  const { data: studentsData, isLoading: studentsLoading } = useStudents({
    search: debouncedStudentSearch || undefined,
    limit: 10,
  });

  const students = studentsData?.data || [];

  // Get mock progress for selected student
  const progress = useMemo(() => {
    if (!selectedStudentId) return { memorized: [], inProgress: [] };
    return getMockProgress(selectedStudentId);
  }, [selectedStudentId]);

  const getSurahStatus = (surahNumber: number): ProgressStatus => {
    if (progress.memorized.includes(surahNumber)) return 'memorized';
    if (progress.inProgress.includes(surahNumber)) return 'in-progress';
    return 'not-started';
  };

  const getStatusColor = (status: ProgressStatus) => {
    switch (status) {
      case 'memorized':
        return 'bg-emerald-500 text-white';
      case 'in-progress':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-gray-100 text-gray-600 hover:bg-gray-200';
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalSurahs = 114;
    const memorized = progress.memorized.length;
    const inProgressCount = progress.inProgress.length;
    const notStarted = totalSurahs - memorized - inProgressCount;

    // Calculate by juz
    const juzStats: Record<number, { memorized: number; inProgress: number; total: number }> = {};
    for (let i = 1; i <= 30; i++) {
      juzStats[i] = { memorized: 0, inProgress: 0, total: 0 };
    }
    QURAN_SURAHS.forEach((surah) => {
      juzStats[surah.juz].total++;
      if (progress.memorized.includes(surah.number)) {
        juzStats[surah.juz].memorized++;
      } else if (progress.inProgress.includes(surah.number)) {
        juzStats[surah.juz].inProgress++;
      }
    });

    return {
      totalSurahs,
      memorized,
      inProgressCount,
      notStarted,
      percentage: Math.round((memorized / totalSurahs) * 100),
      juzStats,
    };
  }, [progress]);

  // Filter surahs by juz
  const filteredSurahs = selectedJuz === 'all'
    ? QURAN_SURAHS
    : QURAN_SURAHS.filter((s) => s.juz === selectedJuz);

  return (
    <MainLayout>
      <PageHeader
        title="Peta Hafalan Al-Qur'an"
        description="Visualisasi progress hafalan 30 juz Al-Qur'an"
        backHref="/tahfidz"
      />

      {/* Student Selection */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau NIS siswa..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {studentSearch && (
                <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                  {studentsLoading ? (
                    <p className="p-3 text-sm text-muted-foreground">Mencari...</p>
                  ) : students.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">Tidak ditemukan</p>
                  ) : (
                    students.map((student) => (
                      <button
                        key={student.id}
                        className="w-full p-3 text-left hover:bg-muted/50 border-b last:border-0 flex items-center gap-2"
                        onClick={() => {
                          setSelectedStudentId(student.id);
                          setStudentSearch('');
                        }}
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.nis} • {student.currentClass?.name || '-'}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Select value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="surah">Per Surah</SelectItem>
                  <SelectItem value="juz">Per Juz</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={selectedJuz.toString()} 
                onValueChange={(v) => setSelectedJuz(v === 'all' ? 'all' : parseInt(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Juz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Juz</SelectItem>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                    <SelectItem key={juz} value={juz.toString()}>
                      Juz {juz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedStudentId ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Pilih Siswa</h3>
            <p className="text-muted-foreground">
              Cari dan pilih siswa untuk melihat peta progress hafalan Al-Qur&apos;an
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress Stats */}
          <div className="grid gap-4 md:grid-cols-5 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{stats.memorized}</p>
                    <p className="text-sm text-muted-foreground">Hafal</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{stats.inProgressCount}</p>
                    <p className="text-sm text-muted-foreground">Proses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.notStarted}</p>
                    <p className="text-sm text-muted-foreground">Belum</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Total Progress</p>
                  <p className="text-lg font-bold text-emerald-600">{stats.percentage}%</p>
                </div>
                <Progress value={stats.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.memorized} dari 114 surah
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500" />
              <span className="text-sm">Hafal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500" />
              <span className="text-sm">Proses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 border" />
              <span className="text-sm">Belum</span>
            </div>
          </div>

          {viewMode === 'juz' ? (
            /* Juz View */
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
                const juzStat = stats.juzStats[juz];
                const percentage = juzStat.total > 0 
                  ? Math.round((juzStat.memorized / juzStat.total) * 100) 
                  : 0;
                
                return (
                  <TooltipProvider key={juz}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setSelectedJuz(juz)}
                          className={cn(
                            'aspect-square rounded-lg flex flex-col items-center justify-center transition-all hover:scale-105',
                            percentage === 100 ? 'bg-emerald-500 text-white' :
                            percentage > 0 ? 'bg-amber-500 text-white' :
                            'bg-gray-100 hover:bg-gray-200'
                          )}
                        >
                          <span className="text-lg font-bold">{juz}</span>
                          <span className="text-xs">{percentage}%</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-semibold">Juz {juz}</p>
                        <p className="text-xs">
                          {juzStat.memorized}/{juzStat.total} surah hafal
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          ) : (
            /* Surah View */
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {selectedJuz === 'all' ? 'Semua Surah (114)' : `Juz ${selectedJuz}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                  {filteredSurahs.map((surah) => {
                    const status = getSurahStatus(surah.number);
                    
                    return (
                      <TooltipProvider key={surah.number}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setSelectedSurah(surah)}
                              className={cn(
                                'aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all hover:scale-110',
                                getStatusColor(status)
                              )}
                            >
                              <span className="font-bold">{surah.number}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <div className="text-center">
                              <p className="font-arabic text-lg">{surah.arabicName}</p>
                              <p className="font-semibold">{surah.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {surah.verses} ayat • Juz {surah.juz}
                              </p>
                              <Badge className={cn('mt-1', getStatusColor(status))}>
                                {status === 'memorized' ? 'Hafal' : 
                                 status === 'in-progress' ? 'Proses' : 'Belum'}
                              </Badge>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Surah Detail Dialog */}
      <Dialog open={!!selectedSurah} onOpenChange={() => setSelectedSurah(null)}>
        <DialogContent>
          {selectedSurah && (
            <>
              <DialogHeader>
                <div className="text-center">
                  <p className="font-arabic text-3xl mb-2">{selectedSurah.arabicName}</p>
                  <DialogTitle>{selectedSurah.name}</DialogTitle>
                  <DialogDescription>
                    Surah ke-{selectedSurah.number} • {selectedSurah.verses} ayat • Juz {selectedSurah.juz}
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Badge className={getStatusColor(getSurahStatus(selectedSurah.number))}>
                    {getSurahStatus(selectedSurah.number) === 'memorized' ? '✓ Hafal' :
                     getSurahStatus(selectedSurah.number) === 'in-progress' ? '⏳ Sedang Proses' :
                     '○ Belum Dimulai'}
                  </Badge>
                </div>
                
                {getSurahStatus(selectedSurah.number) === 'memorized' && (
                  <div className="p-4 bg-emerald-50 rounded-lg text-center">
                    <Star className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-emerald-700">Alhamdulillah!</p>
                    <p className="text-sm text-emerald-600">Surah ini sudah dihafal</p>
                  </div>
                )}

                <div className="flex gap-2 justify-center">
                  <Button variant="outline" asChild>
                    <Link href={`/tahfidz?surah=${selectedSurah.number}`}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Lihat Catatan
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/tahfidz/new?surah=${selectedSurah.number}`}>
                      Input Setoran
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
