"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import {
  useRegistrant,
  useOnboardRegistrant,
  useUpdateRegistrantStatus,
} from "@/hooks/use-admissions";
import { useAuth } from "@/hooks/use-auth";
import { safeFormat } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Rocket, GraduationCap } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  REGISTERED: "Mendaftar",
  DOCUMENT_CHECK: "Verifikasi Dokumen",
  TEST_SCHEDULED: "Dijadwalkan Tes",
  TEST_COMPLETED: "Selesai Tes",
  ACCEPTED: "Diterima",
  REJECTED: "Ditolak",
  ENROLLED: "Sudah Daftar Ulang",
  CANCELLED: "Dibatalkan",
};

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
      <p className="font-medium">{value ?? "-"}</p>
    </div>
  );
}

export default function RegistrationDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = React.use(paramsPromise);
  const { user } = useAuth();
  const { data: registrant, isLoading } = useRegistrant(params.id);
  const onboard = useOnboardRegistrant();
  const updateStatus = useUpdateRegistrantStatus();
  const [isOnboarding, setIsOnboarding] = useState(false);

  const handleOnboard = async () => {
    if (!registrant) return;
    const unitId =
      registrant.unitId ||
      registrant.admissionPeriod?.unitId ||
      (user as { unitId?: string } | null)?.unitId;
    if (!unitId) {
      toast.error("Unit tidak diketahui untuk pendaftar ini.");
      return;
    }

    setIsOnboarding(true);
    try {
      // 1. Run the integrated onboarding orchestrator (creates student,
      //    invoice, medical record, parent account).
      await onboard.mutateAsync({ registrantId: registrant.id, unitId });
      // 2. Mark the registrant as enrolled.
      await updateStatus.mutateAsync({ id: registrant.id, status: "ENROLLED" });
      toast.success("Siswa berhasil di-Onboard secara terpadu!");
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal melakukan onboarding terpadu.";
      toast.error(message);
    } finally {
      setIsOnboarding(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!registrant) {
    return (
      <MainLayout>
        <div className="py-12 text-center text-destructive">
          Data pendaftar tidak ditemukan.
        </div>
      </MainLayout>
    );
  }

  const canOnboard =
    registrant.status === "ACCEPTED" && !registrant.enrolledAt;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader
            title={registrant.fullName || registrant.name || "Pendaftar"}
            description={`No. Pendaftaran: ${registrant.registrationNo ?? "-"}`}
          />
          <Badge variant="outline" className="text-sm uppercase">
            {STATUS_LABEL[registrant.status] ?? registrant.status}
          </Badge>
        </div>

        {canOnboard && (
          <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Rocket className="h-5 w-5 text-emerald-600" /> Onboarding Terpadu
              </CardTitle>
              <CardDescription>
                Pendaftar telah diterima. Jalankan onboarding terpadu untuk
                membuat data siswa, tagihan SPP, rekam medis, dan akun wali
                secara otomatis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleOnboard} disabled={isOnboarding}>
                {isOnboarding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <GraduationCap className="mr-2 h-4 w-4" />
                )}
                Eksekusi Onboarding Terpadu (E2E)
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Calon Santri</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Field label="Nama Lengkap" value={registrant.fullName || registrant.name} />
              <Field label="Jenis Kelamin" value={registrant.gender} />
              <Field label="Tempat Lahir" value={registrant.birthPlace} />
              <Field
                label="Tanggal Lahir"
                value={safeFormat(registrant.birthDate, "dd MMM yyyy")}
              />
              <Field label="Asal Sekolah" value={registrant.previousSchool} />
              <Field
                label="Tanggal Daftar"
                value={safeFormat(registrant.createdAt, "dd MMM yyyy")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Orang Tua / Wali</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Field label="Nama Wali" value={registrant.parentName} />
              <Field label="No. HP Wali" value={registrant.parentPhone} />
              <Field label="Email Wali" value={registrant.parentEmail} />
              <Field label="Pekerjaan" value={registrant.parentOccupation} />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
