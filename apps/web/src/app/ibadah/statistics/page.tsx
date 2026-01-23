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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Star,
  Sun,
  Moon,
  BookOpen,
  Heart,
  Users,
  Building,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Mock statistics data
const weeklyData = [
  { day: "Sen", sholat: 95, sunnah: 70, tilawah: 85 },
  { day: "Sel", sholat: 100, sunnah: 65, tilawah: 90 },
  { day: "Rab", sholat: 90, sunnah: 80, tilawah: 75 },
  { day: "Kam", sholat: 100, sunnah: 75, tilawah: 80 },
  { day: "Jum", sholat: 100, sunnah: 85, tilawah: 95 },
  { day: "Sab", sholat: 85, sunnah: 60, tilawah: 70 },
  { day: "Min", sholat: 80, sunnah: 50, tilawah: 65 },
];

const sholatDistribution = [
  { name: "Subuh", value: 85, color: "#22c55e" },
  { name: "Dzuhur", value: 95, color: "#f59e0b" },
  { name: "Ashar", value: 92, color: "#f97316" },
  { name: "Maghrib", value: 98, color: "#ef4444" },
  { name: "Isya", value: 96, color: "#6366f1" },
];

const monthlyTrend = [
  { week: "Minggu 1", score: 75 },
  { week: "Minggu 2", score: 82 },
  { week: "Minggu 3", score: 78 },
  { week: "Minggu 4", score: 88 },
];

const summaryStats = {
  totalDays: 30,
  activeDays: 28,
  averageScore: 85,
  streak: 14,
  bestStreak: 21,
  sholatWajib: 93,
  sholatSunnah: 68,
  tilawah: 82,
  dzikir: 75,
};

export default function IbadahStatisticsPage() {
  const [period, setPeriod] = useState("month");
  const [viewType, setViewType] = useState("personal");

  return (
    <MainLayout
      allowedRoles={[
        "STUDENT",
        "TEACHER",
        "SUPER_ADMIN",
        "UNIT_ADMIN",
        "PARENT",
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Statistik Ibadah"
          description="Analisis perkembangan ibadah harian"
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Minggu Ini</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
              <SelectItem value="semester">Semester</SelectItem>
              <SelectItem value="year">Tahun Ini</SelectItem>
            </SelectContent>
          </Select>

          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Personal
                </div>
              </SelectItem>
              <SelectItem value="class">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Kelas
                </div>
              </SelectItem>
              <SelectItem value="unit">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Unit
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hari Aktif</p>
                  <p className="text-2xl font-bold">
                    {summaryStats.activeDays}/{summaryStats.totalDays}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Skor Rata-rata
                  </p>
                  <p className="text-2xl font-bold">
                    {summaryStats.averageScore}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Streak Saat Ini
                  </p>
                  <p className="text-2xl font-bold">
                    {summaryStats.streak} hari
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Streak Terbaik
                  </p>
                  <p className="text-2xl font-bold">
                    {summaryStats.bestStreak} hari
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Perkembangan Mingguan</CardTitle>
              <CardDescription>Persentase ibadah per hari</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sholat" name="Sholat Wajib" fill="#22c55e" />
                    <Bar dataKey="sunnah" name="Sholat Sunnah" fill="#f59e0b" />
                    <Bar dataKey="tilawah" name="Tilawah" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Sholat Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Sholat 5 Waktu</CardTitle>
              <CardDescription>Persentase kehadiran per waktu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sholatDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {sholatDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Breakdown Kategori Ibadah</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              {
                label: "Sholat Wajib",
                value: summaryStats.sholatWajib,
                icon: Sun,
                color: "bg-green-500",
              },
              {
                label: "Sholat Sunnah",
                value: summaryStats.sholatSunnah,
                icon: Moon,
                color: "bg-amber-500",
              },
              {
                label: "Tilawah Al-Quran",
                value: summaryStats.tilawah,
                icon: BookOpen,
                color: "bg-blue-500",
              },
              {
                label: "Dzikir Pagi/Petang",
                value: summaryStats.dzikir,
                icon: Heart,
                color: "bg-purple-500",
              },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className="font-bold">{item.value}%</span>
                </div>
                <Progress
                  value={item.value}
                  className={`h-3 [&>div]:${item.color}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
