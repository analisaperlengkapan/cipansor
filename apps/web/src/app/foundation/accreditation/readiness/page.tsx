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
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Award,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Upload,
  Download,
  ExternalLink,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccreditationDashboard } from "@/hooks/use-foundation";
import { useUnits } from "@/hooks/use-units";

const getGradeBadge = (grade: string | null) => {
  if (!grade) return <Badge variant="secondary">N/A</Badge>;
  const colors: Record<string, string> = {
    A: "bg-green-500",
    B: "bg-blue-500",
    C: "bg-yellow-500",
    D: "bg-red-500",
  };
  return <Badge className={colors[grade] || "bg-gray-500"}>{grade}</Badge>;
};

export default function AccreditationReadinessPage() {
  const { data: unitsData } = useUnits();
  const [selectedUnitId, setSelectedUnitId] = useState<string>("all");

  const units = unitsData || [];
  const unitIdForFetch =
    selectedUnitId === "all" ? units[0]?.id : selectedUnitId;

  const { data: accreditationData, isLoading } =
    useAccreditationDashboard(unitIdForFetch);

  if (isLoading) {
    return (
      <MainLayout
        allowedRoles={["SUPER_ADMIN", "FOUNDATION_ADMIN", "UNIT_ADMIN"]}
      >
        <div className="space-y-6">
          <PageHeader
            title="Kesiapan Akreditasi"
            description="Status dan kelengkapan dokumen akreditasi seluruh unit"
          />
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="md:col-span-2 h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  const dashboard = accreditationData;

  return (
    <MainLayout
      allowedRoles={["SUPER_ADMIN", "FOUNDATION_ADMIN", "UNIT_ADMIN"]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Kesiapan Akreditasi"
          description="Status dan kelengkapan dokumen akreditasi seluruh unit"
          actions={
            <div className="flex gap-2">
              <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Semua Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit</SelectItem>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Laporan
              </Button>
            </div>
          }
        />

        {dashboard && (
          <>
            {/* Overall Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="md:col-span-2 bg-gradient-to-r from-primary/10 to-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Skor Kesiapan Akreditasi
                      </p>
                      <p className="text-4xl font-bold text-primary">
                        {dashboard.overallReadiness}%
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Unit: {dashboard.unit.name}
                      </p>
                    </div>
                    <div className="p-4 bg-primary/20 rounded-full">
                      <Shield className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Award className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Akreditasi Saat Ini
                      </p>
                      <p className="text-2xl font-bold">
                        {dashboard.unit.currentAccreditation || "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Sertifikasi Guru
                      </p>
                      <p className="text-2xl font-bold">
                        {dashboard.statistics.teachers.certificationRate}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Unit Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {dashboard.unit.name}
                        {getGradeBadge(dashboard.unit.currentAccreditation)}
                      </CardTitle>
                      <CardDescription>
                        NPSN: {dashboard.unit.npsn || "-"}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {dashboard.readinessScores.map((std) => (
                    <div
                      key={std.standardCode}
                      className={cn(
                        "p-3 border rounded-lg",
                        std.autoScore >= 80
                          ? "border-green-200 bg-green-50/50"
                          : "border-amber-200 bg-amber-50/50",
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {std.standardName}
                        </span>
                        {std.autoScore >= 80 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={std.autoScore} className="h-2 flex-1" />
                        <span className="text-sm font-bold">
                          {std.autoScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {dashboard.recommendedActions.length > 0 && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                    <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Rekomendasi Tindakan
                    </h4>
                    <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                      {dashboard.recommendedActions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 mt-6">
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Lihat Dokumen
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Dokumen
                  </Button>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Link SISPENA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
