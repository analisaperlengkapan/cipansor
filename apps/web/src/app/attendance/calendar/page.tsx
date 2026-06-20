"use client";

import { useState, useMemo } from "react";
import { safeFormat } from "@/lib/date";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getDay,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Users,
  TrendingUp,
  ArrowLeft,
  Info,
} from "lucide-react";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { useClasses } from "@/hooks/use-classes";
import { useUnits } from "@/hooks/use-units";
import {
  useAttendanceCalendar,
  ATTENDANCE_STATUSES,
  AttendanceStatus,
} from "@/hooks/use-attendance";
import { cn } from "@/lib/utils";
import { AttendanceCalendarResponse } from "@cipansor/shared";

const DAYS_OF_WEEK = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

type AttendanceCalendarDay = AttendanceCalendarResponse["days"][0];

export default function AttendanceCalendarPage() {
  const currentDate = new Date();
  const [unitId, setUnitId] = useState<string>("");
  const [classId, setClassId] = useState<string>("");
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [month, setMonth] = useState<number>(currentDate.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data: units = [] } = useUnits();
  const { data: classesData } = useClasses(unitId ? { unitId } : undefined);
  const classes = classesData?.data || [];

  const { data: calendarData, isLoading } = useAttendanceCalendar(
    classId,
    year,
    month,
  );

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfMonth(new Date(year, month));
    const end = endOfMonth(new Date(year, month));
    const days = eachDayOfInterval({ start, end });

    // Pad with empty days for alignment (start from Sunday)
    const startDayOfWeek = getDay(start);
    const paddedDays: (Date | null)[] = Array(startDayOfWeek).fill(null);
    paddedDays.push(...days);

    // Pad end to complete last week
    while (paddedDays.length % 7 !== 0) {
      paddedDays.push(null);
    }

    return paddedDays;
  }, [year, month]);

  // Create a map of date to attendance data
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceCalendarDay>();
    calendarData?.days?.forEach((day) => {
      map.set(day.date, day);
    });
    return map;
  }, [calendarData]);

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const getAttendanceColor = (
    day: { present: number; absent: number; total: number } | undefined,
  ) => {
    if (!day || day.total === 0) return "bg-gray-100 dark:bg-gray-800";
    const rate = (day.present / day.total) * 100;
    if (rate >= 90) return "bg-green-100 dark:bg-green-900/30 border-green-300";
    if (rate >= 75)
      return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300";
    if (rate >= 50)
      return "bg-orange-100 dark:bg-orange-900/30 border-orange-300";
    return "bg-red-100 dark:bg-red-900/30 border-red-300";
  };

  const selectedDayData = selectedDay ? attendanceMap.get(selectedDay) : null;

  return (
    <MainLayout>
      <PageHeader
        title="Kalender Kehadiran"
        description="Pantau kehadiran santri per kelas dalam tampilan kalender"
      />

      {/* Back Button */}
      <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/attendance">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Filter Kelas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select
              value={unitId}
              onValueChange={(v) => {
                setUnitId(v);
                setClassId("");
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Unit</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent>
                {classes.length === 0 ? (
                  <SelectItem value="" disabled>
                    Pilih unit terlebih dahulu
                  </SelectItem>
                ) : (
                  classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!classId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Pilih kelas untuk melihat kalender kehadiran
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          {calendarData?.summary && (
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Total Santri
                    </span>
                  </div>
                  <p className="text-2xl font-bold">
                    {calendarData.summary.totalStudents}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Hari Aktif
                    </span>
                  </div>
                  <p className="text-2xl font-bold">
                    {calendarData.summary.totalSchoolDays}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Rata-rata Kehadiran
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {calendarData.summary.avgAttendanceRate}%
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Calendar */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {calendarData?.className || "Kelas"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-[180px] text-center">
                    <span className="font-semibold">
                      {MONTHS[month]} {year}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Klik pada tanggal untuk melihat detail kehadiran
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }, (_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div
                        key={day}
                        className="text-center text-sm font-medium text-muted-foreground py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    <TooltipProvider>
                      {calendarDays.map((day, idx) => {
                        if (!day) {
                          return <div key={`empty-${idx}`} className="h-20" />;
                        }

                        const dateKey = format(day, "yyyy-MM-dd");
                        const attendance = attendanceMap.get(dateKey);
                        const hasData = attendance && attendance.total > 0;
                        const rate = hasData
                          ? Math.round(
                              (attendance.present / attendance.total) * 100,
                            )
                          : 0;
                        const isWeekend =
                          getDay(day) === 0 || getDay(day) === 6;

                        return (
                          <Tooltip key={dateKey}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() =>
                                  hasData ? setSelectedDay(dateKey) : null
                                }
                                className={cn(
                                  "h-20 rounded-lg border p-2 text-left transition-all",
                                  hasData
                                    ? "cursor-pointer hover:shadow-md"
                                    : "cursor-default",
                                  isToday(day) && "ring-2 ring-primary",
                                  isWeekend &&
                                    !hasData &&
                                    "bg-gray-50 dark:bg-gray-900",
                                  getAttendanceColor(attendance),
                                )}
                              >
                                <div className="flex flex-col h-full">
                                  <span
                                    className={cn(
                                      "text-sm font-medium",
                                      isToday(day) && "text-primary",
                                    )}
                                  >
                                    {format(day, "d")}
                                  </span>
                                  {hasData && (
                                    <div className="flex-1 flex flex-col justify-end">
                                      <span
                                        className={cn(
                                          "text-xs font-bold",
                                          rate >= 90 && "text-green-600",
                                          rate >= 75 &&
                                            rate < 90 &&
                                            "text-yellow-600",
                                          rate >= 50 &&
                                            rate < 75 &&
                                            "text-orange-600",
                                          rate < 50 && "text-red-600",
                                        )}
                                      >
                                        {rate}%
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {attendance.present}/{attendance.total}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </button>
                            </TooltipTrigger>
                            {hasData && (
                              <TooltipContent>
                                <div className="text-sm">
                                  <p className="font-medium">
                                    {format(day, "d MMMM yyyy", {
                                      locale: localeId,
                                    })}
                                  </p>
                                  <p>Hadir: {attendance.present}</p>
                                  <p>Tidak Hadir: {attendance.absent}</p>
                                  <p>Terlambat: {attendance.late}</p>
                                  <p>Sakit: {attendance.sick}</p>
                                  <p>Izin: {attendance.excused}</p>
                                </div>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        );
                      })}
                    </TooltipProvider>
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-4 justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                      <span className="text-xs text-muted-foreground">
                        ≥90% Hadir
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
                      <span className="text-xs text-muted-foreground">
                        75-89% Hadir
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
                      <span className="text-xs text-muted-foreground">
                        50-74% Hadir
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                      <span className="text-xs text-muted-foreground">
                        &lt;50% Hadir
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
                      <span className="text-xs text-muted-foreground">
                        Tidak Ada Data
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Day Detail Dialog */}
      <Dialog
        open={!!selectedDay}
        onOpenChange={(open) => !open && setSelectedDay(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Detail Kehadiran -{" "}
              {selectedDay &&
                safeFormat(new Date(selectedDay), "d MMMM yyyy", {
                  locale: localeId,
                })}
            </DialogTitle>
            <DialogDescription>{calendarData?.className}</DialogDescription>
          </DialogHeader>
          {selectedDayData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-sm text-muted-foreground">Hadir</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedDayData.present}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-sm text-muted-foreground">Tidak Hadir</p>
                  <p className="text-2xl font-bold text-red-600">
                    {selectedDayData.absent}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <p className="text-sm text-muted-foreground">Terlambat</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {selectedDayData.late}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-sm text-muted-foreground">Sakit</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedDayData.sick}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 col-span-2">
                  <p className="text-sm text-muted-foreground">Izin</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedDayData.excused}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tingkat Kehadiran</span>
                  <span className="font-medium">
                    {Math.round(
                      (selectedDayData.present / selectedDayData.total) * 100,
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    (selectedDayData.present / selectedDayData.total) * 100
                  }
                  className="h-2"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedDay(null)}>
                  Tutup
                </Button>
                <Button asChild>
                  <Link
                    href={`/attendance?classId=${classId}&date=${selectedDay}`}
                  >
                    Lihat Detail
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
