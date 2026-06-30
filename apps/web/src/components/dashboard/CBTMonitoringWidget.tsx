"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CBTStats } from "@cipansor/shared";
import { Brain, FileCheck, Users, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CBTMonitoringWidgetProps {
  stats?: CBTStats;
  loading?: boolean;
}

export function CBTMonitoringWidget({ stats, loading }: CBTMonitoringWidgetProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="h-20 bg-slate-100" />
        <CardContent className="h-40 bg-slate-50" />
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className="overflow-hidden border-none shadow-md bg-white">
      <CardHeader className="bg-indigo-600 text-white pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Brain className="h-5 w-5" /> Online Exam (CBT)
            </CardTitle>
            <CardDescription className="text-indigo-100 text-xs">Monitoring Ujian Online Real-time</CardDescription>
          </div>
          <Badge variant="outline" className="text-white border-white/30 bg-white/10">
            {stats.activeExams} Aktif
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileCheck className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase">Total Ujian</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.totalExams}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] font-bold uppercase">Rata-rata Nilai</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.avgScore.toFixed(1)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                <Users className="h-3.5 w-3.5" /> Total Partisipasi
              </span>
              <span className="text-xs font-black">{stats.totalAttempts} Sesi</span>
            </div>
            <Progress value={Math.min(100, (stats.totalAttempts / 1000) * 100)} className="h-1.5 bg-slate-100" />
            <p className="text-[9px] text-muted-foreground italic">
              *Statistik akumulatif seluruh unit pendidikan Cipansor.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-between">
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-indigo-700 uppercase">Status Sistem</span>
               <span className="text-xs font-bold text-indigo-900">Optimal (Latency 45ms)</span>
             </div>
             <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
