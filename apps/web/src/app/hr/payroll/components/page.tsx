"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  useSalaryComponents,
  useCreateSalaryComponent,
  useUpdateSalaryComponent,
  useDeleteSalaryComponent,
  type SalaryComponent,
  type ComponentType,
  type CalculationType,
  COMPONENT_TYPE_LABELS,
  CALCULATION_TYPE_LABELS,
} from "@/hooks";
import {
  ArrowLeft,
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  DollarSign,
  Calculator,
  Percent,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

export default function SalaryComponentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ComponentType | "ALL">("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingComponent, setEditingComponent] =
    useState<SalaryComponent | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ComponentType>("ALLOWANCE");
  const [calculationType, setCalculationType] =
    useState<CalculationType>("FIXED");
  const [defaultAmount, setDefaultAmount] = useState("");
  const [percentage, setPercentage] = useState("");
  const [formula, setFormula] = useState("");
  const [isTaxable, setIsTaxable] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

  const { data: components, isLoading } = useSalaryComponents({
    type: typeFilter !== "ALL" ? typeFilter : undefined,
    search: search || undefined,
  });
  const createComponent = useCreateSalaryComponent();
  const updateComponent = useUpdateSalaryComponent();
  const deleteComponent = useDeleteSalaryComponent();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const resetForm = () => {
    setCode("");
    setName("");
    setDescription("");
    setType("ALLOWANCE");
    setCalculationType("FIXED");
    setDefaultAmount("");
    setPercentage("");
    setFormula("");
    setIsTaxable(true);
    setIsActive(true);
    setSortOrder("0");
    setEditingComponent(null);
  };

  const openEditForm = (component: SalaryComponent) => {
    setEditingComponent(component);
    setCode(component.code);
    setName(component.name);
    setDescription(component.description || "");
    setType(component.type);
    setCalculationType(component.calculationType);
    setDefaultAmount(component.defaultAmount?.toString() || "");
    setPercentage(component.percentage?.toString() || "");
    setFormula(component.formula || "");
    setIsTaxable(component.isTaxable);
    setIsActive(component.isActive);
    setSortOrder(component.sortOrder.toString());
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!code || !name) {
      toast.error("Kode dan nama wajib diisi");
      return;
    }

    const data = {
      code,
      name,
      description: description || undefined,
      type,
      calculationType,
      defaultAmount: defaultAmount ? parseFloat(defaultAmount) : undefined,
      percentage: percentage ? parseFloat(percentage) : undefined,
      formula: formula || undefined,
      isTaxable,
      isActive,
      sortOrder: parseInt(sortOrder) || 0,
    };

    try {
      if (editingComponent) {
        await updateComponent.mutateAsync({ id: editingComponent.id, data });
        toast.success("Komponen gaji berhasil diupdate");
      } else {
        await createComponent.mutateAsync(data);
        toast.success("Komponen gaji berhasil dibuat");
      }
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Gagal menyimpan komponen gaji");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteComponent.mutateAsync(deletingId);
      toast.success("Komponen gaji berhasil dihapus");
      setIsDeleteOpen(false);
      setDeletingId(null);
    } catch (error) {
      toast.error("Gagal menghapus komponen gaji");
    }
  };

  const filteredComponents = (components || []).filter((comp) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        comp.code.toLowerCase().includes(searchLower) ||
        comp.name.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const allowances = filteredComponents.filter((c) => c.type === "ALLOWANCE");
  const deductions = filteredComponents.filter((c) => c.type === "DEDUCTION");

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
                Komponen Gaji
              </h1>
              <p className="text-muted-foreground">
                Kelola komponen tunjangan dan potongan gaji
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
                Tambah Komponen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingComponent
                    ? "Edit Komponen Gaji"
                    : "Tambah Komponen Gaji"}
                </DialogTitle>
                <DialogDescription>
                  {editingComponent
                    ? "Update informasi komponen gaji"
                    : "Buat komponen gaji baru untuk tunjangan atau potongan"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kode *</Label>
                    <Input
                      placeholder="TJ-001"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipe *</Label>
                    <Select
                      value={type}
                      onValueChange={(v) => setType(v as ComponentType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALLOWANCE">Tunjangan</SelectItem>
                        <SelectItem value="DEDUCTION">Potongan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nama Komponen *</Label>
                  <Input
                    placeholder="Tunjangan Jabatan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Textarea
                    placeholder="Deskripsi komponen gaji..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jenis Kalkulasi</Label>
                    <Select
                      value={calculationType}
                      onValueChange={(v) =>
                        setCalculationType(v as CalculationType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIXED">Nominal Tetap</SelectItem>
                        <SelectItem value="PERCENTAGE">Persentase</SelectItem>
                        <SelectItem value="FORMULA">Formula</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Urutan</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                    />
                  </div>
                </div>
                {calculationType === "FIXED" && (
                  <div className="space-y-2">
                    <Label>Nominal Default</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={defaultAmount}
                      onChange={(e) => setDefaultAmount(e.target.value)}
                    />
                  </div>
                )}
                {calculationType === "PERCENTAGE" && (
                  <div className="space-y-2">
                    <Label>Persentase (%)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      step="0.1"
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Persentase dari gaji pokok
                    </p>
                  </div>
                )}
                {calculationType === "FORMULA" && (
                  <div className="space-y-2">
                    <Label>Formula</Label>
                    <Textarea
                      placeholder="baseSalary * 0.1"
                      value={formula}
                      onChange={(e) => setFormula(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Variabel: baseSalary, workDays, absentDays
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Kena Pajak</Label>
                    <p className="text-xs text-muted-foreground">
                      Komponen ini dikenakan PPh 21
                    </p>
                  </div>
                  <Switch checked={isTaxable} onCheckedChange={setIsTaxable} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aktif</Label>
                    <p className="text-xs text-muted-foreground">
                      Komponen dapat digunakan dalam penggajian
                    </p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Batal
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    createComponent.isPending || updateComponent.isPending
                  }
                >
                  {(createComponent.isPending || updateComponent.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingComponent ? "Update" : "Simpan"}
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
                Total Komponen
              </CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredComponents.length}
              </div>
              <p className="text-xs text-muted-foreground">komponen gaji</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tunjangan</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {allowances.length}
              </div>
              <p className="text-xs text-muted-foreground">
                komponen tunjangan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Potongan</CardTitle>
              <Percent className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {deductions.length}
              </div>
              <p className="text-xs text-muted-foreground">komponen potongan</p>
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
                  placeholder="Cari kode atau nama..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as ComponentType | "ALL")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Tipe</SelectItem>
                  <SelectItem value="ALLOWANCE">Tunjangan</SelectItem>
                  <SelectItem value="DEDUCTION">Potongan</SelectItem>
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
                <TableHead>Kode</TableHead>
                <TableHead>Nama Komponen</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Kalkulasi</TableHead>
                <TableHead className="text-right">Nilai Default</TableHead>
                <TableHead className="text-center">Pajak</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredComponents.length ? (
                filteredComponents.map((component) => (
                  <TableRow key={component.id}>
                    <TableCell className="font-mono text-sm">
                      {component.code}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{component.name}</p>
                        {component.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {component.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          component.type === "ALLOWANCE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {COMPONENT_TYPE_LABELS[component.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CALCULATION_TYPE_LABELS[component.calculationType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {component.calculationType === "FIXED" &&
                      component.defaultAmount
                        ? formatCurrency(component.defaultAmount)
                        : component.calculationType === "PERCENTAGE" &&
                            component.percentage
                          ? `${component.percentage}%`
                          : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {component.isTaxable ? (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Ya
                        </Badge>
                      ) : (
                        <Badge variant="outline">Tidak</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {component.isActive ? (
                        <Badge className="bg-green-100 text-green-800">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline">Nonaktif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditForm(component)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingId(component.id);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Belum ada komponen gaji
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Delete Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Komponen Gaji</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus komponen gaji ini? Tindakan
                ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteComponent.isPending}
              >
                {deleteComponent.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
