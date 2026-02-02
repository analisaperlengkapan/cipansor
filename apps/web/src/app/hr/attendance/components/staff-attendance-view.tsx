"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useStaffAttendances,
  useUnits,
  STAFF_ATTENDANCE_STATUS_LABELS,
  StaffAttendanceStatus,
} from "@/hooks";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Search,
  Users,
  XCircle,
  Plus,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { BulkAttendanceForm } from "./bulk-attendance-form";

export function StaffAttendanceView() {
  const [date, setDate] = useState<Date>(new Date());
  const [unitFilter, setUnitFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Queries
  const { data: attendanceData, isLoading, refetch } = useStaffAttendances({
    startDate: format(date, "yyyy-MM-dd"),
    endDate: format(date, "yyyy-MM-dd"),
    limit: 100, // Fetch more for daily view
  });

  const { data: units } = useUnits();

  const attendances = attendanceData?.data || [];

  // Stats
  const stats = {
    present: attendances.filter((a) => a.status === "PRESENT").length,
    late: attendances.filter((a) => a.status === "LATE").length,
    absent: attendances.filter((a) => a.status === "ABSENT").length,
    leave: attendances.filter(
      (a) => a.status === "LEAVE" || a.status === "SICK",
    ).length,
  };

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

  // Filtered Data
  const filteredAttendances = attendances.filter((item) => {
    if (unitFilter && item.staff?.unitId !== unitFilter) return false;
    if (search) {
      return item.staff?.fullName.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {/* Title removed here to be flexible in embedding */}
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? (
                  format(date, "PPP", { locale: id })
                ) : (
                  <span>Pilih Tanggal</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Absensi Massal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Absensi Massal</DialogTitle>
              </DialogHeader>
              <BulkAttendanceForm
                onSuccess={() => {
                  setIsBulkOpen(false);
                  refetch();
                }}
                onCancel={() => setIsBulkOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hadir</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.present}</div>
            <p className="text-xs text-muted-foreground">Karyawan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.late}</div>
            <p className="text-xs text-muted-foreground">Karyawan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Izin/Sakit</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leave}</div>
            <p className="text-xs text-muted-foreground">Karyawan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Absen (Alpha)
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.absent}</div>
            <p className="text-xs text-muted-foreground">Karyawan</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama karyawan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Unit</SelectItem>
                {units?.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Karyawan</TableHead>
                  <TableHead>Unit</TableHead>
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
                ) : filteredAttendances.length ? (
                  filteredAttendances.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.staff?.fullName}
                      </TableCell>
                      <TableCell>{item.staff?.unit?.name || "-"}</TableCell>
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
                      <TableCell
                        className="max-w-[200px] truncate"
                        title={item.notes || ""}
                      >
                        {item.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Belum ada data absensi untuk tanggal ini
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
