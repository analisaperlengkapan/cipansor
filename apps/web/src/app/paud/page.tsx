'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GraduationCap,
  BookOpen,
  Users,
  BarChart3,
  Calendar,
  FileText,
  ClipboardCheck,
  Activity,
} from 'lucide-react';
import Link from 'next/link';

export default function PAUDPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const menuItems = [
    {
      title: 'Penilaian PAUD',
      description: 'Penilaian perkembangan anak berdasarkan indikator',
      icon: ClipboardCheck,
      href: '/paud/assessment',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Laporan Harian',
      description: 'Catatan kegiatan dan perkembangan harian anak',
      icon: Calendar,
      href: '/paud/daily-reports',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Rapor PAUD',
      description: 'Laporan perkembangan semester',
      icon: FileText,
      href: '/paud/reports',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Data Siswa',
      description: 'Manajemen data siswa PAUD',
      icon: Users,
      href: '/students?unit=TK_QURAN',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const stats = [
    {
      title: 'Total Siswa',
      value: '0',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Penilaian Bulan Ini',
      value: '0',
      icon: ClipboardCheck,
      color: 'text-green-600',
    },
    {
      title: 'Laporan Harian',
      value: '0',
      icon: Calendar,
      color: 'text-purple-600',
    },
    {
      title: 'Rapor Aktif',
      value: '0',
      icon: FileText,
      color: 'text-orange-600',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PAUD Management</h1>
          <p className="text-muted-foreground">
            Sistem penilaian dan pelaporan untuk TK Qur'an
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assessment">Penilaian</TabsTrigger>
            <TabsTrigger value="reports">Laporan</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Menu Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${item.bgColor}`}>
                            <Icon className={`h-6 w-6 ${item.color}`} />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {item.title}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              {item.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Akses cepat ke fitur yang sering digunakan
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <Link href="/paud/assessment">
                  <Button className="w-full" variant="outline">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Buat Penilaian
                  </Button>
                </Link>
                <Link href="/paud/daily-reports">
                  <Button className="w-full" variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Laporan Harian
                  </Button>
                </Link>
                <Link href="/paud/reports">
                  <Button className="w-full" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Lihat Rapor
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Penilaian PAUD</CardTitle>
                <CardDescription>
                  Sistem penilaian perkembangan anak berdasarkan 6 aspek
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Aspek perkembangan yang dinilai:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>• Nilai Agama dan Moral</li>
                    <li>• Fisik Motorik</li>
                    <li>• Kognitif</li>
                    <li>• Bahasa</li>
                    <li>• Sosial Emosional</li>
                    <li>• Seni</li>
                  </ul>
                  <Link href="/paud/assessment">
                    <Button className="w-full mt-4">
                      Mulai Penilaian
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Laporan Perkembangan</CardTitle>
                <CardDescription>
                  Rapor dan laporan perkembangan siswa PAUD
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Jenis laporan yang tersedia:
                  </p>
                  <div className="grid gap-3">
                    <Link href="/paud/daily-reports">
                      <Card className="hover:bg-accent cursor-pointer">
                        <CardHeader className="p-4">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-green-600" />
                            <div>
                              <CardTitle className="text-base">
                                Laporan Harian
                              </CardTitle>
                              <CardDescription className="text-xs">
                                Catatan kegiatan harian
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                    <Link href="/paud/reports">
                      <Card className="hover:bg-accent cursor-pointer">
                        <CardHeader className="p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-purple-600" />
                            <div>
                              <CardTitle className="text-base">
                                Rapor Semester
                              </CardTitle>
                              <CardDescription className="text-xs">
                                Laporan perkembangan semester
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
