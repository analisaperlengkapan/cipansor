"use client";

import { useStudent360 } from "@/hooks/use-analytics";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  MessageSquare,
  HeartPulse,
  Wallet,
  Loader2,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { use } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

export default function Student360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: student, isLoading, error } = useStudent360(id);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader title="Student 360 View" description="Holistic student performance analysis" />
        <Card className="mt-8 border-destructive">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">Gagal memuat data santri. Silakan coba lagi nanti.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const attendanceData = [
    { name: 'Hadir', value: student.attendance.summary.present, color: '#10b981' },
    { name: 'Izin', value: student.attendance.summary.excused, color: '#3b82f6' },
    { name: 'Sakit', value: student.attendance.summary.sick, color: '#f59e0b' },
    { name: 'Alpa', value: student.attendance.summary.absent, color: '#ef4444' },
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{student.profile.name}</h1>
          <p className="text-muted-foreground">
            NIS: {student.profile.nis} • {student.profile.unit} • {student.profile.class}
          </p>
        </div>
        <Badge variant={student.finance.paymentStatus === 'CLEAR' ? 'success' : 'warning'} className="text-sm py-1 px-3">
          Status Keuangan: {student.finance.paymentStatus}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" /> Academic Avg
            </CardDescription>
            <CardTitle className="text-2xl">{student.academic.averageScore}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={student.academic.averageScore} className="h-1" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-500" /> Tahfidz
            </CardDescription>
            <CardTitle className="text-2xl">{student.tahfidz.totalJuz} Juz</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={student.tahfidz.progress} className="h-1" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-500" /> Attendance
            </CardDescription>
            <CardTitle className="text-2xl">
              {((student.attendance.summary.present / 30) * 100).toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(student.attendance.summary.present / 30) * 100} className="h-1" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-rose-500" /> Outstanding
            </CardDescription>
            <CardTitle className="text-2xl">
              Rp {student.finance.outstandingAmount.toLocaleString('id-ID')}
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-xs text-muted-foreground">Last 5 invoices shown below</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="academic" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 mb-8">
          <TabsTrigger value="academic"><GraduationCap className="h-4 w-4 mr-2" /> Akademik</TabsTrigger>
          <TabsTrigger value="tahfidz"><BookOpen className="h-4 w-4 mr-2" /> Tahfidz</TabsTrigger>
          <TabsTrigger value="attendance"><Calendar className="h-4 w-4 mr-2" /> Kehadiran</TabsTrigger>
          <TabsTrigger value="counseling"><MessageSquare className="h-4 w-4 mr-2" /> Konseling</TabsTrigger>
          <TabsTrigger value="health"><HeartPulse className="h-4 w-4 mr-2" /> Kesehatan</TabsTrigger>
          <TabsTrigger value="finance"><Wallet className="h-4 w-4 mr-2" /> Keuangan</TabsTrigger>
        </TabsList>

        <TabsContent value="academic">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Nilai Terakhir</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={student.academic.recentGrades}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="subject.name" hide />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Daftar Nilai</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {student.academic.recentGrades.map((g: any, i: number) => (
                    <div key={i} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{g.subject.name}</p>
                        <p className="text-xs text-muted-foreground">{g.type}</p>
                      </div>
                      <Badge variant={Number(g.score) >= 75 ? "secondary" : "destructive"}>
                        {g.score}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tahfidz">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Setoran Hafalan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {student.tahfidz.recentRecords.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">Surah {r.surahName}</p>
                      <p className="text-xs text-muted-foreground">Ayat {r.ayahStart}-{r.ayahEnd} • Juz {r.juz}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{r.activityType}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(r.recordedAt), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
           <Card>
            <CardHeader>
              <CardTitle>Distribusi Kehadiran (30 Hari Terakhir)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="counseling">
          <div className="space-y-6">
            {student.counseling.summaries.length > 0 && (
              <Card className="bg-blue-50 border-blue-100">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" /> Psychological Observations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2 text-blue-900">
                    {student.counseling.summaries.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Sesi Konseling Terakhir</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {student.counseling.recentSessions.map((s: any, i: number) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <Badge variant="outline">{s.category}</Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(s.scheduledAt), 'dd MMM yyyy')}</span>
                      </div>
                      <p className="font-bold">{s.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                      <p className="text-xs mt-2 italic text-muted-foreground">Konselor: {s.counselor.user.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Pertumbuhan Siswa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={student.health.growthTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" hide />
                      <YAxis yAxisId="left" label={{ value: 'Berat (kg)', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Tinggi (cm)', angle: 90, position: 'insideRight' }} />
                      <Tooltip />
                      <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#10b981" name="Berat" />
                      <Line yAxisId="right" type="monotone" dataKey="height" stroke="#3b82f6" name="Tinggi" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Catatan Medis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {student.health.recentRecords.map((m: any, i: number) => (
                    <div key={i} className="border-b pb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold uppercase text-muted-foreground">{m.type}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(m.visitDate), 'dd MMM yyyy')}</span>
                      </div>
                      <p className="text-sm font-medium">Keluhan: {m.complaint}</p>
                      <p className="text-sm mt-1">Diagnosis: {m.diagnosis || '-'}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finance">
           <Card>
            <CardHeader>
              <CardTitle>Tagihan & Pembayaran Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {student.finance.recentInvoices.map((inv: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">Jatuh Tempo: {format(new Date(inv.dueDate), 'dd MMM yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">Rp {Number(inv.amount).toLocaleString('id-ID')}</p>
                      <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'}>{inv.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
