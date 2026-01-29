"use client";

import { usePermitStats } from "@/hooks/use-permits";
import { useViolationSummary } from "@/hooks/use-violations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CalendarClock, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function KesantrianDashboardPage() {
  const { data: permitStats, isLoading: permitLoading } = usePermitStats();
  const { data: violationSummary, isLoading: violationLoading } =
    useViolationSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard Kesantrian
          </h1>
          <p className="text-muted-foreground">
            Overview kedisiplinan dan perizinan santri
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Active Permits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Santri Izin</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {permitLoading ? "..." : permitStats?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">Sedang diluar pondok</p>
          </CardContent>
        </Card>

        {/* Pending Permits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Izin Menunggu</CardTitle>
            <CalendarClock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {permitLoading ? "..." : permitStats?.pending || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Butuh persetujuan segera
            </p>
          </CardContent>
        </Card>

        {/* Total Violations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggaran</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {violationLoading ? "..." : violationSummary?.totalViolations || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total tercatat</p>
          </CardContent>
        </Card>

        {/* Completed Permits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Izin Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {permitLoading ? "..." : permitStats?.completed || 0}
            </div>
            <p className="text-xs text-muted-foreground">Riwayat izin</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Violators */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Santri dengan Poin Tertinggi</CardTitle>
          </CardHeader>
          <CardContent>
            {violationLoading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead className="text-right">Poin</TableHead>
                    <TableHead className="text-right">Kasus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violationSummary?.topStudents?.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{student.points}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {student.count}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!violationSummary?.topStudents ||
                    violationSummary.topStudents.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Violation Types */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Jenis Pelanggaran Terbanyak</CardTitle>
          </CardHeader>
          <CardContent>
            {violationLoading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violationSummary?.topViolationTypes?.map((type) => (
                    <TableRow key={type.violationTypeId}>
                      <TableCell>{type.name}</TableCell>
                      <TableCell className="text-right">{type.count}</TableCell>
                    </TableRow>
                  ))}
                  {(!violationSummary?.topViolationTypes ||
                    violationSummary.topViolationTypes.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center text-muted-foreground"
                      >
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
