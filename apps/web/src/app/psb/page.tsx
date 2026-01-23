"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useRegistrations,
  useRegistrationStats,
  useRegistrationPeriods,
  REGISTRATION_STATUSES,
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_COLORS,
  type RegistrationStatus,
} from "@/hooks";
import {
  UserPlus,
  Search,
  Plus,
  Eye,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";

export default function PSBPage() {
  const [activeTab, setActiveTab] = useState("registrations");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | "ALL">(
    "ALL",
  );
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");

  const { data: registrationsData, isLoading } = useRegistrations({
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    periodId: periodFilter && periodFilter !== "ALL" ? periodFilter : undefined,
  });
  const { data: stats } = useRegistrationStats(periodFilter || undefined);
  const { data: periods } = useRegistrationPeriods();

  const registrations = registrationsData?.data || [];

  const getStatusBadge = (status: RegistrationStatus) => (
    <Badge className={REGISTRATION_STATUS_COLORS[status]}>
      {REGISTRATION_STATUS_LABELS[status]}
    </Badge>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Penerimaan Santri Baru
            </h1>
            <p className="text-muted-foreground">
              Kelola pendaftaran dan penerimaan santri baru
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/psb/periods">
                <Calendar className="mr-2 h-4 w-4" />
                Periode
              </Link>
            </Button>
            <Button asChild>
              <Link href="/psb/new">
                <Plus className="mr-2 h-4 w-4" />
                Daftar Baru
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Pendaftar
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Kuota: {stats?.quota ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Diproses</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats?.byStatus?.SUBMITTED ?? 0) +
                  (stats?.byStatus?.DOCUMENT_REVIEW ?? 0) +
                  (stats?.byStatus?.TEST_SCHEDULED ?? 0) +
                  (stats?.byStatus?.TEST_COMPLETED ?? 0) +
                  (stats?.byStatus?.INTERVIEW_SCHEDULED ?? 0) +
                  (stats?.byStatus?.INTERVIEW_COMPLETED ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Dalam proses seleksi
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Diterima</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.accepted ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Lulus seleksi</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Terdaftar</CardTitle>
              <UserPlus className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {stats?.enrolled ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Sudah daftar ulang
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats?.byStatus?.REJECTED ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Tidak memenuhi syarat
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="registrations">
              <FileText className="mr-2 h-4 w-4" />
              Pendaftaran
            </TabsTrigger>
            <TabsTrigger value="process">
              <Clock className="mr-2 h-4 w-4" />
              Proses Seleksi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registrations" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama atau nomor pendaftaran..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Semua Periode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Periode</SelectItem>
                      {periods?.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) =>
                      setStatusFilter(v as RegistrationStatus | "ALL")
                    }
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Status</SelectItem>
                      {REGISTRATION_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {REGISTRATION_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Registrations Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pendaftaran</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Asal Sekolah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Daftar</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : registrations.length ? (
                    registrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-mono text-sm">
                          {reg.registrationNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{reg.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              {reg.unit?.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {reg.gender === "MALE" ? "Laki-laki" : "Perempuan"}
                        </TableCell>
                        <TableCell>{reg.previousSchool || "-"}</TableCell>
                        <TableCell>{getStatusBadge(reg.status)}</TableCell>
                        <TableCell>
                          {format(new Date(reg.createdAt), "d MMM yyyy", {
                            locale: id,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/psb/${reg.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Belum ada data pendaftaran
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="process" className="space-y-4">
            {/* Process Pipeline */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Document Review */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Review Dokumen</CardTitle>
                  <CardDescription>
                    {stats?.byStatus?.DOCUMENT_REVIEW ?? 0} pendaftar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {registrations
                      .filter((r) => r.status === "DOCUMENT_REVIEW")
                      .slice(0, 3)
                      .map((reg) => (
                        <Link
                          key={reg.id}
                          href={`/psb/${reg.id}`}
                          className="block p-2 rounded-lg hover:bg-muted"
                        >
                          <p className="text-sm font-medium">{reg.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {reg.registrationNumber}
                          </p>
                        </Link>
                      ))}
                    {(stats?.byStatus?.DOCUMENT_REVIEW ?? 0) > 3 && (
                      <Button variant="link" size="sm" asChild>
                        <Link href="/psb?status=DOCUMENT_REVIEW">
                          Lihat semua →
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Test Scheduled */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Jadwal Tes</CardTitle>
                  <CardDescription>
                    {(stats?.byStatus?.TEST_SCHEDULED ?? 0) +
                      (stats?.byStatus?.TEST_COMPLETED ?? 0)}{" "}
                    pendaftar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {registrations
                      .filter(
                        (r) =>
                          r.status === "TEST_SCHEDULED" ||
                          r.status === "TEST_COMPLETED",
                      )
                      .slice(0, 3)
                      .map((reg) => (
                        <Link
                          key={reg.id}
                          href={`/psb/${reg.id}`}
                          className="block p-2 rounded-lg hover:bg-muted"
                        >
                          <p className="text-sm font-medium">{reg.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {reg.testDate
                              ? format(new Date(reg.testDate), "d MMM yyyy", {
                                  locale: id,
                                })
                              : "Belum dijadwalkan"}
                          </p>
                        </Link>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Interview Scheduled */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Jadwal Wawancara</CardTitle>
                  <CardDescription>
                    {(stats?.byStatus?.INTERVIEW_SCHEDULED ?? 0) +
                      (stats?.byStatus?.INTERVIEW_COMPLETED ?? 0)}{" "}
                    pendaftar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {registrations
                      .filter(
                        (r) =>
                          r.status === "INTERVIEW_SCHEDULED" ||
                          r.status === "INTERVIEW_COMPLETED",
                      )
                      .slice(0, 3)
                      .map((reg) => (
                        <Link
                          key={reg.id}
                          href={`/psb/${reg.id}`}
                          className="block p-2 rounded-lg hover:bg-muted"
                        >
                          <p className="text-sm font-medium">{reg.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {reg.interviewDate
                              ? format(
                                  new Date(reg.interviewDate),
                                  "d MMM yyyy",
                                  {
                                    locale: id,
                                  },
                                )
                              : "Belum dijadwalkan"}
                          </p>
                        </Link>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Ready for Decision */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Siap Keputusan</CardTitle>
                  <CardDescription>
                    {stats?.byStatus?.INTERVIEW_COMPLETED ?? 0} pendaftar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {registrations
                      .filter((r) => r.status === "INTERVIEW_COMPLETED")
                      .slice(0, 3)
                      .map((reg) => (
                        <Link
                          key={reg.id}
                          href={`/psb/${reg.id}`}
                          className="block p-2 rounded-lg hover:bg-muted"
                        >
                          <p className="text-sm font-medium">{reg.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            Nilai: {reg.testScore ?? "-"} /{" "}
                            {reg.interviewScore ?? "-"}
                          </p>
                        </Link>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
