"use client";

import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useActiveAcademicYear } from "@/hooks/use-academic-years";
import { useQualityDashboard, useQualityStandards } from "@/hooks/use-quality";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, FileCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUnits } from "@/hooks/use-units";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function QualityDashboardPage() {
  const { user } = useAuth();
  const { data: activeAcademicYear } = useActiveAcademicYear();

  // SPMI is measured per unit, but the yayasan board oversees every unit and
  // belongs to none — user.unitId is null for them. This page used to read
  // that null as "not entitled" and show "Akses Dibatasi", locking the very
  // roles whose job is to review mutu across units out of the mutu dashboard.
  // Foundation users pick a unit instead; unit users stay pinned to theirs.
  const { data: units } = useUnits();
  const isFoundationUser = !user?.unitId;
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  useEffect(() => {
    if (isFoundationUser && !selectedUnitId && units?.length) {
      setSelectedUnitId(units[0].id);
    }
  }, [isFoundationUser, selectedUnitId, units]);

  const unitId = user?.unitId ?? selectedUnitId;

  const { data: dashboardData, isLoading } = useQualityDashboard(
    unitId || "",
    activeAcademicYear?.id || "",
  );

  // We also need the raw standards to map dashboard data (which has Enum types) to actual IDs for linking
  const { data: allStandards } = useQualityStandards();

  if (isFoundationUser && !unitId) {
    return (
      <MainLayout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold">Belum ada unit</h2>
          <p className="text-muted-foreground">
            Tambahkan unit pendidikan terlebih dahulu untuk memantau capaian
            mutu.
          </p>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">Loading...</div>
      </MainLayout>
    );
  }

  const overallCompliance = dashboardData
    ? dashboardData.reduce((acc, curr) => acc + curr.compliancePercentage, 0) /
      (dashboardData.length || 1)
    : 0;

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Penjaminan Mutu (SPMI)
            </h1>
            <p className="text-muted-foreground">
              Dashboard pemenuhan 8 Standar Nasional Pendidikan.
            </p>
          </div>

          {isFoundationUser && (
            <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
              <SelectTrigger className="w-full md:w-64" aria-label="Pilih unit">
                <SelectValue placeholder="Pilih unit" />
              </SelectTrigger>
              <SelectContent>
                {units?.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Capaian Mutu
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overallCompliance.toFixed(1)}%
              </div>
              <Progress value={overallCompliance} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Rata-rata dari 8 Standar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Audit Mutu Internal
              </CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                Kelola jadwal dan hasil audit internal secara berkala.
              </div>
              <Link href="/quality/audits">
                <Button size="sm" className="w-full">
                  Buka Menu Audit <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboardData?.map((item) => (
            <Card key={item.standardType} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{item.standardName}</CardTitle>
                <CardDescription>
                  {item.uploadedEvidenceCount} bukti diunggah dari{" "}
                  {item.totalIndicators} indikator
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Kelengkapan</span>
                    <span className="font-medium">
                      {item.compliancePercentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={item.compliancePercentage} />
                </div>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                <Link href={`/quality/${item.id}`}>
                  <Button variant="outline" className="w-full">
                    Lihat Detail <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
