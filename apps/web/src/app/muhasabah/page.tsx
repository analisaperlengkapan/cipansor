"use client";

import { useState } from "react";
import Link from "next/link";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Plus,
  Calendar,
  BarChart3,
  Flame,
  BookOpen,
  Moon,
  Sun,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  useMuhasabahRecords,
  useMyMuhasabahStats,
  MUHASABAH_MOODS,
  SHOLAT_WAJIB,
  calculateSholatCompletion,
} from "@/hooks/use-muhasabah";
import { cn } from "@/lib/utils";

export default function MuhasabahPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get week dates
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: recordsData, isLoading: recordsLoading } = useMuhasabahRecords({
    startDate: format(weekStart, "yyyy-MM-dd"),
    endDate: format(weekEnd, "yyyy-MM-dd"),
    limit: 7,
  });

  const { data: stats, isLoading: statsLoading } = useMyMuhasabahStats();

  const records = recordsData?.data || [];

  const getRecordForDate = (date: Date) => {
    return records.find((r) => isSameDay(new Date(r.date), date));
  };

  const getMoodConfig = (mood: string) => {
    return MUHASABAH_MOODS.find((m) => m.value === mood);
  };

  return (
    <MainLayout>
      <PageHeader
        title="Muhasabah Harian"
        description="Evaluasi dan introspeksi ibadah harian"
        action={{
          label: "Isi Muhasabah",
          icon: <Plus className="h-4 w-4" />,
          href: "/muhasabah/new",
        }}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">
                Streak Saat Ini
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {statsLoading ? "-" : `${stats?.currentStreak || 0} Hari`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">
                Streak Terpanjang
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {statsLoading ? "-" : `${stats?.longestStreak || 0} Hari`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Rata-rata Sholat
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {statsLoading ? "-" : `${stats?.averageSholatCompletion || 0}%`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">
                Rata-rata Tilawah
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {statsLoading ? "-" : `${stats?.averageTilawahPages || 0} Hal`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Week Calendar */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Minggu Ini
              </CardTitle>
              <CardDescription>
                {format(weekStart, "d MMM", { locale: localeId })} -{" "}
                {format(weekEnd, "d MMM yyyy", { locale: localeId })}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelectedDate((d) => new Date(d.setDate(d.getDate() - 7)))
                }
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Hari Ini
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelectedDate((d) => new Date(d.setDate(d.getDate() + 7)))
                }
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const record = getRecordForDate(day);
              const moodConfig = record ? getMoodConfig(record.mood) : null;
              const sholatCompletion = record
                ? calculateSholatCompletion(record)
                : 0;
              const hasRecord = !!record;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-3 rounded-lg text-center transition-colors",
                    isToday(day) && "ring-2 ring-primary",
                    hasRecord
                      ? "bg-green-50 dark:bg-green-950"
                      : "bg-gray-50 dark:bg-gray-900",
                  )}
                >
                  <p className="text-xs text-muted-foreground uppercase">
                    {format(day, "EEE", { locale: localeId })}
                  </p>
                  <p className="text-lg font-bold">{format(day, "d")}</p>

                  {hasRecord ? (
                    <div className="mt-2">
                      <span className="text-2xl">{moodConfig?.emoji}</span>
                      <Progress value={sholatCompletion} className="h-1 mt-1" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {sholatCompletion}% Sholat
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <XCircle className="h-6 w-6 mx-auto text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Belum isi
                      </p>
                    </div>
                  )}

                  {!hasRecord && !day.getTime ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full"
                      asChild
                    >
                      <Link
                        href={`/muhasabah/new?date=${format(day, "yyyy-MM-dd")}`}
                      >
                        Isi
                      </Link>
                    </Button>
                  ) : hasRecord ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full"
                      asChild
                    >
                      <Link href={`/muhasabah/${record.id}`}>Detail</Link>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full"
                      asChild
                    >
                      <Link
                        href={`/muhasabah/new?date=${format(day, "yyyy-MM-dd")}`}
                      >
                        Isi
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today's Quick View */}
      {records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Minggu Ini</CardTitle>
            <CardDescription>Catatan muhasabah terbaru</CardDescription>
          </CardHeader>
          <CardContent>
            {recordsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => {
                  const moodConfig = getMoodConfig(record.mood);
                  const sholatCompletion = calculateSholatCompletion(record);

                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(record.date), "EEE", {
                              locale: localeId,
                            })}
                          </p>
                          <p className="text-lg font-bold">
                            {format(new Date(record.date), "d")}
                          </p>
                        </div>
                        <div className="text-3xl">{moodConfig?.emoji}</div>
                        <div>
                          <p className="font-medium">{moodConfig?.label}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Moon className="h-3 w-3" />
                              {sholatCompletion}% Sholat
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {record.tilawahPages} Hal Tilawah
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                          {SHOLAT_WAJIB.map((sholat) => (
                            <div
                              key={sholat.key}
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                                record[sholat.key as keyof typeof record]
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800",
                              )}
                              title={sholat.label}
                            >
                              {record[sholat.key as keyof typeof record] ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </div>
                          ))}
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/muhasabah/${record.id}`}>Detail</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!recordsLoading && records.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Sun className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Catatan</h3>
            <p className="text-muted-foreground mb-4">
              Mulai catat muhasabah harian Anda untuk melacak ibadah dan
              perkembangan spiritual
            </p>
            <Button asChild>
              <Link href="/muhasabah/new">
                <Plus className="h-4 w-4 mr-2" />
                Isi Muhasabah Hari Ini
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
}
