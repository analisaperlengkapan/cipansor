"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useExams } from "@/hooks/use-cbt";
import { Plus, Search, Eye, Loader2, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function ExamsPage() {
  const [search, setSearch] = useState("");
  const { data: response, isLoading } = useExams({ search });

  const exams = response?.data || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Jadwal Ujian</h1>
            <p className="text-muted-foreground">
              Kelola jadwal dan pengawasan ujian CBT
            </p>
          </div>
          <Button asChild>
            <Link href="/cbt/exams/new">
              <Plus className="mr-2 h-4 w-4" />
              Buat Ujian
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daftar Ujian</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari ujian..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Waktu Pelaksanaan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Peserta</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : exams.length > 0 ? (
                  exams.map((exam: any) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">
                        {exam.title}
                      </TableCell>
                      <TableCell>
                        {exam.subject?.name || "-"}
                      </TableCell>
                      <TableCell>
                        {exam.class?.name || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>
                            {format(new Date(exam.scheduledAt), "dd MMM yyyy", {
                              locale: id,
                            })}
                          </span>
                          <span className="text-muted-foreground">
                            Durasi: {exam.duration} menit
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            exam.status === "COMPLETED" || exam.status === "GRADED"
                              ? "default"
                              : exam.status === "ONGOING"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {exam.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {exam._count?.attempts || 0} Siswa
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/cbt/exams/${exam.id}/monitoring`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Monitoring
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="h-8 w-8 text-muted-foreground/50" />
                        <p>Belum ada jadwal ujian</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
