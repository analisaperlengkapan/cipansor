"use client";

import { useState } from "react";
import { safeFormat } from "@/lib/date";
import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components/shared";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeDashboard } from "@/hooks/use-realtime-dashboard";
import {
  useExecutiveDashboard,
  type ExecutiveAlert,
  type AttendanceByUnit,
  type EnrollmentTrend,
} from "@/hooks/use-executive-dashboard";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Bell,
  RefreshCw,
  Download,
  Banknote,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Fallback mock data when API returns empty
const fallbackEnrollmentTrend: EnrollmentTrend[] = [
  {
    month: "Jul",
    year: 2025,
    TK: 120,
    SDIT: 250,
    SMPIT: 180,
    SMAQ: 95,
    Pesantren: 65,
    total: 710,
  },
  {
    month: "Agt",
    year: 2025,
    TK: 125,
    SDIT: 255,
    SMPIT: 185,
    SMAQ: 98,
    Pesantren: 68,
    total: 731,
  },
  {
    month: "Sep",
    year: 2025,
    TK: 130,
    SDIT: 260,
    SMPIT: 188,
    SMAQ: 100,
    Pesantren: 70,
    total: 748,
  },
  {
    month: "Okt",
    year: 2025,
    TK: 135,
    SDIT: 265,
    SMPIT: 192,
    SMAQ: 102,
    Pesantren: 72,
    total: 766,
  },
  {
    month: "Nov",
    year: 2025,
    TK: 138,
    SDIT: 268,
    SMPIT: 195,
    SMAQ: 105,
    Pesantren: 75,
    total: 781,
  },
  {
    month: "Des",
    year: 2025,
    TK: 142,
    SDIT: 272,
    SMPIT: 198,
    SMAQ: 108,
    Pesantren: 78,
    total: 798,
  },
];

const fallbackAttendanceByUnit: AttendanceByUnit[] = [
  {
    unit: "TK",
    unitId: "tk-1",
    rate: 92,
    present: 131,
    absent: 8,
    sick: 2,
    excused: 1,
    total: 142,
    color: "#22c55e",
  },
  {
    unit: "SDIT",
    unitId: "sdit-1",
    rate: 88,
    present: 239,
    absent: 20,
    sick: 8,
    excused: 5,
    total: 272,
    color: "#3b82f6",
  },
  {
    unit: "SMPIT",
    unitId: "smpit-1",
    rate: 85,
    present: 168,
    absent: 18,
    sick: 7,
    excused: 5,
    total: 198,
    color: "#f59e0b",
  },
  {
    unit: "SMAQ",
    unitId: "smaq-1",
    rate: 90,
    present: 97,
    absent: 6,
    sick: 3,
    excused: 2,
    total: 108,
    color: "#8b5cf6",
  },
  {
    unit: "Pesantren",
    unitId: "pesantren-1",
    rate: 94,
    present: 73,
    absent: 3,
    sick: 1,
    excused: 1,
    total: 78,
    color: "#ec4899",
  },
];

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  activeCount?: number;
  trend?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

function KPICard({
  title,
  value,
  subtitle,
  activeCount,
  trend,
  icon: Icon,
  iconColor,
  iconBg,
}: KPICardProps) {
  return (
    <Card className="glass-card overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 group">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div
          className={cn(
            "p-2 rounded-xl transition-all group-hover:scale-110",
            iconBg,
          )}
        >
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {(activeCount !== undefined || trend) && (
          <div className="flex items-center gap-2 mt-2">
            {activeCount !== undefined && (
              <Badge
                variant="secondary"
                className="text-[10px] font-bold px-1.5 py-0 bg-secondary/50"
              >
                {activeCount} AKTIF
              </Badge>
            )}
            {trend && (
              <span className="text-xs text-green-600 font-bold flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </span>
            )}
          </div>
        )}
        {subtitle && (
          <p className="text-xs font-medium text-muted-foreground mt-2 opacity-80">
            {subtitle}
          </p>
        )}
      </CardContent>
      <div
        className={cn(
          "h-1 w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-10",
          iconColor,
        )}
      />
    </Card>
  );
}

