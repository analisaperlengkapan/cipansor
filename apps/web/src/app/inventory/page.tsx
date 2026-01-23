"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Package,
  Eye,
  Edit,
  Trash2,
  Filter,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";
import {
  useInventoryItems,
  useInventoryCategories,
  useDeleteInventoryItem,
  useInventorySummary,
  AssetCondition,
  AssetStatus,
} from "@/hooks/use-inventory";

function getConditionBadge(condition: AssetCondition) {
  const colorMap: Record<AssetCondition, string> = {
    [AssetCondition.EXCELLENT]: "bg-green-100 text-green-800",
    [AssetCondition.GOOD]: "bg-blue-100 text-blue-800",
    [AssetCondition.FAIR]: "bg-yellow-100 text-yellow-800",
    [AssetCondition.POOR]: "bg-orange-100 text-orange-800",
    [AssetCondition.BROKEN]: "bg-red-100 text-red-800",
  };

  return (
    <Badge variant="outline" className={colorMap[condition] || "bg-gray-100"}>
      {condition}
    </Badge>
  );
}

function getStatusBadge(status: AssetStatus) {
  const colorMap: Record<AssetStatus, string> = {
    [AssetStatus.ACTIVE]: "bg-green-100 text-green-800",
    [AssetStatus.MAINTENANCE]: "bg-yellow-100 text-yellow-800",
    [AssetStatus.DAMAGED]: "bg-red-100 text-red-800",
    [AssetStatus.DISPOSED]: "bg-gray-100 text-gray-800",
  };

  return (
    <Badge variant="outline" className={colorMap[status] || "bg-gray-100"}>
      {status}
    </Badge>
  );
}

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: inventoryData, isLoading } = useInventoryItems({
    page,
    limit: 10,
    search: search || undefined,
    categoryId: categoryId !== "all" ? categoryId : undefined,
    condition:
      conditionFilter !== "all"
        ? (conditionFilter as AssetCondition)
        : undefined,
    status: statusFilter !== "all" ? (statusFilter as AssetStatus) : undefined,
  });

  const { data: categories } = useInventoryCategories();
  const { data: summaryData } = useInventorySummary();
  const deleteMutation = useDeleteInventoryItem();

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Inventaris berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus inventaris");
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Inventaris (Aset)
          </h1>
          <p className="text-muted-foreground">
            Kelola data aset dan inventaris pesantren
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/inventory/assignments">Peminjaman</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/inventory/audits">Stock Opname</Link>
          </Button>
          <Button asChild>
            <Link href="/inventory/new">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Aset
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aset</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryData?.totalItems || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Aktif</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryData?.byStatus?.find(
                (s) => s.status === AssetStatus.ACTIVE,
              )?.count || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Perlu Maintenance
            </CardTitle>
            <div className="h-4 w-4 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryData?.recentMaintenances || 0}
            </div>
            <p className="text-xs text-muted-foreground">30 hari terakhir</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Nilai Aset
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryData?.totalValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama, kode, brand..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />

          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {Object.values(AssetStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Kondisi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kondisi</SelectItem>
              {Object.values(AssetCondition).map((cond) => (
                <SelectItem key={cond} value={cond}>
                  {cond}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : inventoryData?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                Belum ada data inventaris
              </p>
              <Button asChild className="mt-4">
                <Link href="/inventory/new">Tambah Aset Baru</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Kondisi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData?.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">
                      {item.code}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      {item.brand && (
                        <div className="text-xs text-muted-foreground">
                          {item.brand} {item.model}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{item.category?.name || "-"}</TableCell>
                    <TableCell>{item.location || "-"}</TableCell>
                    <TableCell>{getConditionBadge(item.condition)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/inventory/${item.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/inventory/${item.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <ConfirmDialog
                          title="Hapus Aset"
                          description="Apakah Anda yakin ingin menghapus data aset ini? Data yang dihapus tidak dapat dikembalikan."
                          onConfirm={() => handleDelete(item.id)}
                          loading={deleteMutation.isPending}
                        >
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </ConfirmDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {inventoryData && inventoryData.meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={inventoryData.meta.totalPages}
          pageSize={inventoryData.meta.limit}
          total={inventoryData.meta.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
