"use client";

import { useState } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Utensils,
  Moon,
  BookOpen,
  MessageCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Smile,
  Meh,
  Frown,
  Thermometer
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useStudentDailySummary, useAddParentNotes } from "@/hooks/use-daily-report";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";
import { User } from "@/lib/api";

// Extended User type for Parent
interface ParentUser extends User {
  children?: { id: string; name: string; user?: { name: string } }[];
  studentId?: string;
}

// Mood Icon Helper
const MoodIcon = ({ mood, className }: { mood: string; className?: string }) => {
  switch (mood) {
    case "HAPPY":
    case "EXCITED":
      return <Smile className={cn("text-green-500", className)} />;
    case "NEUTRAL":
      return <Meh className={cn("text-yellow-500", className)} />;
    case "SAD":
    case "SICK":
    case "TIRED":
      return <Frown className={cn("text-red-500", className)} />;
    default:
      return <Meh className={cn("text-gray-400", className)} />;
  }
};

const MoodLabel = ({ mood }: { mood: string }) => {
  const labels: Record<string, string> = {
    HAPPY: "Senang",
    EXCITED: "Antusias",
    NEUTRAL: "Biasa",
    SAD: "Sedih",
    TIRED: "Lelah",
    SICK: "Sakit",
  };
  return <span>{labels[mood] || mood}</span>;
};

