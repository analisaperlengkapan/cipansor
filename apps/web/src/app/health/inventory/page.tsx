"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  History,
  Trash2,
  Edit,
  ArrowUpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import {
  useMedications,
  useCreateMedication,
  useAddMedicationStock,
  useDeleteMedication,
} from "@/hooks/use-health";

// --- COMPONENTS ---

function AddMedicationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuthStore();
  const createMutation = useCreateMedication();
  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    type: "TABLET",
    dosageForm: "",
    minStock: 10,
    quantity: 0,
    expiryDate: "",
    supplier: "",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!user?.unitId) return;
    try {
      await createMutation.mutateAsync({
        ...formData,
        unitId: user.unitId,
        quantity: Number(formData.quantity),
        minStock: Number(formData.minStock),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
      });
      toast.success("Obat berhasil ditambahkan");
      onOpenChange(false);
      setFormData({
        name: "",
        genericName: "",
        type: "TABLET",
        dosageForm: "",
        minStock: 10,
        quantity: 0,
        expiryDate: "",
        supplier: "",
        notes: "",
      });
    } catch {
      toast.error("Gagal menambahkan obat");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Obat Baru</DialogTitle>
          <DialogDescription>
            Masukkan detail obat untuk inventaris UKS.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Obat</Label>
              <Input
                placeholder="Contoh: Paracetamol"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nama Generik (Opsional)</Label>
              <Input
                placeholder="Contoh: Acetaminophen"
                value={formData.genericName}
                onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Jenis</Label>
              <Select
                value={formData.type}
                onValueChange={(val) => setFormData({ ...formData, type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TABLET">Tablet / Kapsul</SelectItem>
                  <SelectItem value="SYRUP">Sirup</SelectItem>
                  <SelectItem value="OINTMENT">Salep / Cream</SelectItem>
                  <SelectItem value="DROP">Tetes (Drop)</SelectItem>
                  <SelectItem value="INJECTION">Injeksi</SelectItem>
                  <SelectItem value="OTHER">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dosis / Kemasan</Label>
              <Input
                placeholder="Contoh: 500mg, 60ml"
                value={formData.dosageForm}
                onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stok Awal</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Min. Stok</Label>
              <Input
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Kadaluarsa</Label>
            <Input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending || !formData.name}>
            {createMutation.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RestockDialog({
  item,
  open,
  onOpenChange,
}: {
  item: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const stockMutation = useAddMedicationStock();
  const [amount, setAmount] = useState(10);

  const handleSubmit = async () => {
    try {
      await stockMutation.mutateAsync({ id: item.id, quantity: amount });
      toast.success("Stok berhasil ditambahkan");
      onOpenChange(false);
    } catch {
      toast.error("Gagal menambah stok");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Restock Obat</DialogTitle>
          <DialogDescription>
            Menambah stok untuk <strong>{item.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label>Jumlah Penambahan</Label>
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={stockMutation.isPending}>
            {stockMutation.isPending ? "Proses..." : "Tambah Stok"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- MAIN PAGE ---

export default function InventoryPage() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<any>(null);

  const { data: medications, isLoading } = useMedications({
    page,
    limit: 10,
    unitId: user?.unitId,
    search,
  });

  const deleteMutation = useDeleteMedication();

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Obat dihapus");
    } catch {
      toast.error("Gagal menghapus obat");
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventaris Obat</h1>
          <p className="text-muted-foreground">
            Kelola stok obat-obatan di UKS.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Obat
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Obat</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama obat..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Package className="h-8 w-8 animate-bounce text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Obat</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Kadaluarsa</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medications?.data?.map((item) => {
                  const isLowStock = item.quantity <= item.minStock;
                  const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.genericName} • {item.dosageForm}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={isLowStock ? "text-red-600 font-bold" : ""}>
                            {item.quantity}
                          </span>
                          {isLowStock && (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={isExpired ? "text-red-500" : ""}>
                          {item.expiryDate
                            ? format(new Date(item.expiryDate), "dd MMM yyyy", { locale: localeId })
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setRestockItem(item)}
                            title="Restock"
                          >
                            <ArrowUpCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <ConfirmDialog
                            title="Hapus Obat"
                            description="Yakin ingin menghapus obat ini?"
                            onConfirm={() => handleDelete(item.id)}
                          >
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </ConfirmDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {medications?.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Tidak ada data obat.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {medications && medications.meta.pagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                page={page}
                totalPages={medications.meta.pagination.totalPages}
                pageSize={medications.meta.pagination.limit}
                total={medications.meta.pagination.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <AddMedicationDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      {restockItem && (
        <RestockDialog
          item={restockItem}
          open={!!restockItem}
          onOpenChange={(o) => !o && setRestockItem(null)}
        />
      )}
    </div>
  );
}
