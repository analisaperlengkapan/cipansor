"use client";
import { MainLayout } from "@/components/layout";

/**
 * PKG (Penilaian Kinerja Guru) Page
 *
 * Halaman manajemen PKG berdasarkan Permendiknas No. 35 Tahun 2010
 * 4 Kompetensi: Pedagogik, Kepribadian, Sosial, Profesional
 */
import { useState } from "react";
import { safeFormat } from "@/lib/date";
import { useRouter } from "next/navigation";
import {
  usePKGPeriods,
  usePKGStatistics,
  useCreatePKGPeriod,
  useUpdatePKGPeriod,
  useDeletePKGPeriod,
  type PKGPeriod,
} from "@/hooks/use-pkg";
import { useUnits } from "@/hooks/use-units";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardCheck,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Users,
  Award,
  TrendingUp,
  Calendar,
  Building2,
} from "lucide-react";

import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  ARCHIVED: "bg-yellow-100 text-yellow-700",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Aktif",
  COMPLETED: "Selesai",
  ARCHIVED: "Arsip",
};

function PKGPageContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PKGPeriod | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>(user?.unitId || "");
  const [selectedYear, setSelectedYear] = useState<string>("");

  // Queries
  const { data: unitsData } = useUnits();
  const { data: yearsData } = useAcademicYears();
  const { data: periodsData, isLoading: periodsLoading } = usePKGPeriods({
    unitId: selectedUnit || undefined,
    academicYearId: selectedYear || undefined,
  });
  const { data: stats } = usePKGStatistics({
    unitId: selectedUnit || undefined,
  });

  // Mutations
  const createPeriod = useCreatePKGPeriod();
  const updatePeriod = useUpdatePKGPeriod();
  const deletePeriod = useDeletePKGPeriod();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    unitId: "",
    academicYearId: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const handleOpenDialog = (period?: PKGPeriod) => {
    if (period) {
      setEditingPeriod(period);
      setFormData({
        name: period.name,
        unitId: period.unitId,
        academicYearId: period.academicYearId,
        startDate: period.startDate.split("T")[0],
        endDate: period.endDate.split("T")[0],
        description: period.description || "",
      });
    } else {
      setEditingPeriod(null);
      setFormData({
        name: "",
        unitId: selectedUnit || "",
        academicYearId: selectedYear || "",
        startDate: "",
        endDate: "",
        description: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPeriod) {
        await updatePeriod.mutateAsync({
          id: editingPeriod.id,
          name: formData.name,
          startDate: formData.startDate,
          endDate: formData.endDate,
          description: formData.description,
        });
        toast.success("Periode PKG berhasil diperbarui");
      } else {
        await createPeriod.mutateAsync(formData);
        toast.success("Periode PKG berhasil dibuat");
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Gagal menyimpan periode PKG");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus periode PKG ini?")) return;
    try {
      await deletePeriod.mutateAsync(id);
      toast.success("Periode PKG berhasil dihapus");
    } catch (error) {
      toast.error("Gagal menghapus periode PKG");
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await updatePeriod.mutateAsync({ id, status: "ACTIVE" });
      toast.success("Periode PKG diaktifkan");
    } catch (error) {
      toast.error("Gagal mengaktifkan periode PKG");
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Penilaian Kinerja Guru (PKG)
          </h1>
          <p className="text-muted-foreground mt-1">
            Permendiknas No. 35 Tahun 2010 - 4 Kompetensi Utama
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Periode
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Evaluasi
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">guru dinilai</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.completed || 0}
            </div>
            <p className="text-xs text-muted-foreground">evaluasi selesai</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rata-rata Nilai
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.averageScore?.toFixed(1) || "0"}
            </div>
            <p className="text-xs text-muted-foreground">dari 100</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Distribusi Grade
            </CardTitle>
            <Award className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {["A", "B", "C", "D", "E"].map((grade) => (
                <Badge key={grade} variant="outline" className="text-xs">
                  {grade}: {stats?.byGrade?.[grade] || 0}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Unit</SelectItem>
                  {unitsData?.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tahun Ajaran</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Tahun</SelectItem>
                  {yearsData?.data?.map((year: any) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Periods Table */}
      <Card>
        <CardHeader>
          <CardTitle>Periode PKG</CardTitle>
          <CardDescription>
            Daftar periode penilaian kinerja guru
          </CardDescription>
        </CardHeader>
        <CardContent>
          {periodsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Periode</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Evaluasi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodsData?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Calendar className="h-8 w-8" />
                        <p>Belum ada periode PKG</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  periodsData?.data?.map((period: PKGPeriod) => (
                    <TableRow key={period.id}>
                      <TableCell className="font-medium">
                        {period.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {period.unit?.name}
                        </div>
                      </TableCell>
                      <TableCell>{period.academicYear?.name}</TableCell>
                      <TableCell className="text-sm">
                        {safeFormat(new Date(period.startDate), "d MMM", {
                          locale: localeId,
                        })}{" "}
                        -{" "}
                        {safeFormat(new Date(period.endDate), "d MMM yyyy", {
                          locale: localeId,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[period.status]}>
                          {statusLabels[period.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {period._count?.evaluations || 0} guru
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/pkg/${period.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {period.status === "DRAFT" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleActivate(period.id)}
                            >
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDialog(period)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(period.id)}
                            disabled={deletePeriod.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPeriod ? "Edit Periode PKG" : "Buat Periode PKG Baru"}
            </DialogTitle>
            <DialogDescription>
              Isi data periode penilaian kinerja guru
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Periode</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="PKG Semester 1 2024/2025"
                  required
                />
              </div>
              {!editingPeriod && (
                <>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      value={formData.unitId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, unitId: v })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitsData?.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tahun Ajaran</Label>
                    <Select
                      value={formData.academicYearId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, academicYearId: v })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Tahun Ajaran" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearsData?.data?.map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Selesai</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Deskripsi periode PKG..."
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createPeriod.isPending || updatePeriod.isPending}
              >
                {editingPeriod ? "Simpan" : "Buat"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PKGPageWithShell() {
  return (
    <MainLayout>
      <PKGPageContent />
    </MainLayout>
  );
}
