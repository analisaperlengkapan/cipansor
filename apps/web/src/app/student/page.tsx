'use client';

import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Calendar,
  Bell,
  Award,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user } = useAuthStore();

  const hafalanProgress = {
    target: 5, // Juz target semester
    completed: 3, // Juz selesai
    percentage: 60,
  };

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

  const recentHafalan = [
    { surah: 'Al-Baqarah', ayat: '1-20', status: 'Lancar', date: 'Hari ini', grade: 'A' },
    { surah: 'Ali Imran', ayat: '1-15', status: 'Lancar', date: 'Kemarin', grade: 'A-' },
    { surah: 'An-Nisa', ayat: '1-10', status: 'Perlu Muraja\'ah', date: '2 hari lalu', grade: 'B+' },
  ];

  const todaySchedule = [
    { time: '05:00', activity: 'Sholat Subuh & Tahajud', status: 'completed' },
    { time: '05:30', activity: 'Tahfidz Pagi', status: 'completed' },
    { time: '07:00', activity: 'Sarapan', status: 'completed' },
    { time: '08:00', activity: 'Pelajaran Formal', status: 'ongoing' },
    { time: '12:00', activity: 'Sholat Dzuhur', status: 'upcoming' },
    { time: '13:00', activity: 'Tahfidz Siang', status: 'upcoming' },
  ];

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
        <div className="text-right text-sm text-muted-foreground">
          <p>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

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
              <Progress value={hafalanProgress.percentage} className="h-4 bg-white/20" />
              <div className="flex justify-between mt-2 text-sm">
                <span>{hafalanProgress.completed} Juz selesai</span>
                <span>Target: {hafalanProgress.target} Juz</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">{hafalanProgress.percentage}%</div>
              <p className="text-sm opacity-80">Tercapai</p>
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
            <div className="text-2xl font-bold">3 Juz</div>
            <p className="text-xs text-muted-foreground">90 halaman</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Setoran Bulan Ini</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">+5 dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nilai Rata-rata</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">A-</div>
            <p className="text-xs text-muted-foreground">sangat baik</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penghargaan</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">tahun ini</p>
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
            <div className="space-y-3">
              {todaySchedule.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="text-sm font-medium text-muted-foreground w-14">
                    {item.time}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${item.status === 'completed' ? 'text-muted-foreground line-through' : 'font-medium'}`}>
                      {item.activity}
                    </p>
                  </div>
                  <div>
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
            <div className="space-y-4">
              {recentHafalan.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.surah}: {item.ayat}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      item.status === 'Lancar' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-lg font-bold text-green-600">{item.grade}</span>
                  </div>
                </div>
              ))}
            </div>
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
