'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GraduationCap,
  BookOpen,
  Users,
  BarChart3,
  Calendar,
  FileText,
  ClipboardCheck,
  Activity,
  RefreshCw,
  ChevronRight,
  Star,
  Smile,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import {
  usePAUDDashboard,
  getAspectLabel,
  getAchievementLabel,
  getAchievementColor,
} from '@/hooks/use-paud-dashboard';

export default function TKPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch real data from API
  const { stats, recentAssessments, recentReports, isLoading, refetch } = usePAUDDashboard();

  const menuItems = [
    {
      title: 'Penilaian TK',
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
      title: 'Rapor TK',
      description: 'Laporan perkembangan semester',
      icon: FileText,
      href: '/paud/reports',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Data Siswa',
      description: 'Manajemen data siswa TK',
      icon: Users,
      href: '/students?unit=TK_QURAN',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const statsConfig = [
    {
      title: 'Total Siswa',
      value: stats?.totalStudents ?? 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Penilaian Bulan Ini',
      value: stats?.assessmentsThisMonth ?? 0,
      icon: ClipboardCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Laporan Harian',
      value: stats?.dailyReportsThisMonth ?? 0,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Rapor Aktif',
      value: stats?.activeReports ?? 0,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">TK Management</h1>
            <p className="text-muted-foreground">
              Sistem penilaian dan pelaporan untuk TK Qur'an
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
              {statsConfig.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <div className="text-2xl font-bold">{stat.value}</div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Menu Cards & Recent Activity */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Menu Cards */}
              <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
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

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Aktivitas Terbaru
                  </CardTitle>
                  <CardDescription>Penilaian & laporan terkini</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[280px]">
                    <div className="space-y-3">
                      {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex items-start gap-3 p-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          {/* Recent Assessments */}
                          {recentAssessments?.map((assessment) => (
                            <div key={assessment.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="bg-blue-100 p-2 rounded-full">
                                <Star className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {assessment.student?.name || 'Siswa'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {assessment.indicator?.name || 'Penilaian'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={getAchievementColor(assessment.achievementLevel)} variant="secondary">
                                    {getAchievementLabel(assessment.achievementLevel)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Recent Daily Reports */}
                          {recentReports?.map((report) => (
                            <div key={report.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="bg-green-100 p-2 rounded-full">
                                <Smile className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {report.student?.name || 'Siswa'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(report.date), 'd MMM yyyy', { locale: localeId })}
                                </p>
                                {report.mood && (
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    {report.mood}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {(!recentAssessments || recentAssessments.length === 0) && 
                           (!recentReports || recentReports.length === 0) && (
                            <div className="text-center text-sm text-muted-foreground py-8">
                              Belum ada aktivitas
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
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
                <CardTitle>Penilaian TK</CardTitle>
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
                  Rapor dan laporan perkembangan siswa TK
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
