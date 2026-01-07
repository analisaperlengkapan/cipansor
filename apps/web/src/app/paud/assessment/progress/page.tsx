'use client';

import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import {
  useClassProgressSummary,
  ASPECT_LABELS,
  ACHIEVEMENT_LABELS,
  ACHIEVEMENT_COLORS,
  PAUDAspect,
  PAUDAchievementLevel,
} from '@/hooks/use-paud-assessment';
import { useClasses } from '@/hooks/use-classes';
import { useAcademicYears } from '@/hooks/use-academic-years';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  Users,
  Sparkles,
  Heart,
  Brain,
  MessageCircle,
  Smile,
  Palette,
} from 'lucide-react';

// Aspect icons mapping
const ASPECT_ICONS: Record<PAUDAspect, React.ElementType> = {
  NAM: Heart,
  FM: TrendingUp,
  KOG: Brain,
  BHS: MessageCircle,
  SE: Smile,
  SNI: Palette,
};

// Aspect colors for charts
const ASPECT_CHART_COLORS: Record<PAUDAspect, string> = {
  NAM: 'from-rose-500 to-pink-500',
  FM: 'from-blue-500 to-cyan-500',
  KOG: 'from-purple-500 to-violet-500',
  BHS: 'from-emerald-500 to-green-500',
  SE: 'from-amber-500 to-orange-500',
  SNI: 'from-fuchsia-500 to-pink-500',
};

interface AspectSummary {
  aspect: PAUDAspect;
  total: number;
  distribution: Record<PAUDAchievementLevel, number>;
  averageScore: number;
}

