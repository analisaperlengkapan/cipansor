"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAtRiskStudents } from "@/hooks/use-counseling";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";

export default function RiskDashboardPage() {
  const { data: students, isLoading } = useAtRiskStudents();

  const chartData = students?.map(s => ({
    name: s.name,
    points: s.totalPoints
  })).slice(0, 10) || [];

  return (
    <MainLayout>
      <PageHeader
        title="Dashboard Risiko Siswa"
        description="Monitoring siswa dengan poin pelanggaran tinggi"
        backHref="/counseling"
      />

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Distribusi Poin Tertinggi
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="points" fill="#f59e0b" name="Poin Pelanggaran" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Ringkasan Risiko</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <span>Total Siswa Berisiko</span>
                        <span className="font-bold text-xl">{students?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                        <span>Poin Tertinggi</span>
                        <span className="font-bold text-xl text-red-600">
                            {Math.max(...(students?.map(s => s.totalPoints) || [0]))}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa Berisiko (Poin &ge; 50)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Siswa</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Total Poin</TableHead>
                <TableHead>Pelanggaran Terakhir</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">Loading...</TableCell>
                </TableRow>
              ) : students?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    Tidak ada siswa yang mencapai ambang batas risiko.
                  </TableCell>
                </TableRow>
              ) : (
                students?.map((student) => (
                  <TableRow key={student.studentId}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.className}</TableCell>
                    <TableCell>
                        <Badge variant={student.totalPoints >= 100 ? "destructive" : "secondary"} className={student.totalPoints >= 100 ? "bg-red-500" : "bg-amber-500 text-white"}>
                            {student.totalPoints} Poin
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="text-sm">
                            <div className="font-medium">{student.lastViolation?.description || "-"}</div>
                            <div className="text-xs text-muted-foreground">
                                {student.lastViolation?.occurredAt ? format(new Date(student.lastViolation.occurredAt), "dd MMM yyyy", { locale: localeId }) : "-"}
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline">Perlu Perhatian</Badge>
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
