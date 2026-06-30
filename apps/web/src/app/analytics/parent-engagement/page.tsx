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
  Eye,
  Heart,
  TrendingUp,
  TrendingDown,
  Clock,
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
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { useParentEngagementAnalytics } from "@/hooks/use-analytics";

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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
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

  const engagementData = data?.data;

  if (!engagementData) return null;

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
                    {engagementData.summary.activeParents}/
                    {engagementData.summary.totalParents}
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
                      {engagementData.summary.engagementRate}%
                    </p>
                    <Badge className="bg-green-100 text-green-700">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {engagementData.summary.monthlyTrend}
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
                    {engagementData.summary.avgResponseTime} jam
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
                    {engagementData.metrics.reportViews.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(engagementData.metrics).map(([key, metric]) => (
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
                  <BarChart data={engagementData.weeklyActivity}>
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
              {engagementData.classBreakdown.map((item) => (
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
              {engagementData.lowEngagement.map((parent, index) => (
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
