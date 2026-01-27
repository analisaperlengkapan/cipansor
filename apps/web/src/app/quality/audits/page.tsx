"use client";

import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useActiveAcademicYear } from "@/hooks/use-academic-years";
import { useQualityAudits } from "@/hooks/use-quality";
import { CreateAuditDialog } from "@/components/quality/create-audit-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, FileCheck, User } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function QualityAuditsPage() {
  const { user } = useAuth();
  const { activeAcademicYear } = useActiveAcademicYear();
  const unitId = user?.unitId;

  const { data: audits, isLoading } = useQualityAudits(
    unitId || "",
    activeAcademicYear?.id || "",
  );

  if (!unitId) {
    return (
      <MainLayout>
        <div className="p-8">Akses Dibatasi</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/quality">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Audit Mutu Internal (AMI)
              </h1>
              <p className="text-muted-foreground">
                Jadwal dan pelaksanaan audit internal penjaminan mutu.
              </p>
            </div>
          </div>
          {activeAcademicYear && (
            <CreateAuditDialog
              unitId={unitId}
              academicYearId={activeAcademicYear.id}
            />
          )}
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : audits && audits.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {audits.map((audit: any) => (
              <Card key={audit.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{audit.name}</CardTitle>
                      <CardDescription>{audit.code}</CardDescription>
                    </div>
                    <Badge variant={audit.status === "COMPLETED" ? "default" : "outline"}>
                      {audit.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(audit.startDate), "dd MMM yyyy", { locale: idLocale })} -{" "}
                      {format(new Date(audit.endDate), "dd MMM yyyy", { locale: idLocale })}
                    </span>
                  </div>

                  {audit.leadAuditor && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Lead: {audit.leadAuditor.name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileCheck className="h-4 w-4" />
                    <span>{audit._count?.items || 0} Indikator Penilaian</span>
                  </div>

                  <div className="pt-4 mt-auto">
                    <Link href={`/quality/audits/${audit.id}`} className="w-full">
                      <Button className="w-full">
                        Buka Lembar Audit
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-muted/10 text-center">
            <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Belum ada jadwal audit</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              Buat jadwal audit baru untuk memulai proses Audit Mutu Internal (AMI).
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
