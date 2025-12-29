'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  BookOpen,
  TrendingUp,
  Users,
  Calendar,
  Target,
  ArrowLeft,
  Trophy,
  BarChart3,
} from 'lucide-react';

import { MainLayout } from '@/components/layout/main-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useTahfidzDashboard,
  TAHFIDZ_TYPES,
} from '@/hooks/use-tahfidz';
import { useUnits } from '@/hooks/use-units';
import { cn } from '@/lib/utils';

const MONTHS = [
  { value: 0, label: 'Januari' },
  { value: 1, label: 'Februari' },
  { value: 2, label: 'Maret' },
  { value: 3, label: 'April' },
  { value: 4, label: 'Mei' },
  { value: 5, label: 'Juni' },
  { value: 6, label: 'Juli' },
  { value: 7, label: 'Agustus' },
  { value: 8, label: 'September' },
  { value: 9, label: 'Oktober' },
  { value: 10, label: 'November' },
  { value: 11, label: 'Desember' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function TahfidzDashboardPage() {
  const [unitId, setUnitId] = useState<string>('ALL');
  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<string>('ALL');

  const { data: unitsData } = useUnits();
  const units = unitsData || [];

  const { data: stats, isLoading } = useTahfidzDashboard({
    unitId: unitId === 'ALL' ? undefined : unitId,
    year,
    month: month === 'ALL' ? undefined : parseInt(month),
  });

  // Calculate max student count for juz progress
  const maxJuzStudentCount = stats?.progressByJuz
    ? Math.max(...stats.progressByJuz.map(j => j.studentCount), 1)
    : 1;

  // Calculate total monthly activity
  const getMonthTotal = (item: { setoran: number; murajaah: number; tasmi: number }) => {
    return item.setoran + item.murajaah + item.tasmi;
  };

  return (
    <MainLayout>
      <PageHeader
        title="Dashboard Tahfidz"
        description="Analisis dan statistik capaian tahfidz Al-Quran"
      />

      {/* Back Button */}
      <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/tahfidz">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Semua Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Unit</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={year.toString()}
              onValueChange={(v) => setYear(parseInt(v))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={month}
              onValueChange={setMonth}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Semua Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Bulan</SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              onClick={() => {
                setUnitId('ALL');
                setYear(currentYear);
                setMonth('ALL');
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Catatan</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{stats?.totalRecords || 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Santri Aktif</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Juz Dicapai</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">
                {stats?.progressByJuz?.filter(j => j.completedCount > 0).length || 0}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Rata-rata Catatan/Bulan</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">
                {stats?.monthlyActivity?.length
                  ? Math.round(stats.monthlyActivity.reduce((a, b) => a + getMonthTotal(b), 0) / stats.monthlyActivity.length)
                  : 0}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Records by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Catatan per Tipe
            </CardTitle>
            <CardDescription>Distribusi catatan berdasarkan tipe aktivitas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats?.recordsByType?.length ? (
              <div className="space-y-4">
                {stats.recordsByType.map((item) => {
                  const typeConfig = TAHFIDZ_TYPES.find((t) => t.value === item.type);
                  const total = stats.totalRecords || 1;
                  const percentage = Math.round((item.count / total) * 100);

                  return (
                    <div key={item.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              item.type === 'SETORAN' && 'bg-green-50 border-green-200 text-green-700',
                              item.type === 'MURAJAAH' && 'bg-blue-50 border-blue-200 text-blue-700',
                              item.type === 'TASMI' && 'bg-purple-50 border-purple-200 text-purple-700',
                            )}
                          >
                            {typeConfig?.label || item.type}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className={cn(
                          'h-2',
                          item.type === 'SETORAN' && '[&>div]:bg-green-500',
                          item.type === 'MURAJAAH' && '[&>div]:bg-blue-500',
                          item.type === 'TASMI' && '[&>div]:bg-purple-500',
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">Tidak ada data</p>
            )}
          </CardContent>
        </Card>

        {/* Top Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Top 10 Santri
            </CardTitle>
            <CardDescription>Santri dengan total ayat terbanyak</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : stats?.topStudents?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="text-right">Total Ayat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topStudents.map((student, idx) => (
                    <TableRow key={student.studentId}>
                      <TableCell>
                        {idx === 0 ? (
                          <Badge className="bg-amber-500">1</Badge>
                        ) : idx === 1 ? (
                          <Badge className="bg-gray-400">2</Badge>
                        ) : idx === 2 ? (
                          <Badge className="bg-amber-700">3</Badge>
                        ) : (
                          <span className="text-muted-foreground">{idx + 1}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{student.studentName}</p>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {student.totalAyah}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">Tidak ada data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress by Juz */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress per Juz
          </CardTitle>
          <CardDescription>Capaian hafalan berdasarkan Juz 1-30</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
              {Array.from({ length: 30 }, (_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : stats?.progressByJuz?.length ? (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
              {stats.progressByJuz.map((juz) => {
                const percentage = Math.min(Math.round((juz.studentCount / maxJuzStudentCount) * 100), 100);
                const hasData = juz.studentCount > 0;

                return (
                  <div
                    key={juz.juz}
                    className={cn(
                      'p-2 rounded-lg border text-center transition-colors',
                      hasData
                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    )}
                  >
                    <p className="text-xs text-muted-foreground mb-1">Juz</p>
                    <p className={cn(
                      'text-lg font-bold',
                      hasData ? 'text-green-700' : 'text-gray-400'
                    )}>
                      {juz.juz}
                    </p>
                    <p className={cn(
                      'text-xs',
                      hasData ? 'text-green-600' : 'text-gray-400'
                    )}>
                      {juz.studentCount} santri
                    </p>
                    {hasData && (
                      <div className="h-1 mt-1 bg-green-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Tidak ada data progress per juz</p>
          )}
        </CardContent>
      </Card>

      {/* Monthly Activity */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Aktivitas Bulanan
          </CardTitle>
          <CardDescription>Jumlah catatan tahfidz per bulan</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-end gap-2 h-40">
              {Array.from({ length: 12 }, (_, i) => (
                <Skeleton key={i} className="flex-1 h-full" />
              ))}
            </div>
          ) : stats?.monthlyActivity?.length ? (
            <div className="flex items-end gap-1 h-40">
              {stats.monthlyActivity.map((item) => {
                const total = getMonthTotal(item);
                const maxCount = Math.max(...stats.monthlyActivity!.map((m) => getMonthTotal(m)), 1);
                const height = Math.max((total / maxCount) * 100, 5);

                return (
                  <div
                    key={item.month}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <span className="text-xs font-medium">{total}</span>
                    <div
                      className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Tidak ada data aktivitas bulanan</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Records */}
      <Card>
        <CardHeader>
          <CardTitle>Catatan Terbaru</CardTitle>
          <CardDescription>10 catatan tahfidz terakhir</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : stats?.recentRecords?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Santri</TableHead>
                  <TableHead>Surah</TableHead>
                  <TableHead>Ayat</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Nilai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-sm">
                      {record.recordedAt ? format(new Date(record.recordedAt), 'd MMM yyyy', { locale: localeId }) : '-'}
                    </TableCell>
                    <TableCell className="font-medium">{record.student?.user?.name || '-'}</TableCell>
                    <TableCell>{record.surahName || '-'}</TableCell>
                    <TableCell>
                      {record.ayahStart} - {record.ayahEnd}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {TAHFIDZ_TYPES.find((t) => t.value === record.activityType)?.label || record.activityType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{record.score ?? '-'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">Tidak ada catatan terbaru</p>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
