"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components/shared";
import { useParentEngagementAnalytics } from "@/hooks/use-analytics";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Users,
  MessageSquare,
  Eye,
  Heart,
  TrendingUp,
  TrendingDown,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
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
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// Mock parent engagement data
const mockEngagementData = {
  summary: {
    totalParents: 450,
    activeParents: 380,
    engagementRate: 84.4,
    avgResponseTime: 2.5, // hours
    monthlyTrend: "+5.2%",
  },
  metrics: {
    portalLogins: { value: 1250, change: 12, label: "Login Portal" },
    reportViews: { value: 3420, change: 8, label: "Lihat Laporan" },
    billPayments: { value: 156, change: -3, label: "Pembayaran" },
    messageSent: { value: 89, change: 15, label: "Pesan Guru" },
  },
  weeklyActivity: [
    { day: "Sen", logins: 185, reports: 420, messages: 12 },
    { day: "Sel", logins: 210, reports: 380, messages: 18 },
    { day: "Rab", logins: 195, reports: 350, messages: 15 },
    { day: "Kam", logins: 220, reports: 410, messages: 22 },
    { day: "Jum", logins: 180, reports: 480, messages: 8 },
    { day: "Sab", logins: 150, reports: 580, messages: 5 },
    { day: "Min", logins: 110, reports: 800, messages: 9 },
  ],
  classBreakdown: [
    { class: "VII A", engagement: 92, parents: 32 },
    { class: "VII B", engagement: 88, parents: 30 },
    { class: "VIII A", engagement: 85, parents: 28 },
    { class: "VIII B", engagement: 80, parents: 29 },
    { class: "IX A", engagement: 78, parents: 27 },
    { class: "IX B", engagement: 75, parents: 26 },
  ],
  lowEngagement: [
    {
      parentName: "Bapak Ahmad",
      childName: "Muhammad Hasan",
      lastLogin: "14 hari lalu",
      reason: "Tidak pernah login",
    },
    {
      parentName: "Ibu Fatimah",
      childName: "Aisyah Putri",
      lastLogin: "21 hari lalu",
      reason: "Tidak respon pesan",
    },
    {
      parentName: "Bapak Umar",
      childName: "Ibrahim Malik",
      lastLogin: "30 hari lalu",
      reason: "Belum bayar 3 bulan",
    },
  ],
};

export default function ParentEngagementPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const { data, isLoading } = useParentEngagementAnalytics();

  if (isLoading) {
    return (
      <MainLayout allowedRoles={["SUPER_ADMIN", "UNIT_ADMIN"]}>
        <div className="space-y-6">
          <PageHeader
            title="Metrik Engagement Orang Tua"
            description="Analisis keterlibatan orang tua dalam sistem"
          />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!data) return null;

  return (
    <MainLayout allowedRoles={["SUPER_ADMIN", "UNIT_ADMIN"]}>
      <div className="space-y-6">
        <PageHeader
          title="Metrik Engagement Orang Tua"
          description="Analisis keterlibatan orang tua dalam sistem"
          actions={
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Minggu Ini</SelectItem>
                <SelectItem value="month">Bulan Ini</SelectItem>
                <SelectItem value="semester">Semester Ini</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Orang Tua Aktif
                  </p>
                  <p className="text-2xl font-bold">
                    {data.summary.activeParents}/{data.summary.totalParents}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Heart className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Engagement Rate
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">
                      {data.summary.engagementRate}%
                    </p>
                    <Badge className="bg-green-100 text-green-700">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {data.summary.monthlyTrend}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Rata-rata Respon
                  </p>
                  <p className="text-2xl font-bold">
                    {data.summary.avgResponseTime} jam
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Eye className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lihat Laporan</p>
                  <p className="text-2xl font-bold">
                    {data.metrics.reportViews.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(data.metrics).map(([key, metric]) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className="text-xl font-bold">
                      {metric.value.toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant={metric.change >= 0 ? "default" : "destructive"}
                    className="h-6"
                  >
                    {metric.change >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(metric.change)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Mingguan</CardTitle>
              <CardDescription>
                Login, lihat laporan, dan pesan per hari
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="logins" name="Login" fill="#6366f1" />
                    <Bar
                      dataKey="reports"
                      name="Lihat Laporan"
                      fill="#22c55e"
                    />
                    <Bar dataKey="messages" name="Pesan" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Class Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement per Kelas</CardTitle>
              <CardDescription>
                Persentase keterlibatan orang tua
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.classBreakdown.map((item) => (
                <div key={item.class} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.class}</span>
                    <span
                      className={cn(
                        "font-bold",
                        item.engagement >= 85
                          ? "text-green-600"
                          : item.engagement >= 75
                            ? "text-amber-600"
                            : "text-red-600",
                      )}
                    >
                      {item.engagement}%
                    </span>
                  </div>
                  <Progress value={item.engagement} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Low Engagement Alert */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              Perlu Perhatian
            </CardTitle>
            <CardDescription>
              Orang tua dengan engagement rendah perlu di-follow up
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.lowEngagement.map((parent, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{parent.parentName}</p>
                    <p className="text-sm text-muted-foreground">
                      Anak: {parent.childName} • {parent.lastLogin}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-amber-700">
                    {parent.reason}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
