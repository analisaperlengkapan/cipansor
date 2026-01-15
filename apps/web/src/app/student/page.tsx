'use client';

import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BookOpen,
  Calendar,
  Bell,
  Award,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  User,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';
import {
  useStudentDashboard,
  getGradeDisplay,
  getStatusDisplay,
} from '@/hooks/use-student-dashboard';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { 
    progress, 
    recentHafalan, 
    todaySchedule, 
    stats,
    isLoading, 
    isError,
    refetch 
  } = useStudentDashboard();

  const quickActions = [
    {
      title: 'Hafalan Saya',
      description: 'Lihat progress hafalan',
      icon: BookOpen,
      href: '/tahfidz',
      color: 'bg-green-500',
    },
    {
      title: 'Jadwal',
      description: 'Jadwal kegiatan',
      icon: Calendar,
      href: '/schedule',
      color: 'bg-blue-500',
    },
    {
      title: 'Pengumuman',
      description: 'Info terbaru',
      icon: Bell,
      href: '/announcements',
      color: 'bg-orange-500',
    },
    {
      title: 'Prestasi',
      description: 'Penghargaan saya',
      icon: Award,
      href: '/student/achievements',
      color: 'bg-purple-500',
    },
  ];

  if (isLoading) {
    return <StudentDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Assalamu&apos;alaikum, {user?.name?.split(' ')[0] || 'Santri'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Dashboard Santri - Pantau progress belajar dan hafalanmu
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <div className="text-right text-sm text-muted-foreground">
            <p>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Gagal memuat beberapa data. Klik refresh untuk mencoba lagi.
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Card */}
      <Card className="bg-linear-to-r from-green-500 to-emerald-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Progress Hafalan Semester Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <Progress 
                value={progress?.percentage || 0} 
                className="h-4 bg-white/20" 
              />
              <div className="flex justify-between mt-2 text-sm">
                <span>{progress?.totalJuz || 0} Juz selesai</span>
                <span>Target: {progress?.targetJuz || 5} Juz</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">{progress?.percentage || 0}%</div>
              <p className="text-sm opacity-80">Tercapai</p>
            </div>
          </div>
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{progress?.completedSurahs || 0}/{progress?.totalSurahs || 114} Surat</span>
            </div>
            <div className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              <span>{progress?.totalPages || 0} Halaman</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hafalan</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalHafalan.juz || 0} Juz</div>
            <p className="text-xs text-muted-foreground">{stats?.totalHafalan.pages || 0} halaman</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Setoran Bulan Ini</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.setoranThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.setoranThisMonth && stats?.setoranLastMonth ? (
                stats.setoranThisMonth > stats.setoranLastMonth
                  ? `+${stats.setoranThisMonth - stats.setoranLastMonth} dari bulan lalu`
                  : stats.setoranThisMonth < stats.setoranLastMonth
                    ? `${stats.setoranThisMonth - stats.setoranLastMonth} dari bulan lalu`
                    : 'sama dengan bulan lalu'
              ) : (
                'setoran bulan ini'
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nilai Rata-rata</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageGrade || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.averageScore ? `Skor: ${stats.averageScore.toFixed(1)}` : 'belum ada data'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penghargaan</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRewards || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.attendancePercentage ? `Kehadiran: ${stats.attendancePercentage}%` : 'tahun ini'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Aksi Cepat</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Jadwal Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedule && todaySchedule.length > 0 ? (
              <div className="space-y-3">
                {todaySchedule.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="text-sm font-medium text-muted-foreground w-14">
                      {item.time}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${item.status === 'completed' ? 'text-muted-foreground line-through' : 'font-medium'}`}>
                        {item.activity}
                      </p>
                      {item.teacher && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.teacher}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.type === 'TAHFIDZ' ? 'Tahfidz' :
                         item.type === 'RELIGIOUS' ? 'Diniyah' :
                         item.type === 'ACADEMIC' ? 'Formal' : 'Ekstra'}
                      </Badge>
                      {item.status === 'completed' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {item.status === 'ongoing' && (
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      )}
                      {item.status === 'upcoming' && (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Tidak ada jadwal hari ini</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Hafalan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Setoran Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentHafalan && recentHafalan.length > 0 ? (
              <div className="space-y-4">
                {recentHafalan.map((item) => {
                  const gradeInfo = getGradeDisplay(item.grade);
                  const statusInfo = getStatusDisplay(item.status);
                  
                  return (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {item.surahName}: {item.ayahStart}-{item.ayahEnd}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.createdAt), { 
                            addSuffix: true, 
                            locale: localeId 
                          })}
                          {item.teacherName && ` • ${item.teacherName}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                        <Badge className={gradeInfo.color}>
                          {gradeInfo.label.split(' ')[0]}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Belum ada setoran</p>
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/tahfidz">Lihat Semua Hafalan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Motivational Card */}
      <Card className="bg-linear-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="font-arabic text-xl mb-2">
              خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
            </p>
            <p className="text-sm text-muted-foreground italic">
              &quot;Sebaik-baik kalian adalah orang yang belajar Al-Qur&apos;an dan mengajarkannya&quot;
            </p>
            <p className="text-xs text-muted-foreground mt-1">- HR. Bukhari</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Skeleton component for loading state
function StudentDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>
        <Skeleton className="h-5 w-32" />
      </div>

      <Skeleton className="h-40 w-full rounded-lg" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <Skeleton className="h-7 w-32 mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