export default function PAUDProgressDashboardPage() {
  const { user } = useAuthStore();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');

  const { data: classes } = useClasses({ unitId: user?.unitId });
  const { data: academicYears } = useAcademicYears();
  const { data: progressData, isLoading } = useClassProgressSummary(
    selectedClass,
    selectedAcademicYear
  );

  // Calculate aspect summaries from progress data
  const aspectSummaries = useMemo<AspectSummary[]>(() => {
    if (!progressData || !Array.isArray(progressData)) return [];

    const aspects: PAUDAspect[] = ['NAM', 'FM', 'KOG', 'BHS', 'SE', 'SNI'];

    return aspects.map((aspect) => {
      const distribution: Record<PAUDAchievementLevel, number> = {
        BB: 0,
        MB: 0,
        BSH: 0,
        BSB: 0,
      };

      let total = 0;
      let scoreSum = 0;

      progressData.forEach((student) => {
        const aspectData = student.aspects?.[aspect];
        if (aspectData) {
          total++;
          // Calculate score based on achievement level
          const scoreMap: Record<PAUDAchievementLevel, number> = {
            BB: 25,
            MB: 50,
            BSH: 75,
            BSB: 100,
          };
          if (aspectData.latestLevel) {
            distribution[aspectData.latestLevel]++;
            scoreSum += scoreMap[aspectData.latestLevel];
          }
        }
      });

      return {
        aspect,
        total,
        distribution,
        averageScore: total > 0 ? Math.round(scoreSum / total) : 0,
      };
    });
  }, [progressData]);

  // Calculate class-wide statistics
  const classStats = useMemo(() => {
    const totalStudents = progressData?.length || 0;
    const overallProgress =
      aspectSummaries.length > 0
        ? Math.round(
            aspectSummaries.reduce((sum, a) => sum + a.averageScore, 0) /
              aspectSummaries.length
          )
        : 0;

    // Find best and needs attention aspects
    const sortedAspects = [...aspectSummaries].sort(
      (a, b) => b.averageScore - a.averageScore
    );
    const bestAspect = sortedAspects[0];
    const needsAttention = sortedAspects[sortedAspects.length - 1];

    return {
      totalStudents,
      overallProgress,
      bestAspect,
      needsAttention,
    };
  }, [progressData, aspectSummaries]);

  return (
    <MainLayout allowedRoles={['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']}>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Perkembangan PAUD"
          description="Pantau perkembangan anak berdasarkan 6 aspek (Permendikbud 137/2014)"
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Kelas" />
            </SelectTrigger>
            <SelectContent>
              {classes?.data?.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedAcademicYear}
            onValueChange={setSelectedAcademicYear}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              {academicYears?.data?.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedClass ? (
          <>
            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Siswa
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {classStats.totalStudents}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    siswa terdaftar
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Rata-rata Perkembangan
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {classStats.overallProgress}%
                  </div>
                  <Progress
                    value={classStats.overallProgress}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card className="glass-card border-green-500/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">
                    Aspek Terbaik
                  </CardTitle>
                  <Sparkles className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {classStats.bestAspect
                      ? ASPECT_LABELS[classStats.bestAspect.aspect]
                      : '-'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {classStats.bestAspect?.averageScore || 0}% rata-rata
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-orange-500/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-orange-600">
                    Perlu Perhatian
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {classStats.needsAttention
                      ? ASPECT_LABELS[classStats.needsAttention.aspect]
                      : '-'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {classStats.needsAttention?.averageScore || 0}% rata-rata
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Aspect Cards */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Ringkasan</TabsTrigger>
                <TabsTrigger value="distribution">Distribusi</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {aspectSummaries.map((summary) => {
                    const Icon = ASPECT_ICONS[summary.aspect];
                    return (
                      <Card
                        key={summary.aspect}
                        className="overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <CardHeader
                          className={cn(
                            'bg-gradient-to-r text-white',
                            ASPECT_CHART_COLORS[summary.aspect]
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {ASPECT_LABELS[summary.aspect]}
                              </CardTitle>
                              <CardDescription className="text-white/80">
                                {summary.aspect}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl font-bold">
                              {summary.averageScore}%
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {summary.total} siswa
                            </span>
                          </div>
                          <Progress
                            value={summary.averageScore}
                            className="h-2"
                          />

                          {/* Distribution mini-chart */}
                          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                            {(
                              Object.entries(summary.distribution) as [
                                PAUDAchievementLevel,
                                number
                              ][]
                            ).map(([level, count]) => (
                              <div key={level}>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'w-full justify-center',
                                    ACHIEVEMENT_COLORS[level]
                                  )}
                                >
                                  {count}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {level}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="distribution" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribusi Capaian per Aspek</CardTitle>
                    <CardDescription>
                      Jumlah siswa berdasarkan level capaian
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {aspectSummaries.map((summary) => (
                        <div key={summary.aspect} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {ASPECT_LABELS[summary.aspect]}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {summary.total} siswa
                            </span>
                          </div>

                          {/* Stacked bar */}
                          <div className="flex h-6 rounded-full overflow-hidden">
                            {summary.total > 0 ? (
                              <>
                                <div
                                  className="bg-red-400 flex items-center justify-center text-xs text-white"
                                  style={{
                                    width: `${
                                      (summary.distribution.BB / summary.total) *
                                      100
                                    }%`,
                                  }}
                                >
                                  {summary.distribution.BB > 0 &&
                                    summary.distribution.BB}
                                </div>
                                <div
                                  className="bg-yellow-400 flex items-center justify-center text-xs"
                                  style={{
                                    width: `${
                                      (summary.distribution.MB / summary.total) *
                                      100
                                    }%`,
                                  }}
                                >
                                  {summary.distribution.MB > 0 &&
                                    summary.distribution.MB}
                                </div>
                                <div
                                  className="bg-blue-400 flex items-center justify-center text-xs text-white"
                                  style={{
                                    width: `${
                                      (summary.distribution.BSH /
                                        summary.total) *
                                      100
                                    }%`,
                                  }}
                                >
                                  {summary.distribution.BSH > 0 &&
                                    summary.distribution.BSH}
                                </div>
                                <div
                                  className="bg-green-400 flex items-center justify-center text-xs text-white"
                                  style={{
                                    width: `${
                                      (summary.distribution.BSB /
                                        summary.total) *
                                      100
                                    }%`,
                                  }}
                                >
                                  {summary.distribution.BSB > 0 &&
                                    summary.distribution.BSB}
                                </div>
                              </>
                            ) : (
                              <div className="w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                Belum ada data
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Legend */}
                      <div className="flex flex-wrap gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-400 rounded" />
                          <span className="text-sm">BB (Belum Berkembang)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-400 rounded" />
                          <span className="text-sm">
                            MB (Mulai Berkembang)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-400 rounded" />
                          <span className="text-sm">
                            BSH (Berkembang Sesuai Harapan)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-400 rounded" />
                          <span className="text-sm">
                            BSB (Berkembang Sangat Baik)
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card className="p-12 text-center">
            <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Pilih Kelas untuk Melihat Data
            </h3>
            <p className="text-muted-foreground">
              Gunakan filter di atas untuk memilih kelas dan tahun ajaran
            </p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
