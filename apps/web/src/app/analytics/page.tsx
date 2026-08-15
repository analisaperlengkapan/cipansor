"use client";
import { MainLayout } from "@/components/layout";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  useStudentStatistics,
  useAttendanceSummaryAnalytics,
  useFinanceReport,
  useAcademicPerformance,
  useTahfidzProgress,
  TIME_RANGES,
  TIME_RANGE_LABELS,
  type TimeRange,
} from "@/hooks";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const currencyFormatter = (value: any) => formatCurrency(value as number);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pieLabelFormatter = ({ name, percent }: any) =>
  `${name}: ${(percent * 100).toFixed(0)}%`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const categoryLabelFormatter = ({ category, percent }: any) =>
  `${category}: ${(percent * 100).toFixed(0)}%`;

function AnalyticsPageContent() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState<TimeRange>("MONTHLY");

  const filter = { timeRange };

  const { data: studentStats, isLoading: studentLoading } =
    useStudentStatistics(filter);
  const { data: attendanceStats, isLoading: attendanceLoading } =
    useAttendanceSummaryAnalytics(filter);
  const { data: financeStats, isLoading: financeLoading } =
    useFinanceReport(filter);
  const { data: academicStats, isLoading: academicLoading } =
    useAcademicPerformance(filter);
  const { data: tahfidzStats } = useTahfidzProgress(filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* Was "Analitik & Laporan", which claimed a job /reports already
              does. The three Overview pages now have one role each: Dashboard
              is what needs attention today, Analytics is trends, and Reports
              is the only place that produces a document. */}
          <h1 className="text-3xl font-bold tracking-tight">Analitik</h1>
          <p className="text-muted-foreground">
            Tren dan perbandingan lintas periode
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={timeRange}
            onValueChange={(v) => setTimeRange(v as TimeRange)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rentang Waktu" />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.filter((t) => t !== "CUSTOM").map((range) => (
                <SelectItem key={range} value={range}>
                  {TIME_RANGE_LABELS[range]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <a href="/analytics/academic">🎯 Intervensi</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/analytics/forecast">📈 Forecast</a>
          </Button>
          {/* Export lives in /reports now. Keeping a second export surface
              here meant two places generated the same documents by different
              code paths, with no guarantee they agreed. */}
          <Button variant="outline" asChild>
            <Link href="/reports">📄 Buat Laporan</Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Santri</TabsTrigger>
          <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
          <TabsTrigger value="finance">Keuangan</TabsTrigger>
          <TabsTrigger value="academic">Akademik</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Santri</CardDescription>
                <CardTitle className="text-2xl">
                  {studentLoading
                    ? "..."
                    : studentStats?.data?.totalStudents || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  +{studentStats?.data?.newStudentsThisMonth || 0} bulan ini
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tingkat Kehadiran</CardDescription>
                <CardTitle className="text-2xl">
                  {attendanceLoading
                    ? "..."
                    : `${attendanceStats?.data?.presentRate || 0}%`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={
                    (attendanceStats?.data?.presentRate || 0) >= 90
                      ? "default"
                      : (attendanceStats?.data?.presentRate || 0) >= 80
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {(attendanceStats?.data?.presentRate || 0) >= 90
                    ? "Baik"
                    : (attendanceStats?.data?.presentRate || 0) >= 80
                      ? "Cukup"
                      : "Perlu Perhatian"}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pendapatan Bulan Ini</CardDescription>
                <CardTitle className="text-2xl">
                  {financeLoading
                    ? "..."
                    : formatCurrency(financeStats?.data?.totalRevenue || 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Collection rate: {financeStats?.data?.collectionRate || 0}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rata-rata IPK</CardDescription>
                <CardTitle className="text-2xl">
                  {academicLoading
                    ? "..."
                    : (academicStats?.data?.averageGpa || 0).toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Pass rate: {academicStats?.data?.passRate || 0}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tren Pendaftaran Santri</CardTitle>
                <CardDescription>Jumlah santri per bulan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={studentStats?.data?.trend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                        name="Santri"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pendapatan vs Pengeluaran</CardTitle>
                <CardDescription>Perbandingan keuangan bulanan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financeStats?.data?.monthlyTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={currencyFormatter} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#00C49F" name="Pendapatan" />
                      <Bar
                        dataKey="expense"
                        fill="#FF8042"
                        name="Pengeluaran"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tahfidz Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Progres Tahfidz</CardTitle>
              <CardDescription>Distribusi hafalan santri</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Rata-rata Juz</p>
                  <p className="text-3xl font-bold">
                    {tahfidzStats?.data?.averageJuz || 0}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Hafidz (30 Juz)
                  </p>
                  <p className="text-3xl font-bold">
                    {tahfidzStats?.data?.completedHafidz || 0}
                  </p>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tahfidzStats?.data?.byJuzRange || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="range"
                        label
                      >
                        {(tahfidzStats?.data?.byJuzRange || []).map(
                          (_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Santri</CardDescription>
                <CardTitle className="text-2xl">
                  {studentStats?.data?.totalStudents || 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Santri Aktif</CardDescription>
                <CardTitle className="text-2xl">
                  {studentStats?.data?.activeStudents || 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Baru Bulan Ini</CardDescription>
                <CardTitle className="text-2xl">
                  {studentStats?.data?.newStudentsThisMonth || 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Lulus Tahun Ini</CardDescription>
                <CardTitle className="text-2xl">
                  {studentStats?.data?.graduatedThisYear || 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Gender</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Laki-laki",
                            value: studentStats?.data?.byGender?.male || 0,
                          },
                          {
                            name: "Perempuan",
                            value: studentStats?.data?.byGender?.female || 0,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={pieLabelFormatter}
                      >
                        <Cell fill="#0088FE" />
                        <Cell fill="#FF8042" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Santri per Unit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={studentStats?.data?.byUnit || []}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="unitName" type="category" width={100} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#8884d8"
                        name="Jumlah Santri"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Santri per Kelas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kelas</TableHead>
                    <TableHead className="text-right">Jumlah Santri</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentStats?.data?.byClass?.map((item) => (
                    <TableRow key={item.classId}>
                      <TableCell>{item.className}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Hadir</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  {attendanceStats?.data?.presentRate || 0}%
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tidak Hadir</CardDescription>
                <CardTitle className="text-2xl text-red-600">
                  {attendanceStats?.data?.absentRate || 0}%
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Terlambat</CardDescription>
                <CardTitle className="text-2xl text-yellow-600">
                  {attendanceStats?.data?.lateRate || 0}%
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Sakit</CardDescription>
                <CardTitle className="text-2xl text-blue-600">
                  {attendanceStats?.data?.sickRate || 0}%
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Izin</CardDescription>
                <CardTitle className="text-2xl text-purple-600">
                  {attendanceStats?.data?.permittedRate || 0}%
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tren Kehadiran</CardTitle>
              <CardDescription>Grafik kehadiran harian</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceStats?.data?.trend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="present"
                      stackId="1"
                      stroke="#00C49F"
                      fill="#00C49F"
                      name="Hadir"
                    />
                    <Area
                      type="monotone"
                      dataKey="late"
                      stackId="1"
                      stroke="#FFBB28"
                      fill="#FFBB28"
                      name="Terlambat"
                    />
                    <Area
                      type="monotone"
                      dataKey="absent"
                      stackId="1"
                      stroke="#FF8042"
                      fill="#FF8042"
                      name="Tidak Hadir"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kehadiran per Kelas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kelas</TableHead>
                    <TableHead className="text-right">
                      Tingkat Kehadiran
                    </TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceStats?.data?.byClass?.map((item) => (
                    <TableRow key={item.classId}>
                      <TableCell>{item.className}</TableCell>
                      <TableCell className="text-right">
                        {item.presentRate}%
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            item.presentRate >= 90
                              ? "default"
                              : item.presentRate >= 80
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {item.presentRate >= 90
                            ? "Baik"
                            : item.presentRate >= 80
                              ? "Cukup"
                              : "Kurang"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Pendapatan</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  {formatCurrency(financeStats?.data?.totalRevenue || 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Pengeluaran</CardDescription>
                <CardTitle className="text-2xl text-red-600">
                  {formatCurrency(financeStats?.data?.totalExpense || 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pendapatan Bersih</CardDescription>
                <CardTitle className="text-2xl">
                  {formatCurrency(financeStats?.data?.netIncome || 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tagihan Belum Lunas</CardDescription>
                <CardTitle className="text-2xl text-orange-600">
                  {formatCurrency(financeStats?.data?.outstandingBills || 0)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pendapatan per Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={financeStats?.data?.revenueByCategory || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="amount"
                        nameKey="category"
                        label={categoryLabelFormatter}
                      >
                        {(financeStats?.data?.revenueByCategory || []).map(
                          (_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip formatter={currencyFormatter} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pengeluaran per Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={financeStats?.data?.expenseByCategory || []}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={currencyFormatter} />
                      <YAxis dataKey="category" type="category" width={100} />
                      <Tooltip formatter={currencyFormatter} />
                      <Bar dataKey="amount" fill="#FF8042" name="Pengeluaran" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tren Keuangan Bulanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financeStats?.data?.monthlyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={currencyFormatter} />
                    <Tooltip formatter={currencyFormatter} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#00C49F"
                      fill="#00C49F"
                      fillOpacity={0.3}
                      name="Pendapatan"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#FF8042"
                      fill="#FF8042"
                      fillOpacity={0.3}
                      name="Pengeluaran"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rata-rata IPK</CardDescription>
                <CardTitle className="text-2xl">
                  {(academicStats?.data?.averageGpa || 0).toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tingkat Kelulusan</CardDescription>
                <CardTitle className="text-2xl">
                  {academicStats?.data?.passRate || 0}%
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Top Performers</CardDescription>
                <CardTitle className="text-2xl">
                  {academicStats?.data?.topPerformers?.length || 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Nilai</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={academicStats?.data?.gradeDistribution || []}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grade" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" name="Jumlah Santri">
                        {(academicStats?.data?.gradeDistribution || []).map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.grade === "A"
                                  ? "#00C49F"
                                  : entry.grade === "B"
                                    ? "#0088FE"
                                    : entry.grade === "C"
                                      ? "#FFBB28"
                                      : entry.grade === "D"
                                        ? "#FF8042"
                                        : "#FF4444"
                              }
                            />
                          ),
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tren IPK per Semester</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={academicStats?.data?.trend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="semester" />
                      <YAxis domain={[0, 4]} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="averageGpa"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                        name="Rata-rata IPK"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performa per Mata Pelajaran</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead className="text-right">Rata-rata</TableHead>
                      <TableHead className="text-right">Pass Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicStats?.data?.bySubject?.map((item) => (
                      <TableRow key={item.subjectId}>
                        <TableCell>{item.subjectName}</TableCell>
                        <TableCell className="text-right">
                          {item.averageScore.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              item.passRate >= 80 ? "default" : "secondary"
                            }
                          >
                            {item.passRate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead className="text-right">IPK</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicStats?.data?.topPerformers
                      ?.slice(0, 10)
                      .map((student) => (
                        <TableRow key={student.studentId}>
                          <TableCell className="font-medium">
                            {student.studentName}
                          </TableCell>
                          <TableCell>{student.className}</TableCell>
                          <TableCell className="text-right">
                            <Badge>{student.gpa.toFixed(2)}</Badge>
                          </TableCell>
                        </TableRow>
                      )) || (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AnalyticsPageWithShell() {
  return (
    <MainLayout>
      <AnalyticsPageContent />
    </MainLayout>
  );
}
