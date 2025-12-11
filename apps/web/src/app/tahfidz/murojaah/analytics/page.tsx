'use client';

import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  LineChart, 
  Line,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  CalendarIcon, 
  TrendingUp, 
  Target, 
  Award,
  AlertTriangle,
  CheckCircle2,
  Download,
  Filter,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useMurojaahAnalytics } from '@/hooks/use-murojaah-analytics';

export default function MurojaahAnalyticsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [halaqohFilter, setHalaqohFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Fetch analytics data
  const {
    qualityDistribution,
    mistakePatterns,
    consistencyScore,
    topPerformers,
    isLoading,
    isError,
  } = useMurojaahAnalytics({
    dateFrom: format(dateRange.from, 'yyyy-MM-dd'),
    dateTo: format(dateRange.to, 'yyyy-MM-dd'),
    halaqohId: halaqohFilter !== 'all' ? halaqohFilter : undefined,
    murojaahType: typeFilter !== 'all' ? typeFilter : undefined,
  });

  // Transform quality distribution data for chart
  const qualityChartData = useMemo(() => {
    if (!qualityDistribution.data) return [];
    const dist = qualityDistribution.data.distribution;
    return [
      { name: 'Sangat Baik (>90)', value: dist.excellent.count, percentage: dist.excellent.percentage, color: '#22c55e' },
      { name: 'Baik (75-90)', value: dist.good.count, percentage: dist.good.percentage, color: '#3b82f6' },
      { name: 'Cukup (60-75)', value: dist.fair.count, percentage: dist.fair.percentage, color: '#f59e0b' },
      { name: 'Perlu Perbaikan (<60)', value: dist.poor.count, percentage: dist.poor.percentage, color: '#ef4444' },
    ];
  }, [qualityDistribution.data]);

  // Transform mistake patterns data for chart
  const mistakeChartData = useMemo(() => {
    if (!mistakePatterns.data) return [];
    const patterns = mistakePatterns.data.patterns;
    const mistakeTypeLabels: Record<string, string> = {
      LAHIN_JALI: 'Lahin Jali',
      LAHIN_KHAFI: 'Lahin Khafi',
      TAJWID: 'Tajwid',
      MAKHROJ: 'Makhraj',
      OTHERS: 'Lainnya',
    };
    return Object.entries(patterns).map(([type, data]) => ({
      type: mistakeTypeLabels[type] || type,
      count: data.count,
      trend: data.trend > 0 ? 'up' : data.trend < 0 ? 'down' : 'stable',
    }));
  }, [mistakePatterns.data]);

  // Transform consistency data for chart
  const consistencyChartData = useMemo(() => {
    if (!consistencyScore.data) return [];
    return consistencyScore.data.dailyRecords.map(record => ({
      date: format(new Date(record.date), 'd MMM', { locale: idLocale }),
      avgQuality: Math.round(record.avgQuality),
      records: record.count,
    }));
  }, [consistencyScore.data]);

  if (isError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="font-semibold text-lg">Error Loading Analytics</h3>
            <p className="text-muted-foreground">Failed to load murojaah analytics data</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Analisis Murojaah"
          description="Dashboard analitik tracking kualitas murojaah santri"
        />

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              {/* Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[280px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd MMM yyyy', { locale: idLocale })} -{' '}
                          {format(dateRange.to, 'dd MMM yyyy', { locale: idLocale })}
                        </>
                      ) : (
                        format(dateRange.from, 'dd MMM yyyy', { locale: idLocale })
                      )
                    ) : (
                      <span>Pilih periode</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range: any) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Halaqoh Filter */}
              <Select value={halaqohFilter} onValueChange={setHalaqohFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Pilih halaqoh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Halaqoh</SelectItem>
                  <SelectItem value="h1">Halaqoh A</SelectItem>
                  <SelectItem value="h2">Halaqoh B</SelectItem>
                  <SelectItem value="h3">Halaqoh C</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Jenis murojaah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="YAUMIYAH">Yaumiyah</SelectItem>
                  <SelectItem value="USBUIYAH">Usbuiyah</SelectItem>
                  <SelectItem value="SYAHRIYAH">Syahriyah</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Record</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{qualityDistribution.data?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Dalam periode terpilih
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata Kualitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {qualityDistribution.data?.averageQuality.toFixed(1) || 0}
                  </div>
                  <Progress value={qualityDistribution.data?.averageQuality || 0} className="mt-2" />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Konsistensi</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {consistencyScore.data?.consistencyPercentage.toFixed(0) || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {consistencyScore.data?.activeDays || 0} dari {consistencyScore.data?.totalDays || 0} hari
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Perlu Perhatian</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-600">
                    {qualityDistribution.data?.distribution.poor.count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Record dengan kualitas rendah
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="quality" className="space-y-4">
          <TabsList>
            <TabsTrigger value="quality">Distribusi Kualitas</TabsTrigger>
            <TabsTrigger value="mistakes">Pola Kesalahan</TabsTrigger>
            <TabsTrigger value="consistency">Konsistensi</TabsTrigger>
            <TabsTrigger value="ranking">Peringkat</TabsTrigger>
          </TabsList>

          {/* Quality Distribution Tab */}
          <TabsContent value="quality" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Kualitas Murojaah</CardTitle>
                <CardDescription>
                  Sebaran tingkat kualitas murojaah santri dalam 30 hari terakhir
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-[300px]" />
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={qualityChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry: any) => `${entry.percentage.toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {qualityChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="space-y-3">
                      {qualityChartData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{item.value}</span>
                          <Badge variant="secondary">{item.percentage}%</Badge>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mistake Patterns Tab */}
          <TabsContent value="mistakes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pola Kesalahan</CardTitle>
                <CardDescription>
                  Analisis jenis kesalahan yang sering terjadi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px]" />
                ) : (
                  <>
                    <div className="h-[300px] mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mistakeChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" name="Jumlah Kesalahan" />
                    </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                      {mistakeChartData.map((mistake) => (
                    <div key={mistake.type} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">{mistake.type}</div>
                        <Badge variant="outline">{mistake.count} kejadian</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {mistake.trend === 'up' && (
                          <span className="text-red-600 flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" /> Meningkat
                          </span>
                        )}
                        {mistake.trend === 'down' && (
                          <span className="text-green-600 flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 rotate-180" /> Menurun
                          </span>
                        )}
                        {mistake.trend === 'stable' && (
                          <span className="text-gray-600">Stabil</span>
                        )}
                      </div>
                    </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consistency Tracking Tab */}
          <TabsContent value="consistency" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tracking Konsistensi</CardTitle>
                <CardDescription>
                  Tren kualitas dan jumlah record murojaah harian
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px]" />
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={consistencyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" domain={[0, 100]} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="avgQuality"
                        stroke="#22c55e"
                        strokeWidth={2}
                        name="Rata-rata Kualitas"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="records"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Jumlah Record"
                      />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ranking Tab */}
          <TabsContent value="ranking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Peringkat Santri</CardTitle>
                <CardDescription>
                  Top performers berdasarkan kualitas dan konsistensi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topPerformers.data?.performers.map((performer) => (
                    <div
                      key={performer.rank}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                          {performer.rank}
                        </div>
                        <div>
                          <div className="font-medium">{performer.studentName}</div>
                          <div className="text-sm text-muted-foreground">
                            {performer.recordCount} record murojaah
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Kualitas</div>
                          <div className="font-semibold text-green-600">
                            {performer.avgQuality}
                          </div>
                        </div>
                        <Award className="h-5 w-5 text-yellow-500" />
                      </div>
                    </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
