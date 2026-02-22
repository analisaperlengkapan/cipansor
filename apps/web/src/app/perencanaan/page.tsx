"use client";

import { usePlans } from "@/hooks/use-perencanaan";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PROPOSED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const typeLabel: Record<string, string> = {
  RENSTRA: "Rencana Strategis",
  RKAS: "RKA Sekolah",
  RKT: "Rencana Kerja Tahunan",
  PROGRAM: "Program Kerja",
};

export default function PerencanaanPage() {
  const { data: plans, isLoading } = usePlans();

  const approvedCount = plans?.filter((p) => p.status === "APPROVED" || p.status === "IN_PROGRESS").length || 0;
  const avgProgress = plans?.length
    ? Math.round(plans.reduce((s, p) => s + p.progress, 0) / plans.length)
    : 0;

  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        title="Perencanaan Strategis"
        description="Kelola rencana strategis, RKAS, RKT, dan program kerja yayasan."
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Rencana</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-9 w-12" /> : plans?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Disetujui / Berjalan</CardDescription>
            <CardTitle className="text-3xl text-green-600">{isLoading ? <Skeleton className="h-9 w-12" /> : approvedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rata-rata Progress</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{isLoading ? <Skeleton className="h-9 w-12" /> : `${avgProgress}%`}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sasaran</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-9 w-12" /> : plans?.reduce((s, p) => s + (p.objectives?.length || 0), 0) || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Daftar Rencana</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        ) : plans?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Belum ada rencana. Buat rencana baru untuk memulai.
            </CardContent>
          </Card>
        ) : (
          plans?.map((plan) => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{plan.title}</CardTitle>
                    <CardDescription>{typeLabel[plan.type] || plan.type}</CardDescription>
                  </div>
                  <Badge className={statusColor[plan.status]}>{plan.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{plan.progress}%</span>
                  </div>
                  <Progress value={plan.progress} className="h-2" />
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{plan.objectives?.length || 0} sasaran</span>
                    <span>Dibuat oleh: {plan.createdBy?.name}</span>
                    <span>
                      {new Date(plan.startDate).toLocaleDateString("id-ID")} - {new Date(plan.endDate).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
