"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CBTStats } from "@cipansor/shared";
import { Brain, FileCheck, Users, Trophy, CalendarClock } from "lucide-react";

interface CBTMonitoringWidgetProps {
  stats?: CBTStats;
  isLoading?: boolean;
}

/**
 * Dashboard summary of the online exam (CBT) module. Rendered only for
 * admin/staff/teacher roles — the backend omits `cbt` for everyone else.
 */
export function CBTMonitoringWidget({
  stats,
  isLoading,
}: CBTMonitoringWidgetProps) {
  if (isLoading) {
    return <Skeleton className="h-72 rounded-xl" />;
  }
  if (!stats) return null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-600" /> Ujian Online (CBT)
            </CardTitle>
            <CardDescription className="text-xs">
              Ringkasan pelaksanaan ujian berbasis komputer
            </CardDescription>
          </div>
          <Badge
            variant={stats.ongoingExams > 0 ? "default" : "outline"}
            className={stats.ongoingExams > 0 ? "bg-indigo-600" : ""}
          >
            {stats.ongoingExams} Berlangsung
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileCheck className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase">
                Total Ujian
              </span>
            </div>
            <p className="text-2xl font-black">{stats.totalExams}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase">
                Akan Datang
              </span>
            </div>
            <p className="text-2xl font-black">{stats.upcomingExams}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase">
                Total Sesi Peserta
              </span>
            </div>
            <p className="text-2xl font-black">{stats.totalAttempts}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] font-bold uppercase">
                Rata-rata Nilai
              </span>
            </div>
            <p className="text-2xl font-black">
              {stats.totalAttempts > 0 ? stats.avgScore.toFixed(1) : "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
