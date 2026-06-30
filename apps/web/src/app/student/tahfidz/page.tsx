"use client";

import { useAuth } from "@/hooks/use-auth";
import { useStudentTahfidzProgress, TAHFIDZ_TYPES } from "@/hooks/use-tahfidz";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
  ChevronRight,
  Target,
  Sparkles,
  Info
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function StudentTahfidzPage() {
  const { user } = useAuth();
  const studentId = user?.student?.id || "current";

  const { data, isLoading } = useStudentTahfidzProgress(studentId);

  if (isLoading) return <TahfidzSkeleton />;

  const summary = data?.summary || {
    totalAyahMemorized: 0,
    juzCoveredCount: 0,
    averageScore: 0
  };

  const estimation = data?.estimation || {
    status: 'INSUFFICIENT_DATA',
    estimatedDate: null,
    remainingAyah: 6236 - summary.totalAyahMemorized
  };

  const recentRecords = data?.recentRecords || [];

  return (
    <MainLayout>
      <PageHeader
        title="Progres Tahfidz Saya"
        description="Pantau hafalan Al-Qur'an dan estimasi khatam"
      />

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Total Hafalan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.juzCoveredCount} Juz</div>
            <p className="text-xs text-muted-foreground mt-1">{summary.totalAyahMemorized} Ayat tersimpan</p>
            <Progress value={(summary.totalAyahMemorized / 6236) * 100} className="h-1.5 mt-4" />
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-800">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Estimasi Khatam 30 Juz
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estimation.status === 'ON_TRACK' ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-2xl font-bold text-emerald-900">
                    {format(new Date(estimation.estimatedDate), "d MMMM yyyy", { locale: localeId })}
                  </div>
                  <p className="text-xs text-emerald-700 mt-1">
                    Berdasarkan rata-rata {estimation.avgPerSetoran} ayat per setoran
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    {estimation.estimatedDays} Hari Lagi
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-emerald-800">
                <Info className="h-5 w-5 opacity-50" />
                <p className="text-sm">
                  {estimation.status === 'INSUFFICIENT_DATA'
                    ? "Butuh minimal 3 setoran ziyadah terakhir untuk menghitung estimasi khatam."
                    : "Luar biasa! Kamu sudah menyelesaikan 30 Juz."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Setoran Terakhir</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentRecords.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground italic">Belum ada rekaman hafalan.</div>
                ) : (
                  recentRecords.map((record: any) => (
                    <div key={record.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{record.surahName}</p>
                          <p className="text-xs text-muted-foreground">
                            Ayat {record.ayahStart}-{record.ayahEnd} • Juz {record.juz}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-1">
                          {TAHFIDZ_TYPES.find(t => t.value === record.activityType)?.label || record.activityType}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(record.recordedAt), "d MMM yyyy")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Capaian Per Juz</CardTitle>
              <CardDescription>Juz yang sudah pernah disetorkan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 30 }, (_, i) => i + 1).map(juz => {
                  const isCompleted = data?.juzCovered?.includes(juz);
                  return (
                    <div
                      key={juz}
                      className={cn(
                        "h-10 w-full rounded flex items-center justify-center text-xs font-bold border transition-all",
                        isCompleted
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted/30 text-muted-foreground border-transparent"
                      )}
                    >
                      {juz}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-800">
                <Target className="h-4 w-4" />
                Tips Istiqomah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-amber-700 leading-relaxed italic">
                "Sebaik-baik amalan adalah yang dikerjakan secara terus-menerus (istiqomah) walaupun sedikit." (HR. Muslim)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

function TahfidzSkeleton() {
  return (
    <MainLayout>
      <PageHeader title="Memuat Progres..." description="Menyiapkan data hafalan terbaikmu" />
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full md:col-span-2" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-96 w-full md:col-span-2" />
        <Skeleton className="h-96 w-full" />
      </div>
    </MainLayout>
  );
}
