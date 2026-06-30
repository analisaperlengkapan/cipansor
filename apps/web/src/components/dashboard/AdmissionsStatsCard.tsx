"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdmissionsStats } from "@cipansor/shared";
import { Users, UserCheck, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface AdmissionsStatsCardProps {
  stats?: AdmissionsStats;
  loading?: boolean;
}

export function AdmissionsStatsCard({ stats, loading }: AdmissionsStatsCardProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="h-20 bg-slate-100" />
        <CardContent className="h-40 bg-slate-50" />
      </Card>
    );
  }

  if (!stats) return null;

  const statusColors: Record<string, string> = {
    REGISTERED: "bg-blue-100 text-blue-800",
    DOCUMENT_CHECK: "bg-yellow-100 text-yellow-800",
    TEST_SCHEDULED: "bg-purple-100 text-purple-800",
    TEST_COMPLETED: "bg-indigo-100 text-indigo-800",
    ACCEPTED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    ENROLLED: "bg-emerald-100 text-emerald-800",
  };

  const statusLabels: Record<string, string> = {
    REGISTERED: "Mendaftar",
    DOCUMENT_CHECK: "Verifikasi Dokumen",
    TEST_SCHEDULED: "Jadwal Tes",
    TEST_COMPLETED: "Tes Selesai",
    ACCEPTED: "Diterima",
    REJECTED: "Ditolak",
    ENROLLED: "Daftar Ulang",
  };

  return (
    <Card className="overflow-hidden border-none shadow-md bg-white">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> PPDB / PSB
            </CardTitle>
            <CardDescription className="text-xs">Statistik Pendaftaran Terpadu</CardDescription>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
            {stats.activePeriods} Periode Aktif
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-[10px] font-bold text-blue-600 uppercase">Total Pendaftar</p>
            <p className="text-2xl font-black text-blue-900">{stats.totalRegistrants}</p>
          </div>
          <div className="p-3 rounded-xl bg-green-50 border border-green-100">
            <p className="text-[10px] font-bold text-green-600 uppercase">Diterima</p>
            <p className="text-2xl font-black text-green-900">{stats.byStatus["ACCEPTED"] || 0}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
            <Clock className="h-3 w-3" /> Pendaftar Terbaru
          </h4>
          <div className="space-y-2">
            {stats.recentRegistrants.map((reg) => (
              <div key={reg.id} className="flex items-center justify-between p-2 rounded-lg border bg-slate-50/30 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col">
                  <span className="text-xs font-bold truncate max-w-[120px]">{reg.fullName}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {format(new Date(reg.createdAt), "dd MMM HH:mm", { locale: id })}
                  </span>
                </div>
                <Badge className={`text-[9px] px-1.5 py-0 min-w-[70px] justify-center ${statusColors[reg.status] || "bg-gray-100"}`}>
                  {statusLabels[reg.status] || reg.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
