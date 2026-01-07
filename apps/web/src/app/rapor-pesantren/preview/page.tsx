'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BookOpen, 
  Loader2, 
  Check,
  X,
  Users,
  CalendarDays,
  MessageSquare,
  Star,
  Award,
} from 'lucide-react';
import { useClasses } from '@/hooks/use-classes';
import { useStudents } from '@/hooks/use-students';
import { useAuthStore } from '@/stores/auth';

// Grade mapping
const GRADE_LABELS: Record<string, { label: string; color: string }> = {
  mumtaz: { label: 'Mumtaz (A)', color: 'bg-green-500' },
  jayyidJiddan: { label: 'Jayyid Jiddan (B)', color: 'bg-blue-500' },
  jayyid: { label: 'Jayyid (C)', color: 'bg-yellow-500' },
  maqbul: { label: 'Maqbul (D)', color: 'bg-orange-500' },
  rasib: { label: 'Rasib (E)', color: 'bg-red-500' },
};

// Mock rapor data for preview
const mockRaporData = {
  student: {
    name: 'Muhammad Hasan',
    nis: '2024001',
    class: 'VII A',
  },
  period: {
    semester: 1,
    academicYear: '2025/2026',
  },
  tahfidz: {
    totalAyah: 156,
    surahCount: 12,
    averageScore: 85,
    grade: 'jayyidJiddan',
    details: [
      { surah: 'Al-Baqarah', ayah: '1-50', score: 88 },
      { surah: 'Ali Imran', ayah: '1-30', score: 82 },
    ],
  },
  ibadah: {
    sholatWajib: 95,
    sholatSunnah: 78,
    tilawah: 85,
    averageScore: 86,
    grade: 'jayyidJiddan',
  },
  muhadhoroh: {
    totalSessions: 12,
    averageScore: 80,
    grade: 'jayyid',
    bestPerformance: 'Kultum Ramadhan',
  },
  muhadatsah: {
    totalSessions: 10,
    averageScore: 75,
    grade: 'jayyid',
  },
  kitabProgress: {
    kitabCount: 3,
    completedChapters: 15,
    averageScore: 82,
    grade: 'jayyidJiddan',
  },
  akhlak: {
    attendance: 98,
    violations: 1,
    rewards: 3,
    averageScore: 88,
    grade: 'jayyidJiddan',
  },
  finalScore: 83,
  finalGrade: 'jayyidJiddan',
  recommendation: 'Santri menunjukkan perkembangan yang baik. Perlu fokus peningkatan pada Muhadatsah.',
};

export default function RaporPesantrenPreviewPage() {
  const { user } = useAuthStore();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  
  const { data: classes } = useClasses({ unitId: user?.unitId });
  const { data: studentsData } = useStudents({ 
    classId: selectedClass || undefined,
    limit: 100,
  });

  const students = studentsData?.data || [];
  const rapor = mockRaporData; // In real app, fetch from API

  const renderScoreBar = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100;
    let color = 'bg-green-500';
    if (percentage < 60) color = 'bg-red-500';
    else if (percentage < 70) color = 'bg-orange-500';
    else if (percentage < 80) color = 'bg-yellow-500';
    else if (percentage < 90) color = 'bg-blue-500';
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
        </div>
        <span className="text-sm font-medium w-12 text-right">{score}</span>
      </div>
    );
  };

  return (
    <MainLayout allowedRoles={['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER', 'PARENT']}>
      <div className="space-y-6">
        <PageHeader
          title="Preview Rapor Pesantren"
          description="Lihat detail rapor pesantren santri"
          actions={
            <Button>
              Download PDF
            </Button>
          }
        />

        {/* Student Selector */}
        <div className="flex flex-wrap gap-4">
          <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedStudent(''); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Kelas" />
            </SelectTrigger>
            <SelectContent>
              {classes?.data?.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={!selectedClass}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Pilih Santri" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name} ({s.nis})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rapor Preview */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Student Info */}
          <Card className="lg:col-span-3">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{rapor.student.name}</h2>
                    <p className="text-muted-foreground">
                      NIS: {rapor.student.nis} | Kelas: {rapor.student.class}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{rapor.finalScore}</p>
                    <Badge className={GRADE_LABELS[rapor.finalGrade].color}>
                      {GRADE_LABELS[rapor.finalGrade].label}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tahfidz */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-green-600" />
                Tahfidz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderScoreBar(rapor.tahfidz.averageScore)}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total Ayat: <span className="font-medium">{rapor.tahfidz.totalAyah}</span></div>
                <div>Surah: <span className="font-medium">{rapor.tahfidz.surahCount}</span></div>
              </div>
              <Badge className={GRADE_LABELS[rapor.tahfidz.grade].color}>
                {GRADE_LABELS[rapor.tahfidz.grade].label}
              </Badge>
            </CardContent>
          </Card>

          {/* Ibadah */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-yellow-600" />
                Ibadah
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderScoreBar(rapor.ibadah.averageScore)}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Sholat Wajib</span>
                  <span className="font-medium">{rapor.ibadah.sholatWajib}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Sholat Sunnah</span>
                  <span className="font-medium">{rapor.ibadah.sholatSunnah}%</span>
                </div>
              </div>
              <Badge className={GRADE_LABELS[rapor.ibadah.grade].color}>
                {GRADE_LABELS[rapor.ibadah.grade].label}
              </Badge>
            </CardContent>
          </Card>

          {/* Muhadhoroh */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Muhadhoroh
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderScoreBar(rapor.muhadhoroh.averageScore)}
              <div className="text-sm">
                <p>Sesi: <span className="font-medium">{rapor.muhadhoroh.totalSessions}</span></p>
                <p>Terbaik: <span className="font-medium">{rapor.muhadhoroh.bestPerformance}</span></p>
              </div>
              <Badge className={GRADE_LABELS[rapor.muhadhoroh.grade].color}>
                {GRADE_LABELS[rapor.muhadhoroh.grade].label}
              </Badge>
            </CardContent>
          </Card>

          {/* Recommendation */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Catatan & Rekomendasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{rapor.recommendation}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
