"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, RefreshCw, Filter, CreditCard, Tag } from "lucide-react";
import { toast } from "sonner";

import {
  usePaymentComponents,
  useCreatePaymentComponent,
  type PaymentComponent,
  PaymentCategory,
} from "@/hooks/use-finance-enhancement";
import { useUnits } from "@/hooks/use-units";

const CATEGORY_LABELS: Record<PaymentCategory, string> = {
  [PaymentCategory.SPP]: "SPP Bulanan",
  [PaymentCategory.REGISTRATION]: "Pendaftaran",
  [PaymentCategory.UNIFORM]: "Seragam",
  [PaymentCategory.BOOK]: "Buku Paket",
  [PaymentCategory.ACTIVITY]: "Kegiatan",
  [PaymentCategory.EXAM]: "Ujian",
  [PaymentCategory.BUILDING]: "Uang Gedung",
  [PaymentCategory.OTHER]: "Lainnya",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PaymentComponentsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PaymentCategory | "ALL">(
    "ALL",
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string | "ALL">("ALL");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: unitsData } = useUnits();
  const {
    data: componentsData,
    isLoading,
    refetch,
  } = usePaymentComponents({
    category: categoryFilter === "ALL" ? undefined : categoryFilter,
    unitId: selectedUnitId === "ALL" ? undefined : selectedUnitId,
    limit: 100,
  });

  const createComponent = useCreatePaymentComponent();

  const handleCreate = async (formData: FormData) => {
    try {
      const amount = parseFloat(formData.get("amount") as string) || 0;
      if (amount <= 0) {
        toast.error("Nominal harus lebih dari 0");
        return;
      }

      await createComponent.mutateAsync({
        code: formData.get("code") as string,
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as PaymentCategory,
        amount,
        unitId: (formData.get("unitId") as string) || undefined,
        isActive: true,
      });
      toast.success("Komponen pembayaran berhasil ditambahkan");
      setIsAddDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Gagal menambahkan komponen",
      );
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Komponen Pembayaran"
          description="Kelola jenis tagihan dan biaya pendidikan"
        />

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama komponen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(v) =>
              setCategoryFilter(v as PaymentCategory | "ALL")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kategori</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Unit</SelectItem>
              {unitsData?.map((unit: any) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Komponen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form action={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Tambah Komponen Pembayaran</DialogTitle>
                  <DialogDescription>
                    Buat jenis tagihan baru untuk siswa
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Kode</Label>
                      <Input
                        id="code"
                        name="code"
                        placeholder="SPP-SD"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Kategori</Label>
                      <Select name="category" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORY_LABELS).map(
                            ([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Komponen</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="SPP Bulanan SD"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Nominal (Rp)</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      min="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitId">Unit (Opsional)</Label>
                    <Select name="unitId">
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Berlaku Semua Unit</SelectItem>
                        {unitsData?.map((unit: any) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Keterangan tambahan..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={createComponent.isPending}>
                    {createComponent.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Komponen</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : componentsData?.data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Belum ada komponen pembayaran
                    </TableCell>
                  </TableRow>
                ) : (
                  componentsData?.data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-medium">
                        {item.code}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {item.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORY_LABELS[item.category as PaymentCategory] ||
                            item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.unit ? (
                          <Badge variant="secondary" className="font-normal">
                            {item.unit.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Semua Unit
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.isActive ? "default" : "secondary"}
                        >
                          {item.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
