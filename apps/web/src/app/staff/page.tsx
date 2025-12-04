'use client';

import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  HeartPulse,
  FileWarning,
  Award,
  Bell,
  ClipboardList,
  DollarSign,
  Building2,
} from 'lucide-react';
import Link from 'next/link';

export default function StaffDashboard() {
  const { user } = useAuthStore();

  const quickActions = [
    {
      title: 'Data Siswa',
      description: 'Kelola data siswa',
      icon: Users,
      href: '/students',
      color: 'bg-blue-500',
    },
    {
      title: 'Kesehatan',
      description: 'Rekam kesehatan siswa',
      icon: HeartPulse,
      href: '/health',
      color: 'bg-red-500',
    },
    {
      title: 'Perizinan',
      description: 'Kelola perizinan',
      icon: ClipboardList,
      href: '/permits',
      color: 'bg-purple-500',
    },
    {
      title: 'Keuangan',
      description: 'Pembayaran siswa',
      icon: DollarSign,
      href: '/finance',
      color: 'bg-green-500',
    },
  ];

  const pendingTasks = [
    { title: 'Izin Pulang - Ahmad Fauzi', type: 'permit', status: 'pending', date: 'Hari ini' },
    { title: 'Laporan Kesehatan - Fatimah', type: 'health', status: 'pending', date: 'Hari ini' },
    { title: 'Pelanggaran - Kelas 8A', type: 'violation', status: 'review', date: 'Kemarin' },
    { title: 'Penghargaan - Lomba MTQ', type: 'reward', status: 'approved', date: 'Kemarin' },
  ];

  const recentActivities = [
    { action: 'Menyetujui izin pulang', subject: 'Muhammad Rizki', time: '2 jam lalu' },
    { action: 'Mencatat pelanggaran', subject: 'Kelas 7B', time: '3 jam lalu' },
    { action: 'Update data kesehatan', subject: 'Aisyah Putri', time: '5 jam lalu' },
    { action: 'Memberikan penghargaan', subject: 'Ahmad Fauzi', time: 'Kemarin' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Selamat Datang, {user?.name?.split(' ')[0] || 'Staff'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Dashboard Staff - Kelola administrasi dan layanan siswa
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
            <CardTitle className="text-sm font-medium">Izin Pending</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">menunggu persetujuan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Siswa Sakit</CardTitle>
            <HeartPulse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">hari ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggaran</CardTitle>
            <FileWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">minggu ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penghargaan</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">bulan ini</p>
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
        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Tugas Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded ${
                      task.type === 'permit' ? 'bg-purple-100' :
                      task.type === 'health' ? 'bg-red-100' :
                      task.type === 'violation' ? 'bg-orange-100' :
                      'bg-green-100'
                    }`}>
                      {task.type === 'permit' && <ClipboardList className="h-4 w-4 text-purple-600" />}
                      {task.type === 'health' && <HeartPulse className="h-4 w-4 text-red-600" />}
                      {task.type === 'violation' && <FileWarning className="h-4 w-4 text-orange-600" />}
                      {task.type === 'reward' && <Award className="h-4 w-4 text-green-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.date}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    task.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    task.status === 'review' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {task.status === 'pending' ? 'Pending' : 
                     task.status === 'review' ? 'Review' : 'Approved'}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/permits">Lihat Semua Tugas</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Aktivitas Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.action}</span>
                      <span className="text-muted-foreground"> - {activity.subject}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Menu Lainnya
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/violations">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <FileWarning className="h-6 w-6" />
                <span>Pelanggaran</span>
              </Button>
            </Link>
            <Link href="/rewards">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Award className="h-6 w-6" />
                <span>Penghargaan</span>
              </Button>
            </Link>
            <Link href="/announcements">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Bell className="h-6 w-6" />
                <span>Pengumuman</span>
              </Button>
            </Link>
            <Link href="/students">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Users className="h-6 w-6" />
                <span>Data Siswa</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
