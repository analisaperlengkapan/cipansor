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
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function QualityDashboardPage() {
  const { user } = useAuth();
  const { activeAcademicYear } = useActiveAcademicYear();
  const unitId = user?.unitId;

  const { data: dashboardData, isLoading } = useQualityDashboard(
    unitId || "",
    activeAcademicYear?.id || "",
  );

  // We also need the raw standards to map dashboard data (which has Enum types) to actual IDs for linking
  const { data: allStandards } = useQualityStandards();

  if (!unitId) {
    return (
      <MainLayout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold">Akses Dibatasi</h2>
          <p className="text-muted-foreground">
            Anda harus terhubung dengan unit untuk melihat dashboard ini.
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
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Penjaminan Mutu (SPMI)
          </h1>
          <p className="text-muted-foreground">
            Dashboard pemenuhan 8 Standar Nasional Pendidikan.
          </p>
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
