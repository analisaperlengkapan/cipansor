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

        {!loadingTopics && topicMastery && topicMastery.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-600" />
                  <div>
                    <CardTitle>Analisis Penguasaan Materi (Topic Mastery)</CardTitle>
                    <CardDescription>
                      Rata-rata persentase jawaban benar per Tujuan Pembelajaran (TP)
                      {topicMasteryMeta?.truncated && (
                        <span className="ml-2 text-amber-600 font-medium">
                          (Berdasarkan {topicMasteryMeta.analyzedAttempts} percobaan pertama)
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicMastery} layout="vertical" margin={{ left: 120 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis
                        dataKey="code"
                        type="category"
                        tick={{fontSize: 12, fontWeight: 'bold'}}
                        width={100}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Tingkat Penguasaan']}
                        labelFormatter={(label) => `TP: ${label}`}
                      />
                      <Bar dataKey="masteryLevel" radius={[0, 4, 4, 0]} barSize={20}>
                        {topicMastery.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.masteryLevel < 60 ? '#f43f5e' : entry.masteryLevel < 80 ? '#f59e0b' : '#10b981'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2">
                   {topicMastery.slice(0, 3).map((topic: any) => (
                     <div key={topic.objectiveId} className={`p-3 rounded-lg border flex items-center justify-between ${topic.masteryLevel < 60 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex-1">
                           <p className="text-xs font-bold text-slate-900">{topic.code}</p>
                           <p className="text-xs text-slate-600 line-clamp-1">{topic.description}</p>
                        </div>
                        <div className="text-right ml-4">
                           <Badge variant={topic.masteryLevel < 60 ? "destructive" : "outline"}>
                             {topic.masteryLevel.toFixed(1)}%
                           </Badge>
                           {topic.masteryLevel < 60 && <p className="text-[10px] text-rose-600 font-bold mt-1 uppercase">Perlu Remedial</p>}
                        </div>
                     </div>
                   ))}
                </div>
              </CardContent>
            </Card>
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
