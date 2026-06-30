"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  GraduationCap,
  CheckCircle,
  Wallet,
  BookOpen,
  TrendingUp,
  Building2,
  AlertTriangle,
  ArrowUpRight,
  BarChart3
} from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function ConsolidatedDashboardPage() {
  // Assuming first foundation ID for simplicity, in real app would come from context/settings
  const foundationId = "default";

  const { data, isLoading } = useQuery({
    queryKey: ["consolidated-dashboard", foundationId],
    queryFn: async () => {
      // Trying to fetch from foundation modules
      const response = await api.get(`/foundation/${foundationId}/consolidated`);
      return response.data.data;
    },
    // Mock data for display if API fails or while developing
    initialData: {
      foundation: { name: "Yayasan Pesantren Cipansor" },
      metrics: {
        totalActiveStudents: 1250,
        totalTeachers: 85,
        todayAttendanceRate: 94.5,
        monthlyRevenue: 245000000,
        avgTahfidzJuz: 12.4
      },
      unitBreakdown: [
        { id: "1", name: "TK Qur'an", type: "TK_QURAN", students: 120, teachers: 10, status: "stable" },
        { id: "2", name: "SD IT", type: "SD_IT", students: 450, teachers: 30, status: "growing" },
        { id: "3", name: "SMP IT", type: "SMP_IT", students: 380, teachers: 25, status: "stable" },
        { id: "4", name: "SMA Al-Qur'an", type: "SMA_QURAN", students: 300, teachers: 20, status: "critical" },
      ]
    }
  });

  if (isLoading) return <DashboardSkeleton />;

  return (
    <MainLayout>
      <PageHeader
        title="Dashboard Eksekutif Yayasan"
        description={`Konsolidasi data untuk ${data.foundation.name}`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Total Santri Aktif"
          value={data.metrics.totalActiveStudents}
          icon={<Users className="h-4 w-4 text-blue-500" />}
          description="+12 dari bulan lalu"
          trend="up"
        />
        <StatsCard
          title="Kehadiran Hari Ini"
          value={`${data.metrics.todayAttendanceRate}%`}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          description="Rata-rata seluruh unit"
          progress={data.metrics.todayAttendanceRate}
        />
        <StatsCard
          title="Pendapatan (Bulan Ini)"
          value={formatCurrency(data.metrics.monthlyRevenue)}
          icon={<Wallet className="h-4 w-4 text-amber-500" />}
          description="92% dari target"
          trend="up"
        />
        <StatsCard
          title="Progres Tahfidz"
          value={`${data.metrics.avgTahfidzJuz} Juz`}
          icon={<BookOpen className="h-4 w-4 text-purple-500" />}
          description="Rata-rata hafalan santri"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Ringkasan Per Unit</CardTitle>
            <CardDescription>Performa dan statistik tiap jenjang pendidikan</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Unit</TableHead>
                  <TableHead className="text-right">Santri</TableHead>
                  <TableHead className="text-right">Guru</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.unitBreakdown.map((unit: any) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell className="text-right">{unit.students}</TableCell>
                    <TableCell className="text-right">{unit.teachers}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={unit.status === 'critical' ? 'destructive' : 'secondary'}
                        className={unit.status === 'growing' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {unit.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Alert & Notifikasi Sistem</CardTitle>
            <CardDescription>Hal-hal yang membutuhkan perhatian pimpinan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AlertItem
              type="warning"
              title="Penurunan Tahfidz di SMA"
              description="Rata-rata setoran ziyadah unit SMA menurun 15% dalam 2 minggu terakhir."
            />
            <AlertItem
              type="error"
              title="Tunggakan SPP Signifikan"
              description="Terdapat 24 santri dengan tunggakan di atas 3 bulan di unit SMP IT."
            />
            <AlertItem
              type="info"
              title="Akreditasi SD IT"
              description="Persiapan dokumen akreditasi SD IT sudah mencapai 85%."
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

function StatsCard({ title, value, icon, description, trend, progress }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center">
          {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1 text-green-500" />}
          {description}
        </p>
        {progress !== undefined && (
          <Progress value={progress} className="h-1 mt-3" />
        )}
      </CardContent>
    </Card>
  );
}

function AlertItem({ type, title, description }: any) {
  const colors = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
  };

  const icons = {
    warning: <AlertTriangle className="h-4 w-4 text-amber-600" />,
    error: <AlertTriangle className="h-4 w-4 text-red-600" />,
    info: <TrendingUp className="h-4 w-4 text-blue-600" />
  };

  return (
    <div className={`p-3 border rounded-lg flex gap-3 ${colors[type as keyof typeof colors]}`}>
      <div className="mt-0.5">{icons[type as keyof typeof icons]}</div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs opacity-90">{description}</p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <MainLayout>
      <PageHeader title="Memuat Dashboard..." description="Harap tunggu sebentar" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </MainLayout>
  );
}
