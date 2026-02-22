"use client";

import { useEnvironmentPrograms, useWasteSummary, useGreenIndicators } from "@/hooks/use-lingkungan";
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
  PLANNED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

export default function LingkunganPage() {
  const { data: programs, isLoading: loadingPrograms } = useEnvironmentPrograms();
  const { data: wasteSummary } = useWasteSummary();
  const { data: indicators } = useGreenIndicators();

  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        title="Lingkungan & Kampus Hijau"
        description="Kelola program lingkungan, pengelolaan sampah, dan indikator Adiwiyata."
      />

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Program Aktif</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {loadingPrograms ? <Skeleton className="h-9 w-12" /> : programs?.filter((p: any) => p.status === "ACTIVE").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sampah (kg)</CardDescription>
            <CardTitle className="text-3xl">{wasteSummary?.totalWeight?.toFixed(1) ?? <Skeleton className="h-9 w-12" />}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Indikator</CardDescription>
            <CardTitle className="text-3xl">{indicators?.length ?? <Skeleton className="h-9 w-12" />}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Program</CardDescription>
            <CardTitle className="text-3xl">{loadingPrograms ? <Skeleton className="h-9 w-12" /> : programs?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Waste Summary */}
      {wasteSummary && Object.keys(wasteSummary.byCategory || {}).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pengelolaan Sampah</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {Object.entries(wasteSummary.byCategory).map(([cat, weight]: [string, any]) => (
              <Card key={cat}>
                <CardHeader className="pb-1">
                  <CardDescription className="text-xs">{cat}</CardDescription>
                  <CardTitle className="text-lg">{weight.toFixed(1)} kg</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Programs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Program Lingkungan</h2>
        {loadingPrograms ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
        ) : programs?.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada program lingkungan.</CardContent></Card>
        ) : (
          programs?.map((prog: any) => (
            <Card key={prog.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{prog.title}</CardTitle>
                    <CardDescription>{prog.category} {prog.pic ? `• PIC: ${prog.pic.name}` : ""}</CardDescription>
                  </div>
                  <Badge className={statusColor[prog.status]}>{prog.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{prog.progress}%</span>
                </div>
                <Progress value={prog.progress} className="h-2" />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
