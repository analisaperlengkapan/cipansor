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
import { 
  Plus, 
  Search, 
  RefreshCw,
  Layers,
  CreditCard,
  BookOpen,
  Shirt,
  GraduationCap,
  Trophy,
  FileText,
  Building,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";

import {
  usePaymentComponents,
  useCreatePaymentComponent,
  type PaymentComponent,
  type PaymentComponentCategory,
} from "@/hooks/use-finance-enhancement";
import { useUnits } from "@/hooks/use-units";

// Payment component categories with icons and colors
const PAYMENT_CATEGORIES: { 
  value: PaymentComponentCategory; 
  label: string; 
  icon: React.ReactNode;
  color: string;
}[] = [
  { value: "SPP", label: "SPP", icon: <CreditCard className="h-4 w-4" />, color: "bg-blue-500" },
  { value: "REGISTRATION", label: "Pendaftaran", icon: <FileText className="h-4 w-4" />, color: "bg-purple-500" },
  { value: "UNIFORM", label: "Seragam", icon: <Shirt className="h-4 w-4" />, color: "bg-green-500" },
  { value: "BOOKS", label: "Buku", icon: <BookOpen className="h-4 w-4" />, color: "bg-yellow-500" },
  { value: "ACTIVITY", label: "Kegiatan", icon: <Trophy className="h-4 w-4" />, color: "bg-orange-500" },
  { value: "EXAM", label: "Ujian", icon: <GraduationCap className="h-4 w-4" />, color: "bg-red-500" },
  { value: "BUILDING", label: "Pembangunan", icon: <Building className="h-4 w-4" />, color: "bg-cyan-500" },
  { value: "OTHER", label: "Lainnya", icon: <MoreHorizontal className="h-4 w-4" />, color: "bg-gray-500" },
];

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
  const [categoryFilter, setCategoryFilter] = useState<PaymentComponentCategory | "ALL">("ALL");
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: unitsData } = useUnits();
  const { data: componentsData, isLoading, refetch } = usePaymentComponents({
    category: categoryFilter === "ALL" ? undefined : categoryFilter,
    unitId: selectedUnitId,
    limit: 100,
  });

  const createComponent = useCreatePaymentComponent();

  const handleCreateComponent = async (formData: FormData) => {
    try {
      await createComponent.mutateAsync({
        code: formData.get("code") as string,
        name: formData.get("name") as string,
        description: formData.get("description") as string || undefined,
        category: formData.get("category") as PaymentComponentCategory,
        amount: parseFloat(formData.get("amount") as string),
        unitId: formData.get("unitId") as string || undefined,
        isActive: true,
      });
      toast.success("Komponen pembayaran berhasil ditambahkan");
      setIsAddDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menambahkan komponen pembayaran");
    }
  };

  const getCategoryInfo = (category: PaymentComponentCategory) => {
    return PAYMENT_CATEGORIES.find(c => c.value === category);
  };

  const getCategoryBadge = (category: PaymentComponentCategory) => {
    const info = getCategoryInfo(category);
    return (
      <Badge className={`${info?.color} text-white border-0 flex items-center gap-1 w-fit`}>
        {info?.icon}
        {info?.label || category}
      </Badge>
    );
  };

  // Calculate stats by category
  const categoryStats = PAYMENT_CATEGORIES.map(cat => {
    const items = componentsData?.data.filter(c => c.category === cat.value) || [];
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    return {
      ...cat,
      count: items.length,
      totalAmount,
    };
  }).filter(cat => cat.count > 0);

  const totalComponents = componentsData?.data.length || 0;
  const activeComponents = componentsData?.data.filter(c => c.isActive).length || 0;

  const filteredComponents = componentsData?.data.filter(component => {
    if (search && !component.name.toLowerCase().includes(search.toLowerCase()) && 
        !component.code.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Komponen Pembayaran"
          description="Kelola jenis-jenis komponen pembayaran sekolah/pesantren"
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Komponen</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalComponents}</div>
              <p className="text-xs text-muted-foreground">Jenis komponen</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Komponen Aktif</CardTitle>
              <CreditCard className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeComponents}</div>
              <p className="text-xs text-muted-foreground">Dapat digunakan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Kategori</CardTitle>
              <Layers className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{categoryStats.length}</div>
              <p className="text-xs text-muted-foreground">Jenis kategori</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata Nominal</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {componentsData?.data.length 
                  ? formatCurrency(componentsData.data.reduce((sum, c) => sum + c.amount, 0) / componentsData.data.length)
                  : "-"
                }
              </div>
              <p className="text-xs text-muted-foreground">Per komponen</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Stats */}
        {categoryStats.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
            {categoryStats.map((cat) => (
              <Card key={cat.value} className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setCategoryFilter(cat.value)}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${cat.color}`}>
                      {cat.icon}
                    </div>
                    <span className="text-lg font-bold">{cat.count}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{cat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kode atau nama komponen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as PaymentComponentCategory | "ALL")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kategori</SelectItem>
              {PAYMENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    {cat.icon}
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedUnitId || "ALL"} onValueChange={(v) => setSelectedUnitId(v === "ALL" ? undefined : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter unit" />
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
              <form action={handleCreateComponent}>
                <DialogHeader>
                  <DialogTitle>Tambah Komponen Pembayaran</DialogTitle>
                  <DialogDescription>
                    Buat jenis komponen pembayaran baru
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Kode</Label>
                      <Input id="code" name="code" placeholder="SPP-001" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Kategori</Label>
                      <Select name="category" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <div className="flex items-center gap-2">
                                {cat.icon}
                                {cat.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Komponen</Label>
                    <Input id="name" name="name" placeholder="SPP Bulanan" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      placeholder="Deskripsi komponen pembayaran..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Nominal (Rp)</Label>
                      <Input 
                        id="amount" 
                        name="amount" 
                        type="number" 
                        min="0"
                        placeholder="500000" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unitId">Unit</Label>
                      <Select name="unitId">
                        <SelectTrigger>
                          <SelectValue placeholder="Semua unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Semua Unit</SelectItem>
                          {unitsData?.map((unit: any) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
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

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Komponen</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Unit</TableHead>
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
                ) : filteredComponents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {search || categoryFilter !== "ALL" 
                        ? "Tidak ada komponen yang sesuai filter"
                        : "Belum ada komponen pembayaran"
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredComponents.map((component) => (
                    <TableRow key={component.id}>
                      <TableCell className="font-mono font-medium">{component.code}</TableCell>
                      <TableCell>
                        <div className="font-medium">{component.name}</div>
                        {component.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {component.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getCategoryBadge(component.category)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(component.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {component.unit?.name || "Semua Unit"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={component.isActive ? "default" : "secondary"}>
                          {component.isActive ? "Aktif" : "Nonaktif"}
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
