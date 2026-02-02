"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useStaffAttendances,
  useStaffAttendanceSummary,
  STAFF_ATTENDANCE_STATUS_LABELS,
  StaffAttendanceStatus,
} from "@/hooks";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id } from "date-fns/locale";
import { Loader2, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";

interface AttendanceTabProps {
  staffId: string; // This is the STAFF ID, not USER ID. EmployeeDetailPage usually has Employee object which might need mapping.
}

export function AttendanceTab({ staffId }: AttendanceTabProps) {
  const now = new Date();
  const [month, setMonth] = useState<string>(String(now.getMonth() + 1));
  const [year, setYear] = useState<string>(String(now.getFullYear()));

  const startDate = format(
    startOfMonth(new Date(parseInt(year), parseInt(month) - 1)),
    "yyyy-MM-dd"
  );
  const endDate = format(
    endOfMonth(new Date(parseInt(year), parseInt(month) - 1)),
    "yyyy-MM-dd"
  );

  const { data: attendanceData, isLoading } = useStaffAttendances({
    staffId, // Ensure the parent passes the correct STAFF ID (from Staff model), not generic User ID
    startDate,
    endDate,
    limit: 31,
  });

  const { data: summary, isLoading: loadingSummary } = useStaffAttendanceSummary(
    staffId,
    parseInt(month),
    parseInt(year)
  );

  const attendances = attendanceData?.data || [];

  const getStatusBadge = (status: StaffAttendanceStatus) => {
    const colors: Record<StaffAttendanceStatus, string> = {
      PRESENT: "bg-green-100 text-green-800",
      LATE: "bg-yellow-100 text-yellow-800",
      ABSENT: "bg-red-100 text-red-800",
      LEAVE: "bg-blue-100 text-blue-800",
      SICK: "bg-purple-100 text-purple-800",
    };
    return (
      <Badge className={colors[status]}>
        {STAFF_ATTENDANCE_STATUS_LABELS[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Bulan" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <SelectItem key={m} value={String(m)}>
                {format(new Date(2024, m - 1, 1), "MMMM", { locale: id })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Tahun" />
          </SelectTrigger>
          <SelectContent>
            {[2023, 2024, 2025, 2026].map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Hadir
                </p>
                <div className="text-2xl font-bold">
                  {summary?.summary?.PRESENT || 0}
                </div>
              </div>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Terlambat
                </p>
                <div className="text-2xl font-bold">
                  {summary?.summary?.LATE || 0}
                </div>
              </div>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Izin/Sakit
                </p>
                <div className="text-2xl font-bold">
                  {(summary?.summary?.LEAVE || 0) +
                    (summary?.summary?.SICK || 0)}
                </div>
              </div>
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Alpa
                </p>
                <div className="text-2xl font-bold">
                  {summary?.summary?.ABSENT || 0}
                </div>
              </div>
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Absensi</CardTitle>
          <CardDescription>
            Catatan kehadiran periode{" "}
            {format(new Date(parseInt(year), parseInt(month) - 1), "MMMM yyyy", {
              locale: id,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Hari</TableHead>
                  <TableHead>Jam Masuk</TableHead>
                  <TableHead>Jam Pulang</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : attendances.length > 0 ? (
                  attendances.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {format(new Date(item.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.date), "EEEE", { locale: id })}
                      </TableCell>
                      <TableCell>
                        {item.checkIn
                          ? format(new Date(item.checkIn), "HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {item.checkOut
                          ? format(new Date(item.checkOut), "HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.notes || "-"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Tidak ada data absensi pada periode ini
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
