"use client";

import { useParams, useRouter } from "next/navigation";
import { safeFormat } from "@/lib/date";
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
import { Textarea } from "@/components/ui/textarea";
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
  useLeaveRequest,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useCancelLeaveRequest,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  type LeaveStatus,
} from "@/hooks";
import {
  ArrowLeft,
  Check,
  X,
  Calendar,
  User,
  Briefcase,
  FileText,
  Clock,
  Loader2,
  AlertCircle,
  Ban,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";

export default function LeaveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leaveId = params.id as string;
  const [rejectReason, setRejectReason] = useState("");

  const { data: leave, isLoading } = useLeaveRequest(leaveId);
  const approveLeave = useApproveLeaveRequest();
  const rejectLeave = useRejectLeaveRequest();
  const cancelLeave = useCancelLeaveRequest();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!leave) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            Pengajuan cuti tidak ditemukan
          </p>
          <Button onClick={() => router.push("/hr")}>Kembali ke Daftar</Button>
        </div>
      </MainLayout>
    );
  }

  const handleApprove = async () => {
    try {
      await approveLeave.mutateAsync(leaveId);
      toast.success("Cuti berhasil disetujui");
    } catch (error) {
      toast.error("Gagal menyetujui cuti");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }
    try {
      await rejectLeave.mutateAsync({ id: leaveId, reason: rejectReason });
      toast.success("Cuti berhasil ditolak");
      setRejectReason("");
    } catch (error) {
      toast.error("Gagal menolak cuti");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelLeave.mutateAsync(leaveId);
      toast.success("Cuti berhasil dibatalkan");
    } catch (error) {
      toast.error("Gagal membatalkan cuti");
    }
  };

  const getStatusBadge = (status: LeaveStatus) => {
    const colors: Record<LeaveStatus, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={`${colors[status]} text-sm`}>
        {LEAVE_STATUS_LABELS[status]}
      </Badge>
    );
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
                  Detail Pengajuan Cuti
                </h1>
                {getStatusBadge(leave.status)}
              </div>
              <p className="text-muted-foreground">
                {LEAVE_TYPE_LABELS[leave.leaveType]} - {leave.totalDays} hari
              </p>
            </div>
          </div>

          {leave.status === "PENDING" && (
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <X className="mr-2 h-4 w-4" />
                    Tolak
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tolak Pengajuan Cuti?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Berikan alasan penolakan untuk pengajuan cuti ini.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Textarea
                    placeholder="Alasan penolakan..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setRejectReason("")}>
                      Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleReject}
                      disabled={rejectLeave.isPending}
                    >
                      Tolak Cuti
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button>
                    <Check className="mr-2 h-4 w-4" />
                    Setujui
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Setujui Pengajuan Cuti?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Pengajuan cuti {leave.employee?.fullName} selama{" "}
                      {leave.totalDays} hari akan disetujui.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleApprove}
                      disabled={approveLeave.isPending}
                    >
                      Setujui
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {leave.status === "APPROVED" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Ban className="mr-2 h-4 w-4" />
                  Batalkan
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Batalkan Cuti?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cuti yang sudah disetujui akan dibatalkan. Tindakan ini
                    tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    disabled={cancelLeave.isPending}
                  >
                    Batalkan Cuti
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Employee Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informasi Karyawan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-muted-foreground">Nama</dt>
                    <dd className="font-medium">{leave.employee?.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">NIP</dt>
                    <dd className="font-mono">{leave.employee?.nip}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Jabatan</dt>
                    <dd>{leave.employee?.position}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Unit</dt>
                    <dd>{leave.employee?.unit?.name ?? "-"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Leave Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Detail Cuti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        Jenis Cuti
                      </dt>
                      <dd className="font-medium">
                        {LEAVE_TYPE_LABELS[leave.leaveType]}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        Total Hari
                      </dt>
                      <dd className="text-2xl font-bold">
                        {leave.totalDays} hari
                      </dd>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        Tanggal Mulai
                      </dt>
                      <dd className="font-medium">
                        {format(
                          new Date(leave.startDate),
                          "EEEE, d MMMM yyyy",
                          { locale: idLocale },
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        Tanggal Selesai
                      </dt>
                      <dd className="font-medium">
                        {safeFormat(
                          new Date(leave.endDate),
                          "EEEE, d MMMM yyyy",
                          {
                            locale: idLocale,
                          },
                        )}
                      </dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground mb-1">
                      Alasan
                    </dt>
                    <dd className="p-3 bg-muted rounded-lg">{leave.reason}</dd>
                  </div>
                  {leave.attachmentUrl && (
                    <div>
                      <dt className="text-sm text-muted-foreground mb-1">
                        Lampiran
                      </dt>
                      <dd>
                        <a
                          href={leave.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Lihat Lampiran
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Rejection Reason */}
            {leave.status === "REJECTED" && leave.rejectionReason && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <X className="h-5 w-5" />
                    Alasan Penolakan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-800">{leave.rejectionReason}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <div className="w-px h-full bg-gray-200" />
                    </div>
                    <div>
                      <p className="font-medium">Diajukan</p>
                      <p className="text-sm text-muted-foreground">
                        {safeFormat(
                          new Date(leave.createdAt),
                          "d MMM yyyy HH:mm",
                          {
                            locale: idLocale,
                          },
                        )}
                      </p>
                    </div>
                  </div>

                  {leave.status === "APPROVED" && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <div className="w-px h-full bg-gray-200" />
                      </div>
                      <div>
                        <p className="font-medium">Disetujui</p>
                        <p className="text-sm text-muted-foreground">
                          {leave.approvedAt &&
                            format(
                              new Date(leave.approvedAt),
                              "d MMM yyyy HH:mm",
                              { locale: idLocale },
                            )}
                        </p>
                        {leave.approvedBy && (
                          <p className="text-xs text-muted-foreground">
                            oleh {leave.approvedBy.name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {leave.status === "REJECTED" && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                      </div>
                      <div>
                        <p className="font-medium text-red-600">Ditolak</p>
                        <p className="text-sm text-muted-foreground">
                          {leave.rejectedAt &&
                            format(
                              new Date(leave.rejectedAt),
                              "d MMM yyyy HH:mm",
                              { locale: idLocale },
                            )}
                        </p>
                      </div>
                    </div>
                  )}

                  {leave.status === "CANCELLED" && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-gray-500 rounded-full" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-600">Dibatalkan</p>
                        <p className="text-sm text-muted-foreground">
                          {leave.cancelledAt &&
                            format(
                              new Date(leave.cancelledAt),
                              "d MMM yyyy HH:mm",
                              { locale: idLocale },
                            )}
                        </p>
                      </div>
                    </div>
                  )}

                  {leave.status === "PENDING" && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                      </div>
                      <div>
                        <p className="font-medium text-yellow-600">
                          Menunggu Persetujuan
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sisa Cuti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold">
                    {leave.employee?.leaveBalance ?? 12}
                  </p>
                  <p className="text-sm text-muted-foreground">hari tersisa</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
