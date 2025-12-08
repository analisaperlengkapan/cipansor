'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useUnits } from '@/hooks/use-units';
import { useDashboardStats, useAttendanceStats, useFinanceStats, useTahfidzStats } from '@/hooks';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeftRight,
  Calendar,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

type PeriodFilter = 'week' | 'month' | 'year';

export default function UnitComparisonPage() {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  const { data: unitsData, isLoading: isLoadingUnits } = useUnits();
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();

  const units = unitsData?.data || [];

  // Sample comparison data - replace with real API
  const comparisonData = [
    { unit: 'TK Qur\'an', santri: 120, guru: 15, kehadiran: 95, tahfidz: 85 },
    { unit: 'SD IT', santri: 350, guru: 28, kehadiran: 92, tahfidz: 78 },
    { unit: 'SMP IT', santri: 280, guru: 22, kehadiran: 88, tahfidz: 82 },
    { unit: 'SMA Qur\'an', santri: 200, guru: 18, kehadiran: 90, tahfidz: 90 },
    { unit: 'Pesantren', santri: 450, guru: 35, kehadiran: 94, tahfidz: 88 },
  ];

  const radarData = [
    { subject: 'Kehadiran', 'TK Qur\'an': 95, 'SD IT': 92, 'SMP IT': 88, fullMark: 100 },
    { subject: 'Tahfidz', 'TK Qur\'an': 85, 'SD IT': 78, 'SMP IT': 82, fullMark: 100 },
    { subject: 'Akademik', 'TK Qur\'an': 90, 'SD IT': 88, 'SMP IT': 85, fullMark: 100 },
    { subject: 'Kedisiplinan', 'TK Qur\'an': 92, 'SD IT': 85, 'SMP IT': 80, fullMark: 100 },
    { subject: 'Ekstrakurikuler', 'TK Qur\'an': 75, 'SD IT': 90, 'SMP IT': 88, fullMark: 100 },
  ];

  const trendData = [
    { month: 'Jan', 'TK Qur\'an': 89, 'SD IT': 85, 'SMP IT': 82, 'SMA Qur\'an': 88 },
    { month: 'Feb', 'TK Qur\'an': 91, 'SD IT': 87, 'SMP IT': 84, 'SMA Qur\'an': 89 },
    { month: 'Mar', 'TK Qur\'an': 93, 'SD IT': 88, 'SMP IT': 86, 'SMA Qur\'an': 91 },
    { month: 'Apr', 'TK Qur\'an': 92, 'SD IT': 90, 'SMP IT': 85, 'SMA Qur\'an': 90 },
    { month: 'Mei', 'TK Qur\'an': 95, 'SD IT': 92, 'SMP IT': 88, 'SMA Qur\'an': 92 },
    { month: 'Jun', 'TK Qur\'an': 94, 'SD IT': 91, 'SMP IT': 87, 'SMA Qur\'an': 91 },
  ];

  const rankingData = [
    { rank: 1, unit: 'TK Qur\'an', score: 92.5, trend: 'up' },
    { rank: 2, unit: 'Pesantren', score: 91.2, trend: 'up' },
    { rank: 3, unit: 'SMA Qur\'an', score: 89.8, trend: 'stable' },
    { rank: 4, unit: 'SD IT', score: 87.5, trend: 'down' },
    { rank: 5, unit: 'SMP IT', score: 85.3, trend: 'up' },
  ];

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Perbandingan Unit"
          description="Analisis perbandingan kinerja antar unit pendidikan"
          icon={ArrowLeftRight}
        />

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Minggu ini</SelectItem>
                  <SelectItem value="month">Bulan ini</SelectItem>
                  <SelectItem value="year">Tahun ini</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {comparisonData.map((unit, index) => (
            <Card key={unit.unit} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" style={{ color: CHART_COLORS[index % CHART_COLORS.length] }} />
                  {unit.unit}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" /> Santri
                  </span>
                  <span className="font-semibold">{unit.santri}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> Guru
                  </span>
                  <span className="font-semibold">{unit.guru}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Kehadiran
                  </span>
                  <Badge variant={unit.kehadiran >= 90 ? 'default' : 'secondary'}>
                    {unit.kehadiran}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> Tahfidz
                  </span>
                  <Badge variant={unit.tahfidz >= 85 ? 'default' : 'secondary'}>
                    {unit.tahfidz}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Bar Chart - Student Count Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Jumlah Santri per Unit</CardTitle>
              <CardDescription>Perbandingan total santri di setiap unit</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="unit" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="santri" name="Santri" radius={[4, 4, 0, 0]}>
                    {comparisonData.map((_, index) => (
                      <Bar key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radar Chart - Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Performa Unit</CardTitle>
              <CardDescription>Perbandingan multi-aspek antar unit</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" className="text-xs" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="TK Qur'an"
                    dataKey="TK Qur'an"
                    stroke={CHART_COLORS[0]}
                    fill={CHART_COLORS[0]}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="SD IT"
                    dataKey="SD IT"
                    stroke={CHART_COLORS[1]}
                    fill={CHART_COLORS[1]}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="SMP IT"
                    dataKey="SMP IT"
                    stroke={CHART_COLORS[2]}
                    fill={CHART_COLORS[2]}
                    fillOpacity={0.3}
                  />
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tren Kehadiran per Unit</CardTitle>
            <CardDescription>Perbandingan tingkat kehadiran 6 bulan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis domain={[75, 100]} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="TK Qur'an"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="SD IT"
                  stroke={CHART_COLORS[1]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="SMP IT"
                  stroke={CHART_COLORS[2]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="SMA Qur'an"
                  stroke={CHART_COLORS[3]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ranking Section */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Overall Ranking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Peringkat Unit
              </CardTitle>
              <CardDescription>Berdasarkan skor performa keseluruhan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankingData.map((item) => (
                  <div
                    key={item.unit}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg',
                      item.rank === 1
                        ? 'bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800'
                        : item.rank === 2
                        ? 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
                        : item.rank === 3
                        ? 'bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800'
                        : 'border border-border'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                          item.rank === 1
                            ? 'bg-yellow-500 text-white'
                            : item.rank === 2
                            ? 'bg-gray-400 text-white'
                            : item.rank === 3
                            ? 'bg-orange-400 text-white'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {item.rank}
                      </div>
                      <div>
                        <p className="font-medium">{item.unit}</p>
                        <p className="text-sm text-muted-foreground">Skor: {item.score}</p>
                      </div>
                    </div>
                    <TrendIcon trend={item.trend} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Metrik Kunci</CardTitle>
              <CardDescription>Perbandingan indikator utama antar unit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Unit</th>
                      <th className="text-center py-2 font-medium">Rasio G:S</th>
                      <th className="text-center py-2 font-medium">Kehadiran</th>
                      <th className="text-center py-2 font-medium">Tahfidz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((unit) => (
                      <tr key={unit.unit} className="border-b last:border-0">
                        <td className="py-3 font-medium">{unit.unit}</td>
                        <td className="py-3 text-center">
                          1:{Math.round(unit.santri / unit.guru)}
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant={unit.kehadiran >= 90 ? 'default' : 'secondary'}>
                            {unit.kehadiran}%
                          </Badge>
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant={unit.tahfidz >= 85 ? 'default' : 'secondary'}>
                            {unit.tahfidz}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
