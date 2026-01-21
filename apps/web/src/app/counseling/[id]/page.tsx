"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  MessageSquare,
  Clock,
  User,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BookOpen,
  Send,
  Users,
  Home,
  MoreHorizontal,
  Lock,
} from "lucide-react";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import {
  useCounselingRecord,
  useDeleteCounselingRecord,
  useResolveCounselingRecord,
  useAddCounselingSession,
  useNotifyParent,
  getCounselingCategoryConfig,
  getCounselingStatusConfig,
  getCounselingPriorityConfig,
  getCounselingSessionTypeConfig,
  COUNSELING_CATEGORIES,
  COUNSELING_STATUSES,
  SESSION_TYPES,
  type SessionType,
  type CounselingSession,
} from "@/hooks/use-counseling";

export default function CounselingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");

  // Session form state
  const [sessionForm, setSessionForm] = useState({
    type: "INDIVIDUAL" as SessionType,
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    attendees: "",
    summary: "",
    findings: "",
    recommendations: "",
    followUpDate: "",
    followUpNotes: "",
    parentNotified: false,
  });

  const { data: record, isLoading, error } = useCounselingRecord(id);
  const deleteMutation = useDeleteCounselingRecord();
  const resolveMutation = useResolveCounselingRecord();
  const addSessionMutation = useAddCounselingSession();
  const notifyParentMutation = useNotifyParent();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  if (error || !record) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Data tidak ditemukan</h2>
          <p className="text-muted-foreground mb-4">
            Catatan konseling tidak dapat ditemukan
          </p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
      </MainLayout>
    );
  }

  const catConfig = getCounselingCategoryConfig(record.category);
  const statusConfig = getCounselingStatusConfig(record.status);
  const priorityConfig = getCounselingPriorityConfig(record.priority);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Catatan konseling berhasil dihapus");
      router.push("/counseling");
    } catch {
      toast.error("Gagal menghapus catatan konseling");
    }
    setIsDeleteDialogOpen(false);
  };

  const handleResolve = async () => {
    try {
      await resolveMutation.mutateAsync({ id, resolutionNotes });
      toast.success("Kasus berhasil ditandai selesai");
      setIsResolveDialogOpen(false);
      setResolutionNotes("");
    } catch {
      toast.error("Gagal menyelesaikan kasus");
    }
  };

  const handleAddSession = async () => {
    try {
      await addSessionMutation.mutateAsync({
        recordId: id,
        type: sessionForm.type,
        date: sessionForm.date,
        startTime: sessionForm.startTime,
        endTime: sessionForm.endTime,
        location: sessionForm.location || undefined,
        attendees: sessionForm.attendees
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        summary: sessionForm.summary,
        findings: sessionForm.findings || undefined,
        recommendations: sessionForm.recommendations || undefined,
        followUpDate: sessionForm.followUpDate || undefined,
        followUpNotes: sessionForm.followUpNotes || undefined,
        parentNotified: sessionForm.parentNotified,
      });
      toast.success("Sesi konseling berhasil ditambahkan");
      setIsSessionDialogOpen(false);
      // Reset form
      setSessionForm({
        type: "INDIVIDUAL",
        date: format(new Date(), "yyyy-MM-dd"),
        startTime: "09:00",
        endTime: "10:00",
        location: "",
        attendees: "",
        summary: "",
        findings: "",
        recommendations: "",
        followUpDate: "",
        followUpNotes: "",
        parentNotified: false,
      });
    } catch {
      toast.error("Gagal menambahkan sesi konseling");
    }
  };

  const handleNotifyParent = async () => {
    try {
      await notifyParentMutation.mutateAsync({
        recordId: id,
        message: notifyMessage,
      });
      toast.success("Notifikasi berhasil dikirim ke orang tua");
      setIsNotifyDialogOpen(false);
      setNotifyMessage("");
    } catch {
      toast.error("Gagal mengirim notifikasi");
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span>Kasus {record.caseNumber}</span>
            {record.isConfidential && (
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-600"
              >
                <Lock className="h-3 w-3 mr-1" />
                Rahasia
              </Badge>
            )}
          </div>
        }
        description={record.title}
        backHref="/counseling"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Priority Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Kategori:
                  </span>
                  <Badge className={catConfig?.color}>
                    {catConfig?.icon} {catConfig?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={statusConfig?.color}>
                    {statusConfig?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Prioritas:
                  </span>
                  <Badge className={priorityConfig?.color}>
                    {priorityConfig?.label}
                  </Badge>
                </div>
                <div className="ml-auto flex gap-2">
                  {record.status !== "RESOLVED" && (
                    <Dialog
                      open={isResolveDialogOpen}
                      onOpenChange={setIsResolveDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Tandai Selesai
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Tandai Kasus Selesai</DialogTitle>
                          <DialogDescription>
                            Berikan catatan resolusi untuk kasus ini
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Catatan Resolusi</Label>
                            <Textarea
                              value={resolutionNotes}
                              onChange={(e) =>
                                setResolutionNotes(e.target.value)
                              }
                              placeholder="Jelaskan bagaimana kasus ini diselesaikan..."
                              rows={4}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsResolveDialogOpen(false)}
                          >
                            Batal
                          </Button>
                          <Button
                            onClick={handleResolve}
                            disabled={resolveMutation.isPending}
                          >
                            {resolveMutation.isPending
                              ? "Menyimpan..."
                              : "Selesaikan Kasus"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/counseling/${id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deskripsi Kasus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {record.description || "Tidak ada deskripsi"}
              </p>
              {record.resolvedAt && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">
                    Catatan Resolusi
                  </h4>
                  <p className="text-sm text-green-700">
                    {record.resolutionNotes}
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    Diselesaikan pada{" "}
                    {format(new Date(record.resolvedAt), "dd MMMM yyyy HH:mm", {
                      locale: localeId,
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sessions Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Riwayat Sesi Konseling
                </CardTitle>
                <CardDescription>
                  {record.sessions?.length || 0} sesi telah dilakukan
                </CardDescription>
              </div>
              <Dialog
                open={isSessionDialogOpen}
                onOpenChange={setIsSessionDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Sesi
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Tambah Sesi Konseling</DialogTitle>
                    <DialogDescription>
                      Catat sesi konseling baru untuk kasus ini
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipe Sesi</Label>
                        <Select
                          value={sessionForm.type}
                          onValueChange={(v) =>
                            setSessionForm({
                              ...sessionForm,
                              type: v as SessionType,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SESSION_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.icon} {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Lokasi</Label>
                        <Input
                          value={sessionForm.location}
                          onChange={(e) =>
                            setSessionForm({
                              ...sessionForm,
                              location: e.target.value,
                            })
                          }
                          placeholder="Ruang BK, dll"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Tanggal</Label>
                        <Input
                          type="date"
                          value={sessionForm.date}
                          onChange={(e) =>
                            setSessionForm({
                              ...sessionForm,
                              date: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Mulai</Label>
                        <Input
                          type="time"
                          value={sessionForm.startTime}
                          onChange={(e) =>
                            setSessionForm({
                              ...sessionForm,
                              startTime: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Selesai</Label>
                        <Input
                          type="time"
                          value={sessionForm.endTime}
                          onChange={(e) =>
                            setSessionForm({
                              ...sessionForm,
                              endTime: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Peserta (pisahkan dengan koma)</Label>
                      <Input
                        value={sessionForm.attendees}
                        onChange={(e) =>
                          setSessionForm({
                            ...sessionForm,
                            attendees: e.target.value,
                          })
                        }
                        placeholder="Siswa, Konselor, Wali Kelas"
                      />
                    </div>
                    <div>
                      <Label>Ringkasan Sesi *</Label>
                      <Textarea
                        value={sessionForm.summary}
                        onChange={(e) =>
                          setSessionForm({
                            ...sessionForm,
                            summary: e.target.value,
                          })
                        }
                        placeholder="Tuliskan ringkasan sesi konseling..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Temuan</Label>
                      <Textarea
                        value={sessionForm.findings}
                        onChange={(e) =>
                          setSessionForm({
                            ...sessionForm,
                            findings: e.target.value,
                          })
                        }
                        placeholder="Temuan dari sesi..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Rekomendasi</Label>
                      <Textarea
                        value={sessionForm.recommendations}
                        onChange={(e) =>
                          setSessionForm({
                            ...sessionForm,
                            recommendations: e.target.value,
                          })
                        }
                        placeholder="Rekomendasi tindak lanjut..."
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tanggal Follow Up</Label>
                        <Input
                          type="date"
                          value={sessionForm.followUpDate}
                          onChange={(e) =>
                            setSessionForm({
                              ...sessionForm,
                              followUpDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="parentNotified"
                          checked={sessionForm.parentNotified}
                          onChange={(e) =>
                            setSessionForm({
                              ...sessionForm,
                              parentNotified: e.target.checked,
                            })
                          }
                        />
                        <Label htmlFor="parentNotified">
                          Orang tua sudah diberitahu
                        </Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsSessionDialogOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={handleAddSession}
                      disabled={
                        addSessionMutation.isPending || !sessionForm.summary
                      }
                    >
                      {addSessionMutation.isPending
                        ? "Menyimpan..."
                        : "Simpan Sesi"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {!record.sessions || record.sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>Belum ada sesi konseling</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {record.sessions.map(
                    (session: CounselingSession, index: number) => {
                      const typeConfig = getCounselingSessionTypeConfig(
                        session.type,
                      );
                      return (
                        <div key={session.id} className="relative pl-6 pb-4">
                          {/* Timeline line */}
                          {index < record.sessions.length - 1 && (
                            <div className="absolute left-2 top-6 h-full w-px bg-border" />
                          )}
                          {/* Timeline dot */}
                          <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-primary" />

                          <div className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <Badge variant="outline">
                                  Sesi {session.sessionNumber}
                                </Badge>
                                <span className="ml-2 text-sm text-muted-foreground">
                                  {typeConfig?.icon} {typeConfig?.label}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(session.date), "dd MMM yyyy", {
                                  locale: localeId,
                                })}
                                {" • "}
                                {session.startTime} - {session.endTime}
                              </span>
                            </div>
                            <p className="text-sm mb-2">{session.summary}</p>
                            {session.findings && (
                              <div className="text-sm text-muted-foreground mb-2">
                                <strong>Temuan:</strong> {session.findings}
                              </div>
                            )}
                            {session.recommendations && (
                              <div className="text-sm text-muted-foreground">
                                <strong>Rekomendasi:</strong>{" "}
                                {session.recommendations}
                              </div>
                            )}
                            {session.attendees &&
                              session.attendees.length > 0 && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  {session.attendees.join(", ")}
                                </div>
                              )}
                            {session.parentNotified && (
                              <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Orang tua telah diberitahu
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Student Info & Actions */}
        <div className="space-y-6">
          {/* Student Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Siswa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {record.student?.name?.charAt(0) || "S"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">
                    {record.student?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    NIS: {record.student?.nis}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {record.student?.currentClass?.name || "Belum ada kelas"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Wali:</span>
                  <span>{record.student?.parentName || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Telepon:</span>
                  <span>{record.student?.parentPhone || "-"}</span>
                </div>
              </div>

              <Dialog
                open={isNotifyDialogOpen}
                onOpenChange={setIsNotifyDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Hubungi Orang Tua
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Kirim Notifikasi ke Orang Tua</DialogTitle>
                    <DialogDescription>
                      Kirim pesan ke {record.student?.parentName} (
                      {record.student?.parentPhone})
                    </DialogDescription>
                  </DialogHeader>
                  <div>
                    <Label>Pesan</Label>
                    <Textarea
                      value={notifyMessage}
                      onChange={(e) => setNotifyMessage(e.target.value)}
                      placeholder="Ketik pesan untuk orang tua..."
                      rows={4}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsNotifyDialogOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={handleNotifyParent}
                      disabled={
                        notifyParentMutation.isPending || !notifyMessage
                      }
                    >
                      {notifyParentMutation.isPending ? "Mengirim..." : "Kirim"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Counselor Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Konselor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {record.counselor?.name?.charAt(0) || "K"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {record.counselor?.name || "Tidak ada"}
                  </p>
                  <p className="text-sm text-muted-foreground">Guru BK</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Kasus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dilaporkan</span>
                <span>
                  {format(new Date(record.reportedAt), "dd MMM yyyy HH:mm", {
                    locale: localeId,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit</span>
                <span>{record.unit?.name || "-"}</span>
              </div>
              {record.reportedBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dilaporkan oleh</span>
                  <span>{record.reportedBy}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Terakhir diubah</span>
                <span>
                  {formatDistanceToNow(new Date(record.updatedAt), {
                    addSuffix: true,
                    locale: localeId,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">
                Zona Berbahaya
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus Catatan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Hapus Catatan Konseling</DialogTitle>
                    <DialogDescription>
                      Apakah Anda yakin ingin menghapus catatan konseling ini?
                      Tindakan ini tidak dapat dibatalkan.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDeleteDialogOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
