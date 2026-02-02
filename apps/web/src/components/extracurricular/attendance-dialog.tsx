"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, ClipboardCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AttendanceStatus } from "@cipansor/shared";

import {
  useExtracurricularEnrollments,
  useRecordExtracurricularAttendance,
} from "@/hooks/use-extracurricular";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface AttendanceDialogProps {
  extracurricularId: string;
}

export function AttendanceDialog({ extracurricularId }: AttendanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());

  // Local state for attendance records
  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});

  const { data: enrollments, isLoading: isLoadingEnrollments } = useExtracurricularEnrollments(
    extracurricularId,
    { status: "APPROVED" } // Only fetch active/approved students
  );

  const recordMutation = useRecordExtracurricularAttendance();

  // Initialize records when enrollments load
  useEffect(() => {
    if (enrollments) {
      const initialRecords: Record<string, { status: AttendanceStatus; notes: string }> = {};
      enrollments.forEach((enrollment) => {
        // Only include active students if the API returns mixed statuses despite params
        if (enrollment.status === 'APPROVED') {
           initialRecords[enrollment.studentId] = {
            status: AttendanceStatus.PRESENT,
            notes: "",
          };
        }
      });
      setRecords(initialRecords);
    }
  }, [enrollments]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes },
    }));
  };

  const handleSubmit = async () => {
    const attendances = Object.entries(records).map(([studentId, data]) => ({
      studentId,
      status: data.status,
      notes: data.notes,
    }));

    if (attendances.length === 0) {
      toast.error("Tidak ada siswa untuk diabsen");
      return;
    }

    try {
      await recordMutation.mutateAsync({
        extracurricularId,
        date: date.toISOString(),
        attendances,
      });
      toast.success("Absensi berhasil disimpan");
      setOpen(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Gagal menyimpan absensi";
      toast.error(msg);
    }
  };

  const activeEnrollments = enrollments?.filter(e => e.status === 'APPROVED') || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Input Absensi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Input Absensi Kegiatan</DialogTitle>
          <DialogDescription>
            Catat kehadiran siswa untuk kegiatan ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col space-y-2">
            <Label>Tanggal Kegiatan</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] pl-3 text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  {date ? (
                    format(date, "PPP", { locale: localeId })
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingEnrollments ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : activeEnrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Tidak ada siswa aktif.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.studentId}>
                      <TableCell className="font-medium">
                        {enrollment.student?.name}
                      </TableCell>
                      <TableCell>
                        {enrollment.student?.currentClass?.name || "-"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={records[enrollment.studentId]?.status || AttendanceStatus.PRESENT}
                          onValueChange={(val) =>
                            handleStatusChange(enrollment.studentId, val as AttendanceStatus)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={AttendanceStatus.PRESENT}>Hadir</SelectItem>
                            <SelectItem value={AttendanceStatus.ABSENT}>Alpa</SelectItem>
                            <SelectItem value={AttendanceStatus.LATE}>Terlambat</SelectItem>
                            <SelectItem value={AttendanceStatus.SICK}>Sakit</SelectItem>
                            <SelectItem value={AttendanceStatus.EXCUSED}>Izin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Catatan..."
                          value={records[enrollment.studentId]?.notes || ""}
                          onChange={(e) =>
                            handleNotesChange(enrollment.studentId, e.target.value)
                          }
                          className="h-8"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={recordMutation.isPending || activeEnrollments.length === 0}>
            {recordMutation.isPending ? "Menyimpan..." : "Simpan Absensi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
