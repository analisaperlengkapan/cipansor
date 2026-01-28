"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCorrespondence } from "@/hooks/use-correspondence";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  Send,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  Inbox,
  SendHorizontal,
  FolderOpen,
  PenTool,
  Users,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  LetterDirection,
  LetterStatus,
  type LetterDetail,
} from "@cipansor/shared";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function EOfficeMainPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { useLetters, useStats } = useCorrespondence(user?.unitId);

  // Fetch inbox and outbox
  const { data: inboxData, isLoading: loadingInbox } = useLetters({
    direction: LetterDirection.INCOMING,
    limit: 5,
  });

  const { data: outboxData, isLoading: loadingOutbox } = useLetters({
    direction: LetterDirection.OUTGOING,
    limit: 5,
  });

  // Fetch real stats
  const { data: statsData, isLoading: loadingStats } = useStats();

  const inbox = inboxData?.data || [];
  const outbox = outboxData?.data || [];

  // Stats from backend
  const stats = {
    totalIncoming: statsData?.counts?.totalIncoming || 0,
    totalOutgoing: statsData?.counts?.totalOutgoing || 0,
    pendingReview: statsData?.counts?.pendingReview || 0,
    needsAction: statsData?.counts?.needsAction || 0,
  };

  const getStatusBadge = (status: LetterStatus) => {
    const config: Record<LetterStatus, { label: string; className: string }> = {
      [LetterStatus.DRAFT]: {
        label: "Draft",
        className: "bg-gray-100 text-gray-800",
      },
      [LetterStatus.PENDING_REVIEW]: {
        label: "Menunggu Review",
        className: "bg-yellow-100 text-yellow-800",
      },
      [LetterStatus.APPROVED]: {
        label: "Disetujui",
        className: "bg-green-100 text-green-800",
      },
      [LetterStatus.REJECTED]: {
        label: "Ditolak",
        className: "bg-red-100 text-red-800",
      },
      [LetterStatus.SENT]: {
        label: "Terkirim",
        className: "bg-blue-100 text-blue-800",
      },
      [LetterStatus.RECEIVED]: {
        label: "Diterima",
        className: "bg-purple-100 text-purple-800",
      },
      [LetterStatus.DISPOSED]: {
        label: "Didisposisi",
        className: "bg-indigo-100 text-indigo-800",
      },
      [LetterStatus.COMPLETED]: {
        label: "Selesai",
        className: "bg-emerald-100 text-emerald-800",
      },
      [LetterStatus.ARCHIVED]: {
        label: "Diarsip",
        className: "bg-slate-100 text-slate-800",
      },
    };
    const c = config[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const config: Record<string, string> = {
      URGENT: "bg-red-100 text-red-800 border-red-200",
      IMMEDIATE: "bg-orange-100 text-orange-800 border-orange-200",
      NORMAL: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded border ${config[urgency] || config.NORMAL}`}
      >
        {urgency === "URGENT"
          ? "Segera"
          : urgency === "IMMEDIATE"
            ? "Penting"
            : "Biasa"}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">E-Office</h1>
          <p className="text-muted-foreground">
            Sistem Manajemen Surat & Disposisi Digital
          </p>
        </div>
        <Button onClick={() => router.push("/e-office/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Surat Baru
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/e-office/inbox")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surat Masuk</CardTitle>
            <Inbox className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIncoming}</div>
            <p className="text-xs text-muted-foreground">
              Total surat diterima
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/e-office/outbox")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surat Keluar</CardTitle>
            <SendHorizontal className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOutgoing}</div>
            <p className="text-xs text-muted-foreground">
              Total surat terkirim
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Menunggu Review
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingReview}
            </div>
            <p className="text-xs text-muted-foreground">Perlu persetujuan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Perlu Tindakan
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.needsAction}
            </div>
            <p className="text-xs text-muted-foreground">Memerlukan aksi</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle>Statistik Surat</CardTitle>
          <CardDescription>
            Tren surat masuk dan keluar 6 bulan terakhir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {loadingStats ? (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Memuat grafik...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={statsData?.chart || []}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="incoming"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    name="Surat Masuk"
                  />
                  <Area
                    type="monotone"
                    dataKey="outgoing"
                    stroke="#16a34a"
                    fill="#22c55e"
                    fillOpacity={0.2}
                    name="Surat Keluar"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className="cursor-pointer hover:bg-primary/5 transition-colors border-2 border-dashed"
          onClick={() => router.push("/e-office/create?direction=incoming")}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
            <div className="p-3 bg-blue-100 rounded-full">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <span className="font-medium">Catat Surat Masuk</span>
            <span className="text-xs text-muted-foreground text-center">
              Registrasi surat yang diterima
            </span>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-primary/5 transition-colors border-2 border-dashed"
          onClick={() => router.push("/e-office/create?direction=outgoing")}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
            <div className="p-3 bg-green-100 rounded-full">
              <PenTool className="h-6 w-6 text-green-600" />
            </div>
            <span className="font-medium">Buat Surat Keluar</span>
            <span className="text-xs text-muted-foreground text-center">
              Buat surat baru untuk dikirim
            </span>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-primary/5 transition-colors border-2 border-dashed"
          onClick={() => router.push("/e-office/inbox?status=pending")}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
            <span className="font-medium">Disposisi</span>
            <span className="text-xs text-muted-foreground text-center">
              Lihat surat yang perlu didisposisi
            </span>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-primary/5 transition-colors border-2 border-dashed"
          onClick={() => router.push("/e-office/archive")}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
            <div className="p-3 bg-purple-100 rounded-full">
              <FolderOpen className="h-6 w-6 text-purple-600" />
            </div>
            <span className="font-medium">Arsip Surat</span>
            <span className="text-xs text-muted-foreground text-center">
              Akses arsip surat lama
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Recent Letters */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Inbox */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-blue-600" />
                  Surat Masuk Terbaru
                </CardTitle>
                <CardDescription>5 surat masuk terbaru</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/e-office/inbox">
                  Lihat Semua
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingInbox ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : inbox.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada surat masuk
              </div>
            ) : (
              <div className="space-y-3">
                {inbox.map((letter: LetterDetail) => (
                  <div
                    key={letter.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/e-office/letter/${letter.id}`)}
                  >
                    <div className="p-2 bg-blue-100 rounded">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {letter.subject}
                        </span>
                        {getUrgencyBadge(letter.urgency)}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {letter.senderName || letter.senderInstance}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(letter.date), "dd MMM yyyy", {
                            locale: localeId,
                          })}
                        </span>
                        {getStatusBadge(letter.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Outbox */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-green-600" />
                  Surat Keluar Terbaru
                </CardTitle>
                <CardDescription>5 surat keluar terbaru</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/e-office/outbox">
                  Lihat Semua
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingOutbox ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : outbox.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada surat keluar
              </div>
            ) : (
              <div className="space-y-3">
                {outbox.map((letter: LetterDetail) => (
                  <div
                    key={letter.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/e-office/letter/${letter.id}`)}
                  >
                    <div className="p-2 bg-green-100 rounded">
                      <Send className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {letter.subject}
                        </span>
                        {getUrgencyBadge(letter.urgency)}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        Kepada:{" "}
                        {letter.recipientName || letter.recipientInstance}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(letter.date), "dd MMM yyyy", {
                            locale: localeId,
                          })}
                        </span>
                        {getStatusBadge(letter.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips / Help Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">
                Tips Penggunaan E-Office
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>• Gunakan nomor agenda untuk melacak surat masuk</li>
                <li>
                  • Disposisikan surat ke pegawai yang berwenang untuk tindak
                  lanjut
                </li>
                <li>
                  • Arsipkan surat yang sudah selesai diproses untuk dokumentasi
                </li>
                <li>
                  • Gunakan filter sifat surat (Segera/Penting/Biasa) untuk
                  prioritas
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
