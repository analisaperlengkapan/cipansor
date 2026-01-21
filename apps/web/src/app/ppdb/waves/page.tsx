"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  GraduationCap,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Filter,
  Users,
  Calendar,
  Target,
  Play,
  Pause,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUnits } from "@/hooks/use-units";
import { useAcademicYears } from "@/hooks/use-academic-years";
import {
  useWaves,
  useDeleteWave,
  useUpdateWaveStatus,
  useWaveStats,
  WAVE_STATUSES,
  WaveStatus,
  AdmissionWave,
  formatRegistrationFee,
  calculateQuotaPercentage,
} from "@/hooks/use-ppdb-wave";

export default function PPDBWavesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [unitFilter, setUnitFilter] = useState<string>("");
  const [deleteWaveId, setDeleteWaveId] = useState<string | null>(null);

  const { data: wavesData, isLoading } = useWaves({
    page,
    limit: pageSize,
    status: (statusFilter as WaveStatus) || undefined,
    unitId: unitFilter || undefined,
  });

  const { data: units } = useUnits();
  const { data: statsData } = useWaveStats();
  const deleteWave = useDeleteWave();
  const updateStatus = useUpdateWaveStatus();

  const waves = (wavesData?.data || []) as AdmissionWave[];
  const pagination = wavesData?.meta;
  const stats = statsData?.data;

  const handleDelete = async () => {
    if (!deleteWaveId) return;
    try {
      await deleteWave.mutateAsync(deleteWaveId);
      toast.success("Gelombang PPDB berhasil dihapus");
      setDeleteWaveId(null);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus gelombang";
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (id: string, status: WaveStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(
        `Status gelombang berhasil diubah ke ${WAVE_STATUSES.find((s) => s.value === status)?.label}`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal mengubah status";
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status: WaveStatus) => {
    const config = WAVE_STATUSES.find((s) => s.value === status);
    return (
      <Badge variant="secondary" className={config?.color}>
        {config?.label || status}
      </Badge>
    );
  };

  const resetFilters = () => {
    setStatusFilter("");
    setUnitFilter("");
    setPage(1);
  };

  return (
    <MainLayout>
      <PageHeader
        title="Penerimaan Peserta Didik Baru (PPDB)"
        description="Kelola gelombang pendaftaran dan peserta didik baru"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">
                Total Gelombang
              </span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalWaves || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Gelombang Aktif
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {stats?.openWaves || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">
                Total Pendaftar
              </span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalRegistrants || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Diterima</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {stats?.acceptedRegistrants || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Status</SelectItem>
                {WAVE_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Semua Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Unit</SelectItem>
                {(units || []).map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={resetFilters}>
              Reset
            </Button>
            <div className="flex-1" />
            <Button asChild>
              <Link href="/ppdb/waves/new">
                <Plus className="h-4 w-4 mr-2" />
                Buat Gelombang
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Waves Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gelombang</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Kuota</TableHead>
                <TableHead>Biaya</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : waves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      Tidak ada gelombang PPDB
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/ppdb/waves/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Buat Gelombang Pertama
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                waves.map((wave) => {
                  const quotaPercentage = calculateQuotaPercentage(
                    wave.registeredCount,
                    wave.quota,
                  );
                  return (
                    <TableRow key={wave.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{wave.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(wave.startDate), "d MMM", {
                              locale: localeId,
                            })}{" "}
                            -{" "}
                            {format(new Date(wave.endDate), "d MMM yyyy", {
                              locale: localeId,
                            })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{wave.unit?.name || "-"}</TableCell>
                      <TableCell>{wave.period?.name || "-"}</TableCell>
                      <TableCell>
                        <div className="space-y-1 w-24">
                          <div className="flex justify-between text-xs">
                            <span>{wave.registeredCount}</span>
                            <span className="text-muted-foreground">
                              / {wave.quota}
                            </span>
                          </div>
                          <Progress value={quotaPercentage} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatRegistrationFee(wave.registrationFee)}
                      </TableCell>
                      <TableCell>{getStatusBadge(wave.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/ppdb/waves/${wave.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/ppdb/waves/${wave.id}/edit`}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              {wave.status === "DRAFT" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(wave.id, "OPEN")
                                  }
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Buka Pendaftaran
                                </DropdownMenuItem>
                              )}
                              {wave.status === "OPEN" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(wave.id, "CLOSED")
                                  }
                                >
                                  <Pause className="h-4 w-4 mr-2" />
                                  Tutup Pendaftaran
                                </DropdownMenuItem>
                              )}
                              {wave.status === "CLOSED" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(wave.id, "COMPLETED")
                                  }
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Selesaikan
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteWaveId(wave.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pagination && (
        <div className="mt-4">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.limit}
            total={pagination.total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        open={!!deleteWaveId}
        onOpenChange={(open) => !open && setDeleteWaveId(null)}
        title="Hapus Gelombang PPDB"
        description="Apakah Anda yakin ingin menghapus gelombang PPDB ini? Data pendaftar juga akan dihapus."
        onConfirm={handleDelete}
        isLoading={deleteWave.isPending}
      />
    </MainLayout>
  );
}
