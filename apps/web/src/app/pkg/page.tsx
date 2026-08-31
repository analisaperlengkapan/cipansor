"use client";

import { MainLayout } from "@/components/layout";
import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { usePKGEvaluations, usePKGStatistics } from "@/hooks/use-pkg";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, ArrowRight, Award, FileText, CheckCircle2 } from "lucide-react";

function PKGHistoricalPageContent() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: evaluationsData, isLoading } = usePKGEvaluations({
    page,
    limit,
    unitId: user?.unitId || undefined,
  });
  const { data: stats } = usePKGStatistics({
    unitId: user?.unitId || undefined,
  });

  const formatScore = (val: any) => {
    if (val === null || val === undefined) return "-";
    const num = typeof val === "number" ? val : Number(val);
    return isNaN(num) ? "-" : num.toFixed(1);
  };

  const evaluations = evaluationsData?.data || [];
  const pagination = evaluationsData?.pagination;
  const totalRecords = pagination?.total ?? evaluations.length;

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Migration Info Banner */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
              Arsip Historis
            </Badge>
            <h2 className="text-lg font-bold text-amber-900 dark:text-amber-200">
              Penilaian Kinerja Guru (PKG) Legasi
            </h2>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Halaman ini menyimpan arsip historis hasil evaluasi PKG guru. Untuk pengelolaan kinerja aktif terintegrasi (RPJP &rarr; Renstra &rarr; RKA &rarr; PK & SAFTI), silakan gunakan suite Kinerja.
          </p>
        </div>
        <Link href="/kinerja">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap">
            Buka Kinerja Terintegrasi <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Historical Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluasi PKG Historis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalRecords}</div>
            <p className="text-xs text-muted-foreground mt-1">Dokumen penilaian guru tersimpan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rata-Rata Nilai Akhir PKG</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats?.averageScore ? stats.averageScore.toFixed(1) : "0"} / 100
            </div>
            <p className="text-xs text-muted-foreground mt-1">Indeks capaian guru</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kategori Kinerja Dominan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.byGrade?.A ? "Amat Baik" : "Baik"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Predikat penilaian kinerja</p>
          </CardContent>
        </Card>
      </div>

      {/* Evaluasi List Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-amber-600" />
            Riwayat Penilaian PKG Guru
          </CardTitle>
          <CardDescription>
            Daftar evaluasi PKG guru historis yang tersimpan dalam sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Memuat data PKG historis...</div>
          ) : evaluations.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
              Belum ada data evaluasi PKG historis yang tersimpan.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guru / Pendidik</TableHead>
                  <TableHead>Periode PKG</TableHead>
                  <TableHead>Nilai Pedagogik</TableHead>
                  <TableHead>Nilai Akhir</TableHead>
                  <TableHead>Predikat</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold">{item.teacher?.user?.name || "Guru"}</TableCell>
                    <TableCell>{item.period?.name || "-"}</TableCell>
                    <TableCell>{formatScore(item.pedagogikScore)}</TableCell>
                    <TableCell className="font-bold text-emerald-700">{formatScore(item.totalScore)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-purple-300 text-purple-700">
                        {item.grade || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={item.status === "APPROVED" ? "bg-emerald-500" : "bg-amber-500"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <span className="text-xs text-muted-foreground">
                Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} total data)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PKGHistoricalPage() {
  return (
    <MainLayout>
      <PKGHistoricalPageContent />
    </MainLayout>
  );
}
