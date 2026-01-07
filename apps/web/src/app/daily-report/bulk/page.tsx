"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Loader2,
  Save,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useClasses } from "@/hooks/use-classes";
import { useAuthStore } from "@/stores/auth";

// Types for the form state
interface StudentReportState {
  studentId: string;
  studentName: string;
  morningMood: "HAPPY" | "NEUTRAL" | "SAD" | "TIRED" | "EXCITED" | "SICK";
  lunchConsumption: "HABIS" | "SETENGAH" | "SEDIKIT" | "TIDAK_MAU";
  napDurationMinutes: number;
  notes: string;
}

export default function BulkDailyReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const classId = searchParams.get("classId");
  const [date, setDate] = useState<Date>(new Date());
  const [reports, setReports] = useState<Record<string, StudentReportState>>({});

  // Fetch classes for selection
  const { data: classesData, isLoading: isLoadingClasses } = useClasses({
    unitId: user?.unitId,
  });

  // Fetch students when class is selected
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["class-enrollments", classId],
    queryFn: async () => {
      if (!classId) return null;
      const res = await fetch(`/api/classes/${classId}/enrollments`);
      if (!res.ok) throw new Error("Failed to fetch students");
      const json = await res.json();
      return json.data; // Assuming response structure { data: Enrollment[] }
    },
    enabled: !!classId,
  });

  // Initialize form state when students are loaded
  if (studentsData && Object.keys(reports).length === 0 && studentsData.length > 0) {
    const initialReports: Record<string, StudentReportState> = {};
    studentsData.forEach((enrollment: any) => {
      initialReports[enrollment.student.id] = {
        studentId: enrollment.student.id,
        studentName: enrollment.student.user.name, // Access flattened name
        morningMood: "HAPPY",
        lunchConsumption: "HABIS",
        napDurationMinutes: 0,
        notes: "",
      };
    });
    setReports(initialReports);
  }

  // Mutation for bulk create
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/daily-report/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit reports");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Berhasil menyimpan ${data.data.created} laporan.`);
      if (data.data.failed > 0) {
        toast.warning(`${data.data.failed} laporan gagal disimpan.`);
      }
      router.push("/daily-report"); // Redirect to list
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleUpdate = (studentId: string, field: keyof StudentReportState, value: any) => {
    setReports((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = () => {
    if (!classId) return;

    // Transform state to API input
    const payload = {
      unitId: user?.unitId,
      academicYearId: user?.academicYearId, // Assuming user context has this
      reportDate: date,
      reports: Object.values(reports).map((r) => ({
        studentId: r.studentId,
        morningMood: r.morningMood,
        lunchConsumption: r.lunchConsumption,
        napDurationMinutes: r.napDurationMinutes,
        parentNotes: r.notes, // Mapping notes to teacher/parent notes field
        // Defaults for required fields not in bulk view
        healthNotes: "Sehat",
        breakfastConsumption: "FULL",
        activitiesSummary: "Mengikuti kegiatan dengan baik",
        ibadahNotes: "-",
      })),
    };

    createMutation.mutate(payload);
  };

  const handleClassChange = (newClassId: string) => {
    router.push(`/daily-report/bulk?classId=${newClassId}`);
    setReports({}); // Reset state
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Input Laporan Harian Massal</h1>
          <p className="text-muted-foreground">
            Isi laporan harian untuk satu kelas sekaligus.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
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

          <Select value={classId || ""} onValueChange={handleClassChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Kelas" />
            </SelectTrigger>
            <SelectContent>
              {classesData?.data?.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa</CardTitle>
          <CardDescription>
            Silakan lengkapi data mood, makan siang, dan tidur siang untuk setiap siswa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!classId ? (
            <div className="text-center py-10 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Silakan pilih kelas terlebih dahulu.</p>
            </div>
          ) : isLoadingStudents ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : studentsData?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>Tidak ada siswa di kelas ini.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Nama Siswa</TableHead>
                    <TableHead>Mood Pagi</TableHead>
                    <TableHead>Makan Siang</TableHead>
                    <TableHead>Tidur Siang (menit)</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsData?.map((enrollment: any) => {
                    const studentId = enrollment.student.id;
                    const report = reports[studentId];
                    if (!report) return null;

                    return (
                      <TableRow key={studentId}>
                        <TableCell className="font-medium">
                          {enrollment.student.user.name}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={report.morningMood}
                            onValueChange={(val: any) => handleUpdate(studentId, "morningMood", val)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HAPPY">😊 Senang</SelectItem>
                              <SelectItem value="NEUTRAL">😐 Biasa</SelectItem>
                              <SelectItem value="SAD">😢 Sedih</SelectItem>
                              <SelectItem value="TIRED">😴 Lelah</SelectItem>
                              <SelectItem value="EXCITED">🤩 Antusias</SelectItem>
                              <SelectItem value="SICK">🤒 Sakit</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={report.lunchConsumption}
                            onValueChange={(val: any) => handleUpdate(studentId, "lunchConsumption", val)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HABIS">Habis</SelectItem>
                              <SelectItem value="SETENGAH">Setengah</SelectItem>
                              <SelectItem value="SEDIKIT">Sedikit</SelectItem>
                              <SelectItem value="TIDAK_MAU">Tidak Mau</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            className="w-[80px]"
                            value={report.napDurationMinutes}
                            onChange={(e) => handleUpdate(studentId, "napDurationMinutes", parseInt(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Catatan singkat..."
                            value={report.notes}
                            onChange={(e) => handleUpdate(studentId, "notes", e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!classId || isLoadingStudents || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Laporan ({studentsData?.length || 0})
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
