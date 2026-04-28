"use client";

import { use } from "react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useExamMonitoring, useTopicMastery } from "@/hooks/use-cbt";
import { Loader2, UserCheck, Pencil, Calendar, BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import Link from "next/link";

export default function ExamMonitoringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: exam, isLoading } = useExamMonitoring(id);
  const { data: topicMasteryData, isLoading: loadingTopics } = useTopicMastery(id);
  const topicMastery = topicMasteryData?.items;
  const curriculumMastery = topicMasteryData?.topicMastery;
  const topicMasteryMeta = topicMasteryData?._meta;

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

        {loadingTopics && (
          <Card>
            <CardContent className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        )}

        {!loadingTopics && (topicMastery || curriculumMastery) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Curriculum-aligned Analytics (TP) */}
            {curriculumMastery && curriculumMastery.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-indigo-600" />
                    <div>
                      <CardTitle>Analisis Kurikulum (Pencapaian TP)</CardTitle>
                      <CardDescription>Rata-rata penguasaan per Tujuan Pembelajaran</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={curriculumMastery} layout="vertical" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="code" type="category" tick={{ fontSize: 10, fontWeight: "bold" }} width={70} />
                        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "Penguasaan"]} />
                        <Bar dataKey="masteryLevel" radius={[0, 4, 4, 0]} barSize={15}>
                          {curriculumMastery.map((entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.masteryLevel < 60 ? "#f43f5e" : entry.masteryLevel < 80 ? "#f59e0b" : "#10b981"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {curriculumMastery.slice(0, 2).map((m: any) => (
                      <div key={m.objectiveId} className="text-xs p-2 rounded border bg-slate-50">
                        <span className="font-bold">{m.code}:</span> {m.description}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Question-level Analytics */}
            {topicMastery && topicMastery.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-indigo-600" />
                    <div>
                      <CardTitle>Performa Butir Soal</CardTitle>
                      <CardDescription>
                        Rata-rata skor per butir soal
                        {topicMasteryMeta?.truncated && (
                          <span className="ml-2 text-amber-600 font-medium">
                            (Top {topicMasteryMeta.analyzedAttempts})
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topicMastery} layout="vertical" margin={{ left: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="code" type="category" tick={{ fontSize: 10, fontWeight: "bold" }} width={40} />
                        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "Benar"]} />
                        <Bar dataKey="masteryLevel" radius={[0, 4, 4, 0]} barSize={15}>
                          {topicMastery.map((entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.masteryLevel < 50 ? "#f43f5e" : "#3b82f6"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

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
                          : attempt.status === "EXPIRED"
                          ? "Kedaluwarsa"
                          : attempt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-lg">
                      {attempt.score ? parseFloat(attempt.score).toFixed(2) : "0"}
                    </TableCell>
                    <TableCell className="text-right">
                      {(attempt.status === "COMPLETED" || attempt.status === "NEEDS_REVIEW") ? (
                        <Link href={`/cbt/attempts/${attempt.id}/grading`}>
                          <Button variant="outline" size="sm">
                            Nilai (Manual)
                          </Button>
                        </Link>
                      ) : attempt.status === "EXPIRED" ? (
                        <Button variant="outline" size="sm" disabled title="Tidak dapat menilai ujian yang sudah kedaluwarsa">
                          Kedaluwarsa
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          Nilai (Manual)
                        </Button>
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
