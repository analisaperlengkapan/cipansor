"use client";

import { useAudits } from "@/hooks/use-pengawasan";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const statusColor: Record<string, string> = {
  PLANNED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const severityColor: Record<string, string> = {
  OBSERVATION: "bg-gray-100 text-gray-700",
  MINOR: "bg-yellow-100 text-yellow-700",
  MAJOR: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

export default function PengawasanPage() {
  const { data: audits, isLoading } = useAudits();

  const totalFindings = audits?.reduce(
    (sum: number, a: any) => sum + (a.findings?.length || 0), 0
  ) || 0;

  const criticalFindings = audits?.reduce(
    (sum: number, a: any) =>
      sum + (a.findings?.filter((f: any) => f.severity === "CRITICAL" || f.severity === "MAJOR").length || 0),
    0
  ) || 0;

  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        title="Pengawasan Internal"
        description="Kelola audit internal, temuan, dan tindak lanjut."
      />

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Audit</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-9 w-12" /> : audits?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sedang Berjalan</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{isLoading ? <Skeleton className="h-9 w-12" /> : audits?.filter((a: any) => a.status === "IN_PROGRESS").length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Temuan</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-9 w-12" /> : totalFindings}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Temuan Kritis</CardDescription>
            <CardTitle className="text-3xl text-red-600">{isLoading ? <Skeleton className="h-9 w-12" /> : criticalFindings}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Audit List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Daftar Audit</h2>
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
        ) : audits?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Belum ada audit terjadwal.
            </CardContent>
          </Card>
        ) : (
          audits?.map((audit: any) => (
            <Card key={audit.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{audit.title}</CardTitle>
                    <CardDescription>Tipe: {audit.auditType} • Auditor: {audit.leadAuditor?.name}</CardDescription>
                  </div>
                  <Badge className={statusColor[audit.status]}>{audit.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {audit.findings?.map((f: any) => (
                    <Badge key={f.id} variant="outline" className={severityColor[f.severity]}>
                      {f.severity}: {f.title}
                    </Badge>
                  ))}
                  {(!audit.findings || audit.findings.length === 0) && (
                    <span className="text-sm text-muted-foreground">Belum ada temuan</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
