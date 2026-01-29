"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useAssessment,
  useGrades,
  useDeleteAssessment,
  usePublishAssessment,
  ASSESSMENT_TYPE_LABELS,
  ExamType,
  type AssessmentType,
} from "@/hooks";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Edit,
  Trash2,
  CheckCircle,
  Send,
  Users,
  BarChart3,
  BookOpen,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  FileEdit,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";
import { toast } from "sonner";

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  const [activeTab, setActiveTab] = useState("grades");

  const { data: assessment, isLoading } = useAssessment(assessmentId);
  const { data: grades, isLoading: loadingGrades } = useGrades({
    examId: assessmentId,
  });
  const deleteAssessment = useDeleteAssessment();
  const publishAssessment = usePublishAssessment();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!assessment) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Penilaian tidak ditemukan</p>
          <Button onClick={() => router.push("/assessment")}>
            Kembali ke Daftar
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteAssessment.mutateAsync(assessmentId);
      toast.success("Penilaian berhasil dihapus");
      router.push("/assessment");
    } catch (error) {
      toast.error("Gagal menghapus penilaian");
    }
  };

  const handlePublish = async () => {
    try {
      await publishAssessment.mutateAsync(assessmentId);
      toast.success("Penilaian berhasil dipublikasikan");
    } catch (error) {
      toast.error("Gagal mempublikasikan penilaian");
    }
  };

  const getAssessmentTypeBadge = (type: AssessmentType) => {
    const colors: Record<AssessmentType, string> = {
      [ExamType.DAILY_TEST]: "bg-gray-100 text-gray-800",
      [ExamType.MIDTERM]: "bg-purple-100 text-purple-800",
      [ExamType.FINAL]: "bg-red-100 text-red-800",
      [ExamType.PRACTICAL]: "bg-green-100 text-green-800",
      [ExamType.PROJECT]: "bg-yellow-100 text-yellow-800",
      [ExamType.QUIZ]: "bg-pink-100 text-pink-800",
      [ExamType.TAHFIDZ_TEST]: "bg-teal-100 text-teal-800",
    };
    return (
      <Badge className={colors[type]}>{ASSESSMENT_TYPE_LABELS[type]}</Badge>
    );
  };

  // Calculate statistics from grades
  const stats = grades?.length
    ? {
        totalStudents: grades.length,
        graded: grades.filter((g) => g.score !== null).length,
        average:
          grades
            .filter((g) => g.score !== null)
            .reduce((sum, g) => sum + (g.score ?? 0), 0) /
            grades.filter((g) => g.score !== null).length || 0,
        highest: Math.max(
          ...grades.filter((g) => g.score !== null).map((g) => g.score ?? 0),
        ),
        lowest: Math.min(
          ...grades.filter((g) => g.score !== null).map((g) => g.score ?? 0),
        ),
        passed: grades.filter(
          (g) => (g.score ?? 0) >= (assessment.passingScore ?? 70),
        ).length,
      }
    : null;

  const getGradeColor = (score: number | null) => {
    if (score === null) return "";
    const passingScore = assessment.passingScore ?? 70;
    if (score >= 90) return "text-green-600 font-bold";
    if (score >= passingScore) return "text-blue-600";
    return "text-red-600";
  };

  const getGradeTrend = (score: number | null) => {
    if (score === null || !stats) return null;
    if (score > stats.average)
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (score < stats.average)
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {assessment.title}
                </h1>
                {getAssessmentTypeBadge(assessment.type)}
              </div>
              <p className="text-muted-foreground">
                {assessment.class?.name} • {assessment.subject?.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {assessment.status === "DRAFT" && (
              <Button
                variant="outline"
                onClick={handlePublish}
                disabled={publishAssessment.isPending}
              >
                {publishAssessment.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Publikasikan
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href={`/assessment/${assessmentId}/proctoring`}>
                <FileCheck className="mr-2 h-4 w-4" />
                Berita Acara
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/assessment/${assessmentId}/grades`}>
                <FileEdit className="mr-2 h-4 w-4" />
                Input Nilai
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/assessment/${assessmentId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={assessment.status !== "DRAFT"}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Penilaian?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini tidak dapat dibatalkan. Semua data nilai yang
                    terkait juga akan dihapus.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Status Banner */}
        {assessment.status !== "DRAFT" ? (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">
              Penilaian ini sudah dipublikasikan dan nilai dapat dilihat oleh
              santri
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800">
              Penilaian masih dalam status draft. Publikasikan setelah selesai
              input nilai.
            </span>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Tanggal Pelaksanaan
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {format(new Date(assessment.scheduledAt), "d MMM", {
                  locale: idLocale,
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(assessment.scheduledAt), "EEEE, yyyy", {
                  locale: idLocale,
                })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Nilai Maksimal
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assessment.maxScore}</div>
              <p className="text-xs text-muted-foreground">
                KKM: {assessment.passingScore ?? 70}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalStudents ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.graded ?? 0} sudah dinilai
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.average.toFixed(1) ?? "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.passed ?? 0} santri lulus
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="grades">
              <ClipboardList className="mr-2 h-4 w-4" />
              Daftar Nilai
            </TabsTrigger>
            <TabsTrigger value="statistics">
              <BarChart3 className="mr-2 h-4 w-4" />
              Statistik
            </TabsTrigger>
            <TabsTrigger value="info">
              <BookOpen className="mr-2 h-4 w-4" />
              Info Penilaian
            </TabsTrigger>
          </TabsList>

          {/* Grades Tab */}
          <TabsContent value="grades" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama Santri</TableHead>
                    <TableHead className="text-center">Nilai</TableHead>
                    <TableHead className="text-center">Trend</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingGrades ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : grades?.length ? (
                    grades
                      .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
                      .map((grade, index) => (
                        <TableRow key={grade.id}>
                          <TableCell className="text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {grade.student?.nis}
                          </TableCell>
                          <TableCell className="font-medium">
                            {grade.student?.user?.name}
                          </TableCell>
                          <TableCell
                            className={`text-center ${getGradeColor(grade.score)}`}
                          >
                            {grade.score !== null ? grade.score : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            {getGradeTrend(grade.score)}
                          </TableCell>
                          <TableCell>
                            {grade.score !== null ? (
                              (grade.score ?? 0) >=
                              (assessment.passingScore ?? 70) ? (
                                <Badge
                                  variant="default"
                                  className="bg-green-500"
                                >
                                  Lulus
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Tidak Lulus</Badge>
                              )
                            ) : (
                              <Badge variant="secondary">Belum Dinilai</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                            {grade.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Belum ada data nilai
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4">
            {stats && stats.graded > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Ringkasan Nilai</CardTitle>
                    <CardDescription>Statistik penilaian</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Nilai Tertinggi
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {stats.highest}
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Nilai Terendah
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {stats.lowest}
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Rata-rata
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {stats.average.toFixed(1)}
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Persentase Lulus
                        </p>
                        <p className="text-2xl font-bold">
                          {((stats.passed / stats.graded) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribusi Nilai</CardTitle>
                    <CardDescription>Berdasarkan rentang nilai</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          label: "A (90-100)",
                          min: 90,
                          max: 100,
                          color: "bg-green-500",
                        },
                        {
                          label: "B (80-89)",
                          min: 80,
                          max: 89,
                          color: "bg-blue-500",
                        },
                        {
                          label: "C (70-79)",
                          min: 70,
                          max: 79,
                          color: "bg-yellow-500",
                        },
                        {
                          label: "D (60-69)",
                          min: 60,
                          max: 69,
                          color: "bg-orange-500",
                        },
                        {
                          label: "E (<60)",
                          min: 0,
                          max: 59,
                          color: "bg-red-500",
                        },
                      ].map((range) => {
                        const count =
                          grades?.filter(
                            (g) =>
                              g.score !== null &&
                              g.score >= range.min &&
                              g.score <= range.max,
                          ).length ?? 0;
                        const percentage =
                          stats.graded > 0 ? (count / stats.graded) * 100 : 0;
                        return (
                          <div key={range.label} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{range.label}</span>
                              <span>
                                {count} santri ({percentage.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${range.color} rounded-full transition-all`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Belum cukup data untuk menampilkan statistik
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detail Penilaian</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Nama Penilaian
                    </dt>
                    <dd className="text-lg">{assessment.title}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Tipe
                    </dt>
                    <dd>{getAssessmentTypeBadge(assessment.type)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Kelas
                    </dt>
                    <dd className="text-lg">{assessment.class?.name ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Mata Pelajaran
                    </dt>
                    <dd className="text-lg">
                      {assessment.subject?.name ?? "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Tanggal
                    </dt>
                    <dd className="text-lg">
                      {format(new Date(assessment.scheduledAt), "d MMMM yyyy", {
                        locale: idLocale,
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Semester
                    </dt>
                    <dd className="text-lg">Semester {assessment.semester}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Nilai Maksimal
                    </dt>
                    <dd className="text-lg">{assessment.maxScore}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      KKM
                    </dt>
                    <dd className="text-lg">{assessment.passingScore ?? 70}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Bobot
                    </dt>
                    <dd className="text-lg">{assessment.weight ?? 1}x</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Status
                    </dt>
                    <dd>
                      <Badge
                        variant={
                          assessment.status !== "DRAFT"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {assessment.status !== "DRAFT"
                          ? "Dipublikasikan"
                          : "Draft"}
                      </Badge>
                    </dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">
                      Deskripsi
                    </dt>
                    <dd className="text-lg">{assessment.description || "-"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