export default function ParentDailyReportPage() {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  const parentUser = user as unknown as ParentUser;
  const availableChildren = parentUser?.children || [];
  const defaultStudentId = parentUser?.studentId || availableChildren[0]?.id;

  const [activeStudentId, setActiveStudentId] = useState<string>(defaultStudentId || "");

  const { data: summaryData, isLoading, refetch } = useStudentDailySummary({
    studentId: activeStudentId,
    academicYearId: user?.academicYearId || "",
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
  });

  const confirmMutation = useAddParentNotes();

  const handleMonthChange = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  const handleConfirm = () => {
    if (!selectedReportId) return;

    confirmMutation.mutate(
      {
        id: selectedReportId,
        data: {
          isConfirmed: true,
          parentFeedback: feedback,
        },
      },
      {
        onSuccess: () => {
          toast.success("Laporan berhasil dikonfirmasi");
          setIsFeedbackDialogOpen(false);
          setFeedback("");
          refetch();
        },
        onError: () => {
          toast.error("Gagal mengkonfirmasi laporan");
        },
      }
    );
  };

  if (!activeStudentId) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Data Siswa Tidak Ditemukan</h2>
        <p className="text-muted-foreground">Anda belum terhubung dengan data siswa.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-5xl">
      {/* Header & Month Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buku Penghubung Digital</h1>
          <p className="text-muted-foreground">
            Pantau aktivitas harian dan perkembangan Ananda.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
          {/* Child Selector if multiple children */}
          {availableChildren.length > 1 && (
            <Select value={activeStudentId} onValueChange={setActiveStudentId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Anak" />
              </SelectTrigger>
              <SelectContent>
                {availableChildren.map((child: any) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.user?.name || child.name || "Siswa"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
            <Button variant="ghost" size="icon" onClick={() => handleMonthChange(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[140px] text-center">
              {format(currentDate, "MMMM yyyy", { locale: id })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => handleMonthChange(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistics Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Laporan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryData?.statistics.totalReports || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Hari efektif bulan ini
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Dikonfirmasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {summaryData?.statistics.confirmedByParent || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Laporan telah Anda baca
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rata-rata Mood</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">
                    {Object.entries(summaryData?.statistics.moodDistribution || {})
                      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || "-"}
                  </div>
                  {/* Show dominant mood icon */}
                </div>
                <p className="text-xs text-muted-foreground">
                  Dominasi perasaan bulan ini
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Reports List */}
          <div className="grid gap-4">
            <h3 className="font-semibold text-lg">Riwayat Harian</h3>
            {summaryData?.reports.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">Belum ada laporan untuk bulan ini.</p>
              </div>
            ) : (
              summaryData?.reports.map((report) => (
                <Card key={report.id} className={cn(
                  "overflow-hidden transition-all hover:shadow-md",
                  !report.parentReadAt && "border-l-4 border-l-blue-500"
                )}>
                  <CardHeader className="pb-3 bg-muted/30">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <CalendarIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {format(parseISO(report.reportDate as unknown as string), "EEEE, d MMMM yyyy", { locale: id })}
                          </CardTitle>
                          <CardDescription>
                            Dicatat oleh: {report.createdBy?.name || "Guru Kelas"}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={report.parentReadAt ? "outline" : "default"} className={cn(
                        report.parentReadAt ? "text-green-600 border-green-200 bg-green-50" : "bg-blue-600 hover:bg-blue-700"
                      )}>
                        {report.parentReadAt ? "Sudah Dibaca" : "Perlu Konfirmasi"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 grid gap-4 md:grid-cols-2">

                    {/* Left Column: Basic Info & Ibadah */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <MoodIcon mood={report.mood || "NEUTRAL"} className="h-5 w-5" />
                          <span className="font-medium">Mood:</span>
                          <MoodLabel mood={report.mood || "NEUTRAL"} />
                        </div>
                        <div className="h-4 w-px bg-border mx-2" />
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">Kesehatan:</span>
                          <span>{report.healthStatus || "Sehat"}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Utensils className="h-4 w-4" /> Makan & Minum
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between border p-2 rounded">
                            <span>Makan Siang</span>
                            <span className="font-medium">{report.mealStatus || "-"}</span>
                          </div>
                          <div className="flex justify-between border p-2 rounded">
                            <span>Snack</span>
                            <span className="font-medium">{report.snackStatus || "-"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" /> Mutabaah Ibadah
                        </h4>
                        <div className="grid grid-cols-4 gap-2">
                          {['Dhuha', 'Dzuhur', 'Ashar', 'Jamaah'].map((prayer) => {
                            const key = `sholat${prayer}` as keyof typeof report;
                            const isDone = !!report[key];
                            return (
                              <div key={prayer} className={cn(
                                "flex flex-col items-center justify-center p-2 rounded border text-xs",
                                isDone ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                              )}>
                                <span className="font-bold">{prayer}</span>
                                {isDone ? <CheckCircle2 className="h-4 w-4 mt-1" /> : <span className="text-[10px] mt-1">Tidak</span>}
                              </div>
                            );
                          })}
                        </div>
                        {report.tahfidzActivity && (
                          <div className="bg-blue-50 p-2 rounded border border-blue-100 text-sm mt-2">
                            <span className="font-semibold text-blue-700">Tahfidz: </span>
                            {report.tahfidzActivity}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Activities & Notes */}
                    <div className="space-y-4">
                      {report.activitiesSummary && (
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <BookOpen className="h-4 w-4" /> Ringkasan Kegiatan
                          </h4>
                          <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg min-h-[60px]">
                            {report.activitiesSummary}
                          </div>
                        </div>
                      )}

                      {report.teacherNotes && (
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold flex items-center gap-2 text-orange-600">
                            <MessageCircle className="h-4 w-4" /> Catatan Guru
                          </h4>
                          <div className="text-sm bg-orange-50 border border-orange-100 p-3 rounded-lg text-orange-800">
                            {report.teacherNotes}
                          </div>
                        </div>
                      )}

                      {/* Display Parent Feedback / Home Activity */}
                      {report.homeActivity && (
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold flex items-center gap-2 text-blue-600">
                            <MessageCircle className="h-4 w-4" /> Kegiatan di Rumah / Tanggapan
                          </h4>
                          <div className="text-sm bg-blue-50 border border-blue-100 p-3 rounded-lg text-blue-800 whitespace-pre-wrap">
                            {report.homeActivity}
                          </div>
                        </div>
                      )}

                      {/* Display homework if any */}
                      {report.homework && (report.homework as any[]).length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold flex items-center gap-2 text-purple-600">
                            <BookOpen className="h-4 w-4" /> PR / Tugas
                          </h4>
                          <ul className="text-sm list-disc list-inside bg-purple-50 border border-purple-100 p-3 rounded-lg text-purple-800">
                            {(report.homework as any[]).map((hw, idx) => (
                              <li key={idx}>
                                <strong>{hw.subjectName}:</strong> {hw.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                  </CardContent>
                  <CardFooter className="bg-muted/10 flex justify-end pt-2 pb-4 px-6">
                    {!report.parentReadAt ? (
                      <Dialog open={isFeedbackDialogOpen && selectedReportId === report.id} onOpenChange={(open) => {
                        setIsFeedbackDialogOpen(open);
                        if (!open) setSelectedReportId(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button onClick={() => setSelectedReportId(report.id)}>
                            Konfirmasi & Beri Balasan
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Konfirmasi Laporan Harian</DialogTitle>
                            <DialogDescription>
                              Anda mengkonfirmasi bahwa telah membaca laporan tanggal {format(parseISO(report.reportDate as unknown as string), "d MMMM yyyy", { locale: id })}.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <label className="text-sm font-medium mb-2 block">
                              Catatan Balasan (Opsional)
                            </label>
                            <Textarea
                              placeholder="Terima kasih Bu Guru, Ananda cerita senang sekali hari ini..."
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                            />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)}>Batal</Button>
                            <Button onClick={handleConfirm} disabled={confirmMutation.isPending}>
                              {confirmMutation.isPending && <Clock className="mr-2 h-4 w-4 animate-spin" />}
                              Kirim Konfirmasi
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Dikonfirmasi pada {format(parseISO(report.parentReadAt as unknown as string), "d MMM yyyy HH:mm", { locale: id })}
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
