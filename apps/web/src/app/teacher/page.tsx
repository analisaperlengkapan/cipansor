'use client';

import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Users,
  Calendar,
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

export default function TeacherDashboard() {
  const { user } = useAuthStore();

  const quickActions = [
    {
      title: 'Rekap Hafalan',
      description: 'Kelola hafalan siswa',
      icon: BookOpen,
      href: '/tahfidz',
      color: 'bg-green-500',
    },
    {
      title: 'Daftar Kelas',
      description: 'Lihat kelas yang diampu',
      icon: Users,
      href: '/classes',
      color: 'bg-blue-500',
    },
    {
      title: 'Absensi',
      description: 'Rekap kehadiran',
      icon: Calendar,
      href: '/attendance',
      color: 'bg-purple-500',
    },
    {
      title: 'Pengumuman',
      description: 'Info terbaru',
      icon: Bell,
      href: '/announcements',
      color: 'bg-orange-500',
    },
  ];

  const todaySchedule = [
    { time: '07:00', activity: 'Tahfidz Pagi - Kelas 7A', status: 'completed' },
    { time: '09:00', activity: 'Tahfidz - Kelas 8B', status: 'ongoing' },
    { time: '10:30', activity: 'Setoran Hafalan - Kelas 9A', status: 'upcoming' },
    { time: '13:00', activity: 'Muraja\'ah - Kelas 7B', status: 'upcoming' },
  ];

  const recentStudents = [
    { name: 'Ahmad Fauzi', surah: 'Al-Baqarah: 1-20', status: 'Lancar', date: 'Hari ini' },
    { name: 'Fatimah Azzahra', surah: 'Ali Imran: 1-15', status: 'Perlu Pengulangan', date: 'Hari ini' },
    { name: 'Muhammad Rizki', surah: 'An-Nisa: 1-10', status: 'Lancar', date: 'Kemarin' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Assalamu&apos;alaikum, {user?.name?.split(' ')[0] || 'Ustadz/ah'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Dashboard Guru - Kelola hafalan dan pembelajaran Anda
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85</div>
            <p className="text-xs text-muted-foreground">dari 4 kelas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Setoran Hari Ini</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+3 dari kemarin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Tercapai</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">semester ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jadwal Hari Ini</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">sesi mengajar</p>
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
            <div className="space-y-4">
              {todaySchedule.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="text-sm font-medium text-muted-foreground w-14">
                    {item.time}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.activity}</p>
                  </div>
                  <div>
                    {item.status === 'completed' && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Selesai
                      </span>
                    )}
                    {item.status === 'ongoing' && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        Berlangsung
                      </span>
                    )}
                    {item.status === 'upcoming' && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        Akan Datang
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Setoran Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentStudents.map((student, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.surah}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      student.status === 'Lancar' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {student.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{student.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/tahfidz">Lihat Semua Setoran</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
