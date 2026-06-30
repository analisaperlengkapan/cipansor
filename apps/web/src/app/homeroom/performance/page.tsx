"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Star,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { useHomeroomPerformanceAnalytics } from "@/hooks/use-analytics";

const METRIC_LABELS: Record<string, string> = {
  dailyReportCompletion: "Laporan Harian",
  attendanceAccuracy: "Kehadiran",
  parentEngagement: "Komunikasi Ortu",
  tahfidzProgress: "Progress Tahfidz",
  behaviorManagement: "Pengelolaan Perilaku",
  administrativeTask: "Administrasi",
};

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-green-600";
  if (score >= 80) return "text-blue-600";
  if (score >= 70) return "text-yellow-600";
  return "text-red-600";
};

export default function HomeroomPerformancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState("semester");
  const { data, isLoading } = useHomeroomPerformanceAnalytics();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null,
  );

  if (isLoading) {
    return (
      <MainLayout allowedRoles={["SUPER_ADMIN", "UNIT_ADMIN"]}>
        <div className="space-y-6">
          <PageHeader
            title="Performa Wali Kelas"
            description="Evaluasi kinerja wali kelas berdasarkan multiple metrics"
          />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  const performanceData = data?.data;
  if (!performanceData) return null;

  const teachers = performanceData.teachers;
  const currentTeacher =
    teachers.find((t) => t.id === (selectedTeacherId || teachers[0]?.id)) ||
    teachers[0];

  if (!currentTeacher) return null;

  // Radar chart data
  const radarData = Object.entries(currentTeacher.metrics).map(
    ([key, value]) => ({
      metric: METRIC_LABELS[key] || key,
      value,
      fullMark: 100,
    }),
  );

  // Average scores
  const avgScore = Math.round(
    teachers.reduce((sum, t) => sum + t.overallScore, 0) / teachers.length,
  );

  return (
    <MainLayout allowedRoles={["SUPER_ADMIN", "UNIT_ADMIN"]}>
      <div className="space-y-6">
        <PageHeader
          title="Performa Wali Kelas"
          description="Evaluasi kinerja wali kelas berdasarkan multiple metrics"
          actions={
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Bulan Ini</SelectItem>
                <SelectItem value="semester">Semester Ini</SelectItem>
                <SelectItem value="year">Tahun Ini</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Wali Kelas
                  </p>
                  <p className="text-2xl font-bold">{teachers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Skor Rata-rata
                  </p>
                  <p className="text-2xl font-bold">{avgScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Performa Terbaik
                  </p>
                  <p className="text-2xl font-bold">
                    {teachers.filter((t) => t.overallScore >= 90).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Perlu Perhatian
                  </p>
                  <p className="text-2xl font-bold">
                    {teachers.filter((t) => t.overallScore < 80).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teacher Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {teachers.map((teacher) => (
            <Card
              key={teacher.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg",
                (selectedTeacherId || teachers[0].id) === teacher.id &&
                  "ring-2 ring-primary",
              )}
              onClick={() => setSelectedTeacherId(teacher.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold">{teacher.teacherName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {teacher.className} • {teacher.studentCount} siswa
                    </p>
                  </div>
                  <div
                    className={cn(
                      "text-3xl font-bold",
                      getScoreColor(teacher.overallScore),
                    )}
                  >
                    {teacher.overallScore}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {teacher.trend === "up" ? (
                    <Badge className="bg-green-100 text-green-700">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Meningkat
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Menurun
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detail Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{currentTeacher.teacherName}</CardTitle>
              <CardDescription>Detail performa per kategori</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Skor"
                      dataKey="value"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.5}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tren Performa</CardTitle>
              <CardDescription>
                Perkembangan skor 6 bulan terakhir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentTeacher.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar
                      dataKey="score"
                      name="Skor"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metric Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>
              Breakdown Metrik - {currentTeacher.teacherName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(currentTeacher.metrics).map(([key, value]) => (
                <div key={key} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {METRIC_LABELS[key]}
                    </span>
                    <span className={cn("font-bold", getScoreColor(value))}>
                      {value}%
                    </span>
                  </div>
                  <Progress value={value} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
