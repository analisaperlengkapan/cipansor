"use client";

import { use } from "react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useExamMonitoring } from "@/hooks/use-cbt";
import { Loader2, UserCheck, Pencil, Calendar } from "lucide-react";
import Link from "next/link";

export default function ExamMonitoringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: exam, isLoading } = useExamMonitoring(id);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!exam) {
    return (
      <MainLayout>
        <p>Jadwal Ujian tidak ditemukan</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Monitoring Ujian</h1>
            <p className="text-muted-foreground">
              {exam.title}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/cbt/exams">Kembali</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Ujian</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exam.status}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Siswa Selesai</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {exam.attempts?.filter((a: any) => a.status === "COMPLETED" || a.status === "NEEDS_REVIEW").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Siswa Mengerjakan</CardTitle>
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {exam.attempts?.filter((a: any) => a.status === "IN_PROGRESS").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Peserta Ujian</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {exam.attempts?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Peserta</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>Status Pengerjaan</TableHead>
                  <TableHead>Skor Sementara</TableHead>
                  <TableHead className="text-right">Aksi Penilaian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exam.attempts?.map((attempt: any) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium">
                      {attempt.student?.user?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          attempt.status === "COMPLETED"
                            ? "default"
                            : attempt.status === "NEEDS_REVIEW"
                            ? "destructive"
                            : attempt.status === "IN_PROGRESS"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {attempt.status === "COMPLETED"
                          ? "Selesai"
                          : attempt.status === "NEEDS_REVIEW"
                          ? "Butuh Review"
                          : attempt.status === "IN_PROGRESS"
                          ? "Sedang Mengerjakan"
                          : attempt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-lg">
                      {attempt.score ? parseFloat(attempt.score).toFixed(2) : "0"}
                    </TableCell>
                    <TableCell className="text-right">
                      {attempt.status === "IN_PROGRESS" || attempt.status === "EXPIRED" ? (
                        <Button variant="outline" size="sm" disabled>
                          Nilai (Manual)
                        </Button>
                      ) : (
                        <Link href={`/cbt/attempts/${attempt.id}/grading`}>
                          <Button variant="outline" size="sm">
                            Nilai (Manual)
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
