"use client";

import { useState, useEffect } from "react";
import { safeFormat } from "@/lib/date";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useStaffSalaries,
  useCreateStaffSalary,
  useUpdateStaffSalary,
  useSetStaffSalaryComponents,
  useSalaryComponents,
  type StaffSalary,
  type SalaryComponent,
  COMPONENT_TYPE_LABELS,
} from "@/hooks";
import { useUnits } from "@/hooks";
import {
  ArrowLeft,
  Plus,
  Search,
  Loader2,
  Pencil,
  DollarSign,
  User,
  Settings2,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

interface Staff {
  id: string;
  employeeId?: string;
  fullName: string;
  nip?: string;
  position?: string;
  unitId?: string;
  unit?: { id: string; name: string };
}

export default function StaffSalaryPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isComponentsOpen, setIsComponentsOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<StaffSalary | null>(null);
  const [selectedSalary, setSelectedSalary] = useState<StaffSalary | null>(
    null,
  );

  // Form state
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(
    safeFormat(new Date(), "yyyy-MM-dd"),
  );
  const [notes, setNotes] = useState("");

  // Components state
  const [selectedComponents, setSelectedComponents] = useState<
    {
      componentId: string;
      customAmount?: number;
      customPercentage?: number;
    }[]
  >([]);

  const { data: salariesData, isLoading } = useStaffSalaries({
    unitId: unitFilter || undefined,
    isActive: true,
  });
  const { data: units } = useUnits();
  const { data: staffList } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const response = await api.get("/hr/staff");
      return response.data.data as Staff[];
    },
  });
  const { data: components } = useSalaryComponents({ isActive: true });

  const createSalary = useCreateStaffSalary();
  const updateSalary = useUpdateStaffSalary();
  const setComponents = useSetStaffSalaryComponents();

  const salaries = salariesData?.data || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const resetForm = () => {
    setSelectedStaffId("");
    setBaseSalary("");
    setEffectiveDate(safeFormat(new Date(), "yyyy-MM-dd"));
    setNotes("");
    setEditingSalary(null);
  };

  const openEditForm = (salary: StaffSalary) => {
    setEditingSalary(salary);
    setSelectedStaffId(salary.staffId);
    setBaseSalary(salary.baseSalary.toString());
    setEffectiveDate(safeFormat(new Date(salary.effectiveDate), "yyyy-MM-dd"));
    setNotes(salary.notes || "");
    setIsFormOpen(true);
  };

  const openComponentsSheet = (salary: StaffSalary) => {
    setSelectedSalary(salary);
    // Initialize selected components from existing salary components
    const existing =
      salary.components?.map((c) => ({
        componentId: c.componentId,
        customAmount: c.customAmount,
        customPercentage: c.customPercentage,
      })) || [];
    setSelectedComponents(existing);
    setIsComponentsOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedStaffId || !baseSalary) {
      toast.error("Staff dan gaji pokok wajib diisi");
      return;
    }

    const data = {
      staffId: selectedStaffId,
      baseSalary: parseFloat(baseSalary),
      effectiveDate: new Date(effectiveDate).toISOString(),
      notes: notes || undefined,
    };

    try {
      if (editingSalary) {
        await updateSalary.mutateAsync({ id: editingSalary.id, data });
        toast.success("Konfigurasi gaji berhasil diupdate");
      } else {
        await createSalary.mutateAsync(data);
        toast.success("Konfigurasi gaji berhasil dibuat");
      }
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Gagal menyimpan konfigurasi gaji");
    }
  };

  const handleSaveComponents = async () => {
    if (!selectedSalary) return;

    try {
      await setComponents.mutateAsync({
        staffSalaryId: selectedSalary.id,
        components: selectedComponents,
      });
      toast.success("Komponen gaji berhasil disimpan");
      setIsComponentsOpen(false);
    } catch (error) {
      toast.error("Gagal menyimpan komponen gaji");
    }
  };

  const toggleComponent = (componentId: string) => {
    const exists = selectedComponents.find(
      (c) => c.componentId === componentId,
    );
    if (exists) {
      setSelectedComponents(
        selectedComponents.filter((c) => c.componentId !== componentId),
      );
    } else {
      setSelectedComponents([...selectedComponents, { componentId }]);
    }
  };

  const updateComponentAmount = (
    componentId: string,
    amount: number | undefined,
  ) => {
    setSelectedComponents(
      selectedComponents.map((c) =>
        c.componentId === componentId ? { ...c, customAmount: amount } : c,
      ),
    );
  };

  const filteredSalaries = salaries.filter((salary) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        salary.staff?.fullName?.toLowerCase().includes(searchLower) ||
        salary.staff?.nip?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Calculate totals
  const totalBaseSalary = filteredSalaries.reduce(
    (sum, s) => sum + s.baseSalary,
    0,
  );

  // Get staff without salary config
  const staffWithoutSalary =
    staffList?.filter(
      (staff) => !salaries.some((s) => s.staffId === staff.id),
    ) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/hr/payroll")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Konfigurasi Gaji Karyawan
              </h1>
              <p className="text-muted-foreground">
                Kelola gaji pokok dan komponen gaji per karyawan
              </p>
            </div>
          </div>
          <Dialog
            open={isFormOpen}
            onOpenChange={(open) => {
              setIsFormOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Konfigurasi
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSalary
                    ? "Edit Konfigurasi Gaji"
                    : "Tambah Konfigurasi Gaji"}
                </DialogTitle>
                <DialogDescription>
                  {editingSalary
                    ? "Update konfigurasi gaji karyawan"
                    : "Buat konfigurasi gaji untuk karyawan baru"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Karyawan *</Label>
                  <Select
                    value={selectedStaffId}
                    onValueChange={setSelectedStaffId}
                    disabled={!!editingSalary}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih karyawan" />
                    </SelectTrigger>
                    <SelectContent>
                      {(editingSalary ? staffList : staffWithoutSalary)?.map(
                        (staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.fullName} {staff.nip ? `(${staff.nip})` : ""}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gaji Pokok *</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Berlaku</Label>
                  <Input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Input
                    placeholder="Catatan opsional..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Batal
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createSalary.isPending || updateSalary.isPending}
                >
                  {(createSalary.isPending || updateSalary.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingSalary ? "Update" : "Simpan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Karyawan
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredSalaries.length}
              </div>
              <p className="text-xs text-muted-foreground">
                dengan konfigurasi gaji
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Gaji Pokok
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalBaseSalary)}
              </div>
              <p className="text-xs text-muted-foreground">per bulan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Belum Dikonfigurasi
              </CardTitle>
              <Settings2 className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {staffWithoutSalary.length}
              </div>
              <p className="text-xs text-muted-foreground">karyawan</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau NIP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Semua Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Unit</SelectItem>
                  {units?.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIP</TableHead>
                <TableHead>Nama Karyawan</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead className="text-right">Gaji Pokok</TableHead>
                <TableHead>Berlaku Sejak</TableHead>
                <TableHead className="text-center">Komponen</TableHead>
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
              ) : filteredSalaries.length ? (
                filteredSalaries.map((salary) => (
                  <TableRow key={salary.id}>
                    <TableCell className="font-mono text-sm">
                      {salary.staff?.nip || "-"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{salary.staff?.fullName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{salary.staff?.position || "-"}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(salary.baseSalary)}
                    </TableCell>
                    <TableCell>
                      {safeFormat(
                        new Date(salary.effectiveDate),
                        "d MMM yyyy",
                        {
                          locale: id,
                        },
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {salary.components?.length || 0} komponen
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditForm(salary)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openComponentsSheet(salary)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Belum ada konfigurasi gaji
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Components Sheet */}
        <Sheet open={isComponentsOpen} onOpenChange={setIsComponentsOpen}>
          <SheetContent className="w-[500px] sm:max-w-[500px]">
            <SheetHeader>
              <SheetTitle>Komponen Gaji</SheetTitle>
              <SheetDescription>
                Atur komponen tunjangan dan potongan untuk{" "}
                {selectedSalary?.staff?.fullName}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* Allowances */}
              <div>
                <h3 className="font-semibold text-green-700 mb-3">Tunjangan</h3>
                <div className="space-y-3">
                  {components
                    ?.filter((c) => c.type === "ALLOWANCE")
                    .map((component) => {
                      const selected = selectedComponents.find(
                        (s) => s.componentId === component.id,
                      );
                      return (
                        <div
                          key={component.id}
                          className="flex items-center gap-3 p-3 border rounded-lg"
                        >
                          <Checkbox
                            checked={!!selected}
                            onCheckedChange={() =>
                              toggleComponent(component.id)
                            }
                          />
                          <div className="flex-1">
                            <p className="font-medium">{component.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Default:{" "}
                              {component.defaultAmount
                                ? formatCurrency(component.defaultAmount)
                                : component.percentage
                                  ? `${component.percentage}%`
                                  : "-"}
                            </p>
                          </div>
                          {selected &&
                            component.calculationType === "FIXED" && (
                              <Input
                                type="number"
                                placeholder="Custom"
                                className="w-32"
                                value={selected.customAmount || ""}
                                onChange={(e) =>
                                  updateComponentAmount(
                                    component.id,
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined,
                                  )
                                }
                              />
                            )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="font-semibold text-red-700 mb-3">Potongan</h3>
                <div className="space-y-3">
                  {components
                    ?.filter((c) => c.type === "DEDUCTION")
                    .map((component) => {
                      const selected = selectedComponents.find(
                        (s) => s.componentId === component.id,
                      );
                      return (
                        <div
                          key={component.id}
                          className="flex items-center gap-3 p-3 border rounded-lg"
                        >
                          <Checkbox
                            checked={!!selected}
                            onCheckedChange={() =>
                              toggleComponent(component.id)
                            }
                          />
                          <div className="flex-1">
                            <p className="font-medium">{component.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Default:{" "}
                              {component.defaultAmount
                                ? formatCurrency(component.defaultAmount)
                                : component.percentage
                                  ? `${component.percentage}%`
                                  : "-"}
                            </p>
                          </div>
                          {selected &&
                            component.calculationType === "FIXED" && (
                              <Input
                                type="number"
                                placeholder="Custom"
                                className="w-32"
                                value={selected.customAmount || ""}
                                onChange={(e) =>
                                  updateComponentAmount(
                                    component.id,
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined,
                                  )
                                }
                              />
                            )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsComponentsOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveComponents}
                  disabled={setComponents.isPending}
                >
                  {setComponents.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Simpan
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </MainLayout>
  );
}
