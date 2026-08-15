"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  BookOpen,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";

import { MainLayout } from "@/components/layout";
// Types
interface MurojaahScheduleItem {
  id: string;
  studentId: string;
  studentName: string;
  halaqohId: string;
  halaqohName: string;
  juzStart: number;
  juzEnd: number;
  scheduledDate: string;
  scheduledTime?: string;
  type: "HARIAN" | "MINGGUAN" | "BULANAN";
  status: "SCHEDULED" | "COMPLETED" | "MISSED";
  notes?: string;
}

interface DaySchedule {
  date: Date;
  items: MurojaahScheduleItem[];
}

// Mock fetch function - replace with actual API
const fetchSchedule = async (
  weekStart: Date,
  halaqohId?: string,
): Promise<MurojaahScheduleItem[]> => {
  // Simulated API response
  return [];
};

const fetchHalaqohs = async () => {
  return [
    { id: "1", name: "Halaqoh A" },
    { id: "2", name: "Halaqoh B" },
    { id: "3", name: "Halaqoh C" },
  ];
};

// Components
function ScheduleCard({ item }: { item: MurojaahScheduleItem }) {
  const statusColors = {
    SCHEDULED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    MISSED: "bg-red-100 text-red-800",
  };

  const typeLabels = {
    HARIAN: "Harian",
    MINGGUAN: "Mingguan",
    BULANAN: "Bulanan",
  };

  return (
    <Card className="mb-2 hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{item.studentName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BookOpen className="h-3 w-3" />
              <span>
                Juz {item.juzStart}
                {item.juzEnd !== item.juzStart ? `-${item.juzEnd}` : ""}
              </span>
            </div>
            {item.scheduledTime && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{item.scheduledTime}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={statusColors[item.status]}>
              {item.status === "SCHEDULED"
                ? "Dijadwalkan"
                : item.status === "COMPLETED"
                  ? "Selesai"
                  : "Terlewat"}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {typeLabels[item.type]}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DayColumn({ daySchedule }: { daySchedule: DaySchedule }) {
  const isToday = isSameDay(daySchedule.date, new Date());

  return (
    <div
      className={`flex-1 min-w-[150px] ${isToday ? "bg-primary/5 rounded-lg" : ""}`}
    >
      <div
        className={`p-2 text-center border-b ${isToday ? "bg-primary/10" : "bg-muted/50"}`}
      >
        <div className="text-xs text-muted-foreground">
          {format(daySchedule.date, "EEEE", { locale: localeId })}
        </div>
        <div
          className={`text-lg font-semibold ${isToday ? "text-primary" : ""}`}
        >
          {format(daySchedule.date, "d")}
        </div>
        <div className="text-xs text-muted-foreground">
          {format(daySchedule.date, "MMM", { locale: localeId })}
        </div>
      </div>
      <div className="p-2 space-y-2 min-h-[200px]">
        {daySchedule.items.length > 0 ? (
          daySchedule.items.map((item) => (
            <ScheduleCard key={item.id} item={item} />
          ))
        ) : (
          <div className="text-center text-xs text-muted-foreground py-4">
            Tidak ada jadwal
          </div>
        )}
      </div>
    </div>
  );
}

function MurojaahSchedulePageContent() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [selectedHalaqoh, setSelectedHalaqoh] = useState<string>("all");

  // Fetch halaqohs
  const { data: halaqohs } = useQuery({
    queryKey: ["halaqohs"],
    queryFn: fetchHalaqohs,
  });

  // Fetch schedule
  const { data: scheduleItems, isLoading } = useQuery({
    queryKey: [
      "murojaah-schedule",
      currentWeekStart.toISOString(),
      selectedHalaqoh,
    ],
    queryFn: () =>
      fetchSchedule(
        currentWeekStart,
        selectedHalaqoh !== "all" ? selectedHalaqoh : undefined,
      ),
  });

  // Generate week days
  const weekDays: DaySchedule[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeekStart, i);
    const items =
      scheduleItems?.filter((item) =>
        isSameDay(new Date(item.scheduledDate), date),
      ) || [];
    return { date, items };
  });

  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jadwal Murojaah</h1>
          <p className="text-muted-foreground">
            Kelola jadwal muroja'ah santri per halaqoh
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/tahfidz/murojaah">
            <Button variant="outline">Lihat Semua Murojaah</Button>
          </Link>
          <Link href="/tahfidz/murojaah/new">
            <Button>Tambah Jadwal</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Week Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {format(currentWeekStart, "d MMM", { locale: localeId })} -{" "}
                  {format(addDays(currentWeekStart, 6), "d MMM yyyy", {
                    locale: localeId,
                  })}
                </span>
              </div>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToCurrentWeek}>
                Minggu Ini
              </Button>
            </div>

            {/* Halaqoh Filter */}
            <Select value={selectedHalaqoh} onValueChange={setSelectedHalaqoh}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Halaqoh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Halaqoh</SelectItem>
                {halaqohs?.map((halaqoh) => (
                  <SelectItem key={halaqoh.id} value={halaqoh.id}>
                    {halaqoh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Jadwal Mingguan</CardTitle>
          <CardDescription>
            Klik pada jadwal untuk melihat detail atau mencatat hasil murojaah
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex gap-2 overflow-x-auto pb-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 min-w-[150px]">
                  <Skeleton className="h-16 w-full mb-2" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-4">
              {weekDays.map((daySchedule) => (
                <DayColumn
                  key={daySchedule.date.toISOString()}
                  daySchedule={daySchedule}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {scheduleItems?.filter((i) => i.status === "SCHEDULED")
                    .length || 0}
                </div>
                <div className="text-xs text-muted-foreground">Dijadwalkan</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {scheduleItems?.filter((i) => i.status === "COMPLETED")
                    .length || 0}
                </div>
                <div className="text-xs text-muted-foreground">Selesai</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {scheduleItems?.filter((i) => i.status === "MISSED").length ||
                    0}
                </div>
                <div className="text-xs text-muted-foreground">Terlewat</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {new Set(scheduleItems?.map((i) => i.studentId) || []).size}
                </div>
                <div className="text-xs text-muted-foreground">Santri</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function MurojaahSchedulePage() {
  return (
    <MainLayout>
      <MurojaahSchedulePageContent />
    </MainLayout>
  );
}
