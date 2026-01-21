"use client";

import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { useClasses } from "@/hooks/use-classes";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

// Generate mock attendance data for heatmap
const generateMockData = (classCount: number, daysInMonth: number) => {
  const data: Record<
    string,
    Record<
      string,
      { present: number; absent: number; late: number; total: number }
    >
  > = {};

  const classNames = ["VII A", "VII B", "VIII A", "VIII B", "IX A", "IX B"];

  for (let i = 0; i < Math.min(classCount, classNames.length); i++) {
    const className = classNames[i];
    data[className] = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `2026-01-${day.toString().padStart(2, "0")}`;
      const total = 28 + Math.floor(Math.random() * 5);
      const absent = Math.floor(Math.random() * 4);
      const late = Math.floor(Math.random() * 3);

      data[className][date] = {
        present: total - absent - late,
        absent,
        late,
        total,
      };
    }
  }

  return data;
};

const getHeatmapColor = (attendanceRate: number) => {
  if (attendanceRate >= 95) return "bg-green-500";
  if (attendanceRate >= 90) return "bg-green-400";
  if (attendanceRate >= 85) return "bg-yellow-400";
  if (attendanceRate >= 80) return "bg-orange-400";
  if (attendanceRate >= 75) return "bg-orange-500";
  return "bg-red-500";
};

const WEEKDAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function AttendanceHeatmapPage() {
  const { user } = useAuthStore();
  const [selectedMonth, setSelectedMonth] = useState("2026-01");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [hoveredCell, setHoveredCell] = useState<{
    class: string;
    date: string;
  } | null>(null);

  const { data: classes } = useClasses({ unitId: user?.unitId });

  // Parse month
  const [year, month] = selectedMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  // Generate mock data
  const attendanceData = useMemo(() => {
    return generateMockData(6, daysInMonth);
  }, [daysInMonth]);

  const classNames = Object.keys(attendanceData);
  const filteredClasses =
    selectedClass === "all" ? classNames : [selectedClass];

  // Calculate overall stats
  const overallStats = useMemo(() => {
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalStudents = 0;

    filteredClasses.forEach((className) => {
      Object.values(attendanceData[className] || {}).forEach((day) => {
        totalPresent += day.present;
        totalAbsent += day.absent;
        totalLate += day.late;
        totalStudents += day.total;
      });
    });

    return {
      attendanceRate:
        totalStudents > 0
          ? ((totalPresent / totalStudents) * 100).toFixed(1)
          : 0,
      totalAbsent,
      totalLate,
      worstDay: "2026-01-13", // Mock
    };
  }, [filteredClasses, attendanceData]);

  // Generate calendar grid for each class
  const renderHeatmapForClass = (className: string) => {
    const classData = attendanceData[className] || {};

    // Create calendar grid
    const calendarDays = [];

    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(null);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `2026-01-${day.toString().padStart(2, "0")}`;
      calendarDays.push({ day, date, data: classData[date] });
    }

    return (
      <div key={className} className="mb-6">
        <h4 className="font-medium mb-2">{className}</h4>
        <div className="grid grid-cols-7 gap-1">
          {/* Weekday headers */}
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-xs text-center text-muted-foreground py-1"
            >
              {label}
            </div>
          ))}

          {/* Calendar cells */}
          {calendarDays.map((cell, index) => {
            if (!cell) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const attendanceRate = cell.data
              ? (cell.data.present / cell.data.total) * 100
              : 100;
            const isHovered =
              hoveredCell?.class === className &&
              hoveredCell?.date === cell.date;

            return (
              <div
                key={cell.date}
                className="relative"
                onMouseEnter={() =>
                  setHoveredCell({ class: className, date: cell.date })
                }
                onMouseLeave={() => setHoveredCell(null)}
              >
                <div
                  className={cn(
                    "aspect-square rounded-sm flex items-center justify-center text-xs font-medium transition-all cursor-pointer",
                    getHeatmapColor(attendanceRate),
                    "text-white",
                    isHovered && "ring-2 ring-primary ring-offset-1",
                  )}
                >
                  {cell.day}
                </div>

                {/* Tooltip */}
                {isHovered && cell.data && (
                  <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-popover border rounded-lg shadow-lg p-3 min-w-[150px]">
                    <p className="font-medium text-sm mb-2">
                      {new Date(cell.date).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Hadir:</span>
                        <span className="font-medium text-green-600">
                          {cell.data.present}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tidak Hadir:</span>
                        <span className="font-medium text-red-600">
                          {cell.data.absent}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Terlambat:</span>
                        <span className="font-medium text-amber-600">
                          {cell.data.late}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-1 mt-1">
                        <span>Rate:</span>
                        <span className="font-bold">
                          {attendanceRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <MainLayout allowedRoles={["SUPER_ADMIN", "UNIT_ADMIN", "TEACHER"]}>
      <div className="space-y-6">
        <PageHeader
          title="Heatmap Kehadiran"
          description="Visualisasi pola kehadiran siswa per kelas"
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026-01">Januari 2026</SelectItem>
              <SelectItem value="2025-12">Desember 2025</SelectItem>
              <SelectItem value="2025-11">November 2025</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {classNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tingkat Kehadiran
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {overallStats.attendanceRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Tidak Hadir
                  </p>
                  <p className="text-2xl font-bold">
                    {overallStats.totalAbsent}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Terlambat
                  </p>
                  <p className="text-2xl font-bold">{overallStats.totalLate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hari Terendah</p>
                  <p className="text-lg font-bold">Senin, 13 Jan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Heatmap Legend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {[
                { label: "≥95%", color: "bg-green-500" },
                { label: "90-94%", color: "bg-green-400" },
                { label: "85-89%", color: "bg-yellow-400" },
                { label: "80-84%", color: "bg-orange-400" },
                { label: "75-79%", color: "bg-orange-500" },
                { label: "<75%", color: "bg-red-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={cn("w-6 h-6 rounded", item.color)} />
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Heatmaps */}
        <Card>
          <CardHeader>
            <CardTitle>Heatmap Kehadiran per Kelas</CardTitle>
            <CardDescription>
              Hover untuk melihat detail kehadiran per hari
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.map((className) =>
                renderHeatmapForClass(className),
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
