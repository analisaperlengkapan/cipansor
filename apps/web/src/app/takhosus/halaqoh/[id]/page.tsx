"use client";
import { use } from "react";
import { safeFormat } from "@/lib/date";
import Link from "next/link";

import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft,
  BookOpen,
  Users,
  Calendar,
  MapPin,
  Pencil,
  Medal,
} from "lucide-react";

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useHalaqoh,
  useHalaqohProgress,
  HALAQOH_DAYS,
} from "@/hooks/use-takhosus";

interface HalaqohDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function HalaqohDetailPage({ params }: HalaqohDetailPageProps) {
  const { id } = use(params);
  const { data: halaqoh, isLoading: halaqohLoading } = useHalaqoh(id);
  const { data: progress, isLoading: progressLoading } = useHalaqohProgress(id);

  const getDayLabels = (days: string[]) => {
    return days
      .map((d) => HALAQOH_DAYS.find((day) => day.value === d)?.label || d)
      .join(", ");
  };

  if (halaqohLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </MainLayout>
    );
  }

  if (!halaqoh) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Halaqoh Tidak Ditemukan
          </h2>
          <p className="text-muted-foreground mb-4">
            Halaqoh yang Anda cari tidak ditemukan
          </p>
          <Button asChild>
            <Link href="/takhosus">Kembali ke Takhosus</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/takhosus">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Link>
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{halaqoh.name}</h1>
            <p className="text-muted-foreground">{halaqoh.code}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/takhosus/halaqoh/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Pembimbing</span>
            </div>
            <p className="text-lg font-semibold">
              {halaqoh.teacher?.name || "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Level</span>
            </div>
            <p className="text-lg font-semibold">Level {halaqoh.level}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Kapasitas</span>
            </div>
            <p className="text-lg font-semibold">
              {progress?.studentCount || 0} / {halaqoh.maxStudents} Santri
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Medal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Rata-rata Progress
              </span>
            </div>
            <p className="text-lg font-semibold text-green-600">
              {progress?.averageProgress || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detail Info */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jadwal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Hari</p>
                <p className="text-sm text-muted-foreground">
                  {getDayLabels(halaqoh.scheduleDay)}
                </p>
              </div>
            </div>
            {halaqoh.scheduleTime && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Waktu</p>
                  <p className="text-sm text-muted-foreground">
                    {halaqoh.scheduleTime}
                  </p>
                </div>
              </div>
            )}
            {halaqoh.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Lokasi</p>
                  <p className="text-sm text-muted-foreground">
                    {halaqoh.location}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Status Halaqoh
              </span>
              <Badge variant={halaqoh.isActive ? "default" : "secondary"}>
                {halaqoh.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Unit</span>
              <span className="font-medium">{halaqoh.unit?.name || "-"}</span>
            </div>
            {halaqoh.description && (
              <div>
                <span className="text-sm text-muted-foreground">Deskripsi</span>
                <p className="text-sm mt-1">{halaqoh.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Santri</CardTitle>
          <CardDescription>
            Santri yang terdaftar di halaqoh ini
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Santri</TableHead>
                <TableHead>Tanggal Daftar</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Sanad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {progressLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : !progress?.students || progress.students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      Belum ada santri terdaftar
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                progress.students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell>
                      {safeFormat(new Date(student.enrolledAt), "d MMM yyyy", {
                        locale: localeId,
                      })}
                    </TableCell>
                    <TableCell>{student.targetJuz} Juz</TableCell>
                    <TableCell>
                      <div className="space-y-1 w-32">
                        <Progress
                          value={student.progressPercentage}
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          {student.completedJuz}/{student.targetJuz} (
                          {student.progressPercentage}%)
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {student.sanadCount} Sanad
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
