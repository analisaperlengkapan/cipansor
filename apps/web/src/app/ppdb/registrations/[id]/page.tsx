"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useRegistration,
  useUpdateRegistrationStatus,
  useAcceptRegistration,
  useRejectRegistration,
  useScheduleTest,
  useRecordTestResult,
  useOnboardRegistrant,
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_COLORS,
  RegistrationStatus,
} from "@/hooks/use-admissions";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  MapPin,
  MoreVertical,
  User,
  Users,
  XCircle,
  Clock,
  ExternalLink,
  GraduationCap,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

export default function RegistrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: registration, isLoading } = useRegistration(id);

  const updateStatus = useUpdateRegistrationStatus();
  const acceptRegistration = useAcceptRegistration();
  const rejectRegistration = useRejectRegistration();
  const scheduleTest = useScheduleTest();
  const recordTest = useRecordTestResult();
  const onboardRegistrant = useOnboardRegistrant();

  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);

  // Form states
  const [notes, setNotes] = useState("");
  const [testDate, setTestDate] = useState("");
  const [testScore, setTestScore] = useState("");

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!registration) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Data Tidak Ditemukan</h2>
          <Button variant="outline" onClick={() => router.back()}>
            Kembali
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handleStatusChange = async (status: RegistrationStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(
        `Status berhasil diubah ke ${REGISTRATION_STATUS_LABELS[status]}`,
      );
    } catch (error) {
      toast.error("Gagal mengubah status");
    }
  };

  const handleAccept = async () => {
    try {
      await acceptRegistration.mutateAsync({ id, notes });
      setAcceptDialogOpen(false);
      toast.success("Pendaftar berhasil diterima");
      // Here we could also trigger bill creation if needed
    } catch (error) {
      toast.error("Gagal menerima pendaftar");
    }
  };

  const handleReject = async () => {
    try {
      await rejectRegistration.mutateAsync({ id, reason: notes });
      setRejectDialogOpen(false);
      toast.success("Pendaftar ditolak");
    } catch (error) {
      toast.error("Gagal menolak pendaftar");
    }
  };

  const handleScheduleTest = async () => {
    try {
      await scheduleTest.mutateAsync({
        id,
        testDate: new Date(testDate).toISOString(),
        notes,
      });
      setTestDialogOpen(false);
      toast.success("Jadwal tes berhasil disimpan");
    } catch (error) {
      toast.error("Gagal menjadwalkan tes");
    }
  };

  const handleRecordScore = async () => {
    try {
      await recordTest.mutateAsync({ id, score: Number(testScore), notes });
      setScoreDialogOpen(false);
      toast.success("Nilai tes berhasil disimpan");
    } catch (error) {
      toast.error("Gagal menyimpan nilai");
    }
  };

  const handleOnboardE2E = async () => {
    try {
      await onboardRegistrant.mutateAsync({
        registrantId: id,
        unitId: registration.unitId,
        academicYearId: registration.period?.academicYearId || "",
        // TODO: The UI should probably let admins select standard class, but we can default for now
        // For E2E mockup, we will assume the parent user ID is retrievable or mock it if not present
        parentUserId: "mocked-parent-id", // In real scenario, fetch parent userId from registration.fatherEmail etc
      });
      toast.success("Siswa berhasil di-Onboard secara terpadu! (Siswa, Medis, Tagihan Terbuat)");
      // Force status update to ENROLLED
      await updateStatus.mutateAsync({ id, status: "ENROLLED" });
    } catch (error) {
      toast.error("Gagal melakukan Onboarding Terpadu.");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  {registration.fullName}
                </h1>
                <Badge
                  className={REGISTRATION_STATUS_COLORS[registration.status]}
                >
                  {REGISTRATION_STATUS_LABELS[registration.status]}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  {registration.registrationNumber}
                </span>
                <span>•</span>
                <span>{registration.unit?.name}</span>
                <span>•</span>
                <Clock className="h-3 w-3 inline mr-1" />
                {format(new Date(registration.createdAt), "d MMM yyyy HH:mm", {
                  locale: idLocale,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Action Buttons based on Status */}
            {registration.status === "SUBMITTED" && (
              <Button
                onClick={() => handleStatusChange("DOCUMENT_REVIEW")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Mulai Review Dokumen
              </Button>
            )}

            {registration.status === "DOCUMENT_REVIEW" && (
              <Button onClick={() => setTestDialogOpen(true)} variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Jadwalkan Tes
              </Button>
            )}

            {registration.status === "TEST_SCHEDULED" && (
              <Button
                onClick={() => setScoreDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Input Nilai Tes
              </Button>
            )}

            {(registration.status === "TEST_COMPLETED" ||
              registration.status === "INTERVIEW_COMPLETED") && (
              <Button
                onClick={() => setAcceptDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Terima Santri
              </Button>
            )}

            {registration.status === "ACCEPTED" && !registration.enrolledAt && (
              <Button onClick={handleOnboardE2E} className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Eksekusi Onboarding Terpadu (E2E)
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Aksi Lainnya</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => window.print()}>
                  Cetak Formulir
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setRejectDialogOpen(true)}
                  className="text-red-600"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Tolak Pendaftaran
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Data Diri</TabsTrigger>
            <TabsTrigger value="parents">Data Orang Tua</TabsTrigger>
            <TabsTrigger value="documents">Dokumen</TabsTrigger>
            <TabsTrigger value="process">Proses Seleksi</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Informasi Calon Santri
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Nama Lengkap
                  </Label>
                  <p className="font-medium text-lg">{registration.fullName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Nama Panggilan
                  </Label>
                  <p className="font-medium">{registration.nickname || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Jenis Kelamin
                  </Label>
                  <p className="font-medium">
                    {registration.gender === "MALE" ? "Laki-laki" : "Perempuan"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Tempat, Tanggal Lahir
                  </Label>
                  <p className="font-medium">
                    {registration.birthPlace},{" "}
                    {format(new Date(registration.birthDate), "d MMMM yyyy", {
                      locale: idLocale,
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                    NIK
                  </Label>
                  <p className="font-medium font-mono">
                    {registration.nationalId || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Asal Sekolah
                  </Label>
                  <p className="font-medium">
                    {registration.previousSchool || "-"}
                  </p>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Alamat
                  </Label>
                  <p className="font-medium">{registration.address}</p>
                  <p className="text-muted-foreground text-sm">
                    {registration.village}, {registration.district},{" "}
                    {registration.city}, {registration.province}{" "}
                    {registration.postalCode}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parents">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Data Ayah
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                      Nama
                    </Label>
                    <p className="font-medium">{registration.fatherName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                      Pekerjaan
                    </Label>
                    <p className="font-medium">
                      {registration.fatherOccupation || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                      No. HP
                    </Label>
                    <p className="font-medium">
                      {registration.fatherPhone || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                      Email
                    </Label>
                    <p className="font-medium">
                      {registration.fatherEmail || "-"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-pink-600" />
                    Data Ibu
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                      Nama
                    </Label>
                    <p className="font-medium">{registration.motherName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                      Pekerjaan
                    </Label>
                    <p className="font-medium">
                      {registration.motherOccupation || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                      No. HP
                    </Label>
                    <p className="font-medium">
                      {registration.motherPhone || "-"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Dokumen Persyaratan</CardTitle>
                <CardDescription>
                  Klik link untuk melihat atau mengunduh dokumen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Pas Foto", url: registration.photoUrl },
                    {
                      label: "Akte Kelahiran",
                      url: registration.birthCertificateUrl,
                    },
                    {
                      label: "Kartu Keluarga",
                      url: registration.familyCardUrl,
                    },
                    { label: "Ijazah / SKL", url: registration.diplomaUrl },
                    {
                      label: "Surat Keterangan Sehat",
                      url: registration.healthCertificateUrl,
                    },
                  ].map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText
                          className={`h-5 w-5 ${doc.url ? "text-blue-600" : "text-gray-400"}`}
                        />
                        <span className="font-medium">{doc.label}</span>
                      </div>
                      {doc.url ? (
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Lihat
                          </a>
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          Belum diupload
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="process">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Seleksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Timeline like view */}
                <div className="space-y-6 border-l-2 border-slate-200 pl-6 ml-2">
                  <div className="relative">
                    <div className="absolute -left-[31px] bg-green-500 h-4 w-4 rounded-full border-4 border-white" />
                    <h4 className="font-semibold text-sm">Pendaftaran Masuk</h4>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        new Date(registration.createdAt),
                        "d MMMM yyyy HH:mm",
                        { locale: idLocale },
                      )}
                    </p>
                  </div>

                  {registration.testDate && (
                    <div className="relative">
                      <div
                        className={`absolute -left-[31px] h-4 w-4 rounded-full border-4 border-white ${registration.testScore ? "bg-green-500" : "bg-blue-500"}`}
                      />
                      <h4 className="font-semibold text-sm">Jadwal Tes</h4>
                      <p className="text-sm">
                        Dilaksanakan pada{" "}
                        {format(
                          new Date(registration.testDate),
                          "d MMMM yyyy",
                          { locale: idLocale },
                        )}
                      </p>
                      {registration.testScore !== undefined && (
                        <div className="mt-2 p-3 bg-slate-50 rounded border">
                          <p className="font-semibold text-sm">
                            Nilai Tes: {registration.testScore}
                          </p>
                          {registration.testNotes && (
                            <p className="text-xs text-muted-foreground">
                              Catatan: {registration.testNotes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {registration.acceptedAt && (
                    <div className="relative">
                      <div className="absolute -left-[31px] bg-green-600 h-4 w-4 rounded-full border-4 border-white" />
                      <h4 className="font-semibold text-sm text-green-700">
                        Diterima
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(registration.acceptedAt),
                          "d MMMM yyyy",
                          { locale: idLocale },
                        )}
                      </p>
                    </div>
                  )}

                  {registration.rejectedAt && (
                    <div className="relative">
                      <div className="absolute -left-[31px] bg-red-600 h-4 w-4 rounded-full border-4 border-white" />
                      <h4 className="font-semibold text-sm text-red-700">
                        Ditolak
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(registration.rejectedAt),
                          "d MMMM yyyy",
                          { locale: idLocale },
                        )}
                      </p>
                      <p className="text-sm mt-1 text-red-600 bg-red-50 p-2 rounded">
                        Alasan: {registration.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Jadwalkan Tes</DialogTitle>
              <DialogDescription>
                Tentukan tanggal tes untuk calon santri ini.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Tanggal Tes</Label>
                <Input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Catatan (Opsional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Lokasi tes, perlengkapan, dll..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setTestDialogOpen(false)}
              >
                Batal
              </Button>
              <Button onClick={handleScheduleTest} disabled={!testDate}>
                Simpan Selesai
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Input Nilai Tes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nilai (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={testScore}
                  onChange={(e) => setTestScore(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Catatan</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan hasil tes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setScoreDialogOpen(false)}
              >
                Batal
              </Button>
              <Button onClick={handleRecordScore} disabled={!testScore}>
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Terima Calon Santri?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini akan mengubah status menjadi DITERIMA. Anda akan
                dapat membuat tagihan masuk setelah ini.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Label className="mb-2 block">
                Catatan Penerimaan (Opsional)
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Selamat bergabung..."
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAccept}
                className="bg-green-600 hover:bg-green-700"
              >
                Terima Santri
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tolak Pendaftaran?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Mohon sertakan alasan
                penolakan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Label className="mb-2 block">Alasan Penolakan *</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mohon maaf..."
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReject}
                disabled={!notes}
                className="bg-red-600 hover:bg-red-700"
              >
                Tolak
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