export default function ExecutiveDashboardPage() {
  // Fetch all executive dashboard data
  const {
    stats,
    attendanceByUnit,
    enrollmentTrends,
    financeSummary,
    tahfidzSummary,
    alerts,
    isLoading,
    refetchAll,
  } = useExecutiveDashboard();

  // Initialize WebSocket connection for real-time updates
  const { isConnected, lastUpdate, reconnect } = useRealtimeDashboard({
    enabled: true,
    unitIds: ["all"],
    metrics: ["students", "attendance", "tahfidz", "academic"],
    onMetricsUpdate: (data) => {
      console.log("Metrics updated:", data);
      // Refetch data on websocket update
      refetchAll();
    },
    onAlert: (alert: any) => {
      console.log("New alert:", alert);
      toast.info(alert.message);
    },
  });

  // Use real data or fallback
  const displayEnrollmentTrend = enrollmentTrends?.length
    ? enrollmentTrends
    : fallbackEnrollmentTrend;
  const displayAttendanceByUnit = attendanceByUnit?.length
    ? attendanceByUnit
    : fallbackAttendanceByUnit;
  const displayAlerts = alerts || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
              title="Dashboard Eksekutif Yayasan"
              description="Monitoring real-time seluruh unit pendidikan"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500 animate-pulse" : "bg-red-500",
                )}
              />
              <span className="text-sm text-muted-foreground">
                {isConnected ? "Terhubung" : "Terputus"}
              </span>
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  • Update {format(lastUpdate, "HH:mm:ss")}
                </span>
              )}
              {!isConnected && (
                <Button variant="ghost" size="sm" onClick={reconnect}>
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Alerts Panel */}
        {displayAlerts.length > 0 && (
          <Card className="border-orange-200 bg-orange-50/50 glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Bell className="h-4 w-4 text-orange-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold">
                    Notifikasi & Alert
                  </CardTitle>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                >
                  {displayAlerts.length} Baru
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {displayAlerts.slice(0, 3).map((alert, idx) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-orange-100/50 transition-all hover:shadow-md",
                      "animate-in slide-in-from-right duration-300",
                      idx === 1 && "delay-75",
                      idx === 2 && "delay-150",
                    )}
                  >
                    <div
                      className={cn(
                        "p-1.5 rounded-full mt-0.5",
                        alert.type === "CRITICAL" && "bg-red-100 text-red-600",
                        alert.type === "WARNING" &&
                          "bg-orange-100 text-orange-600",
                        alert.type === "INFO" && "bg-blue-100 text-blue-600",
                      )}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-normal">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 font-medium opacity-70">
                        {safeFormat(new Date(alert.timestamp), "HH:mm", {
                          locale: idLocale,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <KPICard
                title="Total Siswa"
                value={stats?.totalStudents || 0}
                activeCount={stats?.activeStudents || 0}
                trend={
                  stats?.studentsGrowth
                    ? `${stats.studentsGrowth > 0 ? "+" : ""}${stats.studentsGrowth}%`
                    : undefined
                }
                icon={Users}
                iconColor="text-blue-600"
                iconBg="bg-blue-100"
              />
              <KPICard
                title="Total Guru"
                value={stats?.totalTeachers || 0}
                activeCount={stats?.totalStaff || 0}
                icon={GraduationCap}
                iconColor="text-green-600"
                iconBg="bg-green-100"
              />
              <KPICard
                title="Kehadiran"
                value={`${stats?.overallAttendanceRate || 0}%`}
                subtitle={`${stats?.totalClasses || 0} kelas aktif`}
                icon={UserCheck}
                iconColor="text-orange-600"
                iconBg="bg-orange-100"
              />
              <KPICard
                title="Tahfidz Progress"
                value={tahfidzSummary?.totalHafidz || 0}
                subtitle={`Avg: ${tahfidzSummary?.averageJuz?.toFixed(1) || 0} Juz`}
                icon={BookOpen}
                iconColor="text-purple-600"
                iconBg="bg-purple-100"
              />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Enrollment Trend */}
          <Card className="col-span-2 glass-card border-none shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold leading-none">
                  Tren Pendaftaran Siswa
                </CardTitle>
                <CardDescription className="mt-1.5">
                  Jumlah siswa aktif per unit dalam 6 bulan terakhir
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8">
                  6 Bulan
                </Button>
                <Button variant="outline" size="sm" className="h-8">
                  1 Tahun
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={displayEnrollmentTrend}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorTK" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#22c55e"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#22c55e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorSDIT"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="oklch(var(--border))"
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "oklch(var(--muted-foreground))",
                        fontSize: 12,
                      }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "oklch(var(--muted-foreground))",
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(var(--background))",
                        border: "1px solid oklch(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                      itemStyle={{ fontSize: "12px", fontWeight: "600" }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area
                      type="monotone"
                      dataKey="TK"
                      stackId="1"
                      stroke="#22c55e"
                      strokeWidth={3}
                      fill="url(#colorTK)"
                    />
                    <Area
                      type="monotone"
                      dataKey="SDIT"
                      stackId="1"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="url(#colorSDIT)"
                    />
                    <Area
                      type="monotone"
                      dataKey="SMPIT"
                      stackId="1"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      fillOpacity={0.1}
                      fill="#f59e0b"
                    />
                    <Area
                      type="monotone"
                      dataKey="SMAQ"
                      stackId="1"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fillOpacity={0.1}
                      fill="#8b5cf6"
                    />
                    <Area
                      type="monotone"
                      dataKey="Pesantren"
                      stackId="1"
                      stroke="#ec4899"
                      strokeWidth={3}
                      fillOpacity={0.1}
                      fill="#ec4899"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Attendance by Unit */}
          <Card className="glass-card border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                Kehadiran per Unit
              </CardTitle>
              <CardDescription>Tingkat kehadiran hari ini (%)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={displayAttendanceByUnit}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="oklch(var(--border))"
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="unit"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "oklch(var(--muted-foreground))",
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                      hide
                    />
                    <Tooltip
                      cursor={{ fill: "oklch(var(--muted))", opacity: 0.4 }}
                    />
                    <Bar
                      dataKey="rate"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                      name="Kehadiran"
                    >
                      {displayAttendanceByUnit.map((entry, index) => (
                        <Bar key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Unit Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Perbandingan Unit</CardTitle>
              <CardDescription>Kehadiran dan siswa aktif</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayAttendanceByUnit.map((unit) => (
                  <div key={unit.unit} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: unit.color }}
                        />
                        <span className="font-medium">{unit.unit}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">
                          {unit.present}/{unit.total}
                        </span>
                        <Badge
                          variant={unit.rate >= 90 ? "default" : "secondary"}
                          className="min-w-[60px] justify-center"
                        >
                          {unit.rate}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${unit.rate}%`,
                          backgroundColor: unit.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Finance Summary */}
        {financeSummary && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <CardTitle>Ringkasan Keuangan</CardTitle>
                </div>
                <Badge
                  variant={
                    financeSummary.collectionRate >= 80
                      ? "default"
                      : "secondary"
                  }
                >
                  Collection Rate: {financeSummary.collectionRate}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Tagihan</p>
                  <p className="text-xl font-bold text-blue-600">
                    Rp {(financeSummary.totalBilled / 1000000).toFixed(1)} Jt
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Total Terbayar
                  </p>
                  <p className="text-xl font-bold text-green-600">
                    Rp {(financeSummary.totalPaid / 1000000).toFixed(1)} Jt
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Tunggakan</p>
                  <p className="text-xl font-bold text-red-600">
                    Rp {(financeSummary.totalUnpaid / 1000000).toFixed(1)} Jt
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Real-time Activity Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <CardTitle>Aktivitas Real-time</CardTitle>
              </div>
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              Streaming aktivitas akan muncul di sini...
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
