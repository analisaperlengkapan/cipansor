"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarDays,
  Pencil,
  Building2,
  Calendar,
  CheckCircle,
  Circle,
  Loader2,
} from "lucide-react";

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAcademicYear } from "@/hooks/use-academic-years";

export default function AcademicYearDetailPage() {
  const params = useParams();
  const academicYearId = params.id as string;

  const { data: academicYear, isLoading } = useAcademicYear(academicYearId);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!academicYear) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <CalendarDays className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Tahun ajaran tidak ditemukan</p>
          <Button asChild>
            <Link href="/academic-years">Kembali ke Daftar</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const duration = Math.ceil(
    (new Date(academicYear.endDate).getTime() -
      new Date(academicYear.startDate).getTime()) /
      (1000 * 60 * 60 * 24 * 30),
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/academic-years">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {academicYear.name}
                </h1>
                {academicYear.isActive ? (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Aktif
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Circle className="h-3 w-3 mr-1" />
                    Tidak Aktif
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">Detail tahun ajaran</p>
            </div>
          </div>
          <Button asChild>
            <Link href={`/academic-years/${academicYearId}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Info */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Informasi Tahun Ajaran
              </CardTitle>
              <CardDescription>Data lengkap tahun ajaran</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Nama
                  </p>
                  <p className="text-lg font-semibold">{academicYear.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <p className="text-lg">
                    {academicYear.isActive ? "Aktif" : "Tidak Aktif"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Unit Pendidikan
                  </p>
                  <p>{academicYear.unit?.name || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tanggal Mulai
                    </p>
                    <p>
                      {format(new Date(academicYear.startDate), "d MMMM yyyy", {
                        locale: localeId,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tanggal Selesai
                    </p>
                    <p>
                      {format(new Date(academicYear.endDate), "d MMMM yyyy", {
                        locale: localeId,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Dibuat
                  </p>
                  <p className="text-sm">
                    {format(
                      new Date(academicYear.createdAt),
                      "d MMMM yyyy HH:mm",
                      { locale: localeId },
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Terakhir Diperbarui
                  </p>
                  <p className="text-sm">
                    {format(
                      new Date(academicYear.updatedAt),
                      "d MMMM yyyy HH:mm",
                      { locale: localeId },
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Durasi</CardTitle>
              <CardDescription>Lama tahun ajaran</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-6 bg-muted rounded-lg">
                <p className="text-4xl font-bold text-primary">{duration}</p>
                <p className="text-sm text-muted-foreground">Bulan</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mulai</span>
                  <span>
                    {format(new Date(academicYear.startDate), "MMM yyyy", {
                      locale: localeId,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selesai</span>
                  <span>
                    {format(new Date(academicYear.endDate), "MMM yyyy", {
                      locale: localeId,
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>
              Kelola data terkait tahun ajaran ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href={`/classes?academicYearId=${academicYearId}`}>
                  Lihat Kelas
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/students?academicYearId=${academicYearId}`}>
                  Lihat Siswa
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
