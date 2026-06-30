"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, TrendingUp, Info } from "lucide-react";
import { GrcStatsOverview } from "@/components/grc/GrcStatsOverview";

export default function GRCDashboardPage() {
  const { data: grcStats, isLoading } = useQuery({
    queryKey: ["grc-stats"],
    queryFn: async () => {
      const res = await api.get("/analytics/grc");
      return res.data.data;
    },
  });

  const { data: audits } = useQuery({
    queryKey: ["internal-audits"],
    queryFn: async () => {
      const res = await api.get("/internal-audits");
      return res.data.data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="GRC Executive Dashboard"
        description="Governance, Risk, and Compliance - Unified monitoring of organizational health."
      />

      {grcStats && <GrcStatsOverview stats={grcStats} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Temuan Audit & Tindak Lanjut
          </CardTitle>
          <CardDescription>Ringkasan temuan yang memerlukan perhatian manajemen.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {audits?.slice(0, 3).map((audit: any) => (
              <div key={audit.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{audit.title}</p>
                  <p className="text-xs text-muted-foreground">Tipe: {audit.auditType} • Tanggal: {new Date(audit.plannedDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Temuan</p>
                    <p className="text-sm font-bold">{audit.findings?.length || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium">{audit.status}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!audits || audits.length === 0) && (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                <Info className="w-8 h-8 opacity-20" />
                <p>Tidak ada data audit yang tersedia.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
