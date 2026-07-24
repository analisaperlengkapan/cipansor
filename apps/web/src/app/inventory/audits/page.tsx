"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/pagination";
import { useAssetAudits, useCreateAudit } from "@/hooks/use-inventory";
import { useUnits } from "@/hooks/use-units";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MainLayout } from "@/components/layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function InventoryAuditsPageContent() {
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  const { data: audits, isLoading } = useAssetAudits({
    page,
    limit: 10,
  });
  const { data: units } = useUnits();
  const createMutation = useCreateAudit();

  const handleCreate = async () => {
    if (!selectedUnitId) return;
    try {
      await createMutation.mutateAsync({
        unitId: selectedUnitId,
        date: new Date(),
      });
      toast.success("Audit berhasil dibuat");
      setIsCreateOpen(false);
    } catch {
      toast.error("Gagal membuat audit");
    }
  };

  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Stock Opname (Audit)
            </h1>
            <p className="text-muted-foreground">
              Riwayat dan pelaksanaan audit aset
            </p>
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Mulai Audit Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mulai Stock Opname Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Pilih Unit</Label>
                <Select
                  value={selectedUnitId}
                  onValueChange={setSelectedUnitId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih unit..." />
                  </SelectTrigger>
                  <SelectContent>
                    {units?.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Audit akan mencakup seluruh aset yang terdaftar pada unit ini.
                </p>
              </div>
              <Button
                onClick={handleCreate}
                disabled={!selectedUnitId || createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? "Memproses..." : "Buat Audit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : audits?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Belum ada riwayat audit</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat Oleh</TableHead>
                  <TableHead>Total Item</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits?.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell>{item.unit?.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "COMPLETED" ? "default" : "outline"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.createdBy?.name || "-"}</TableCell>
                    <TableCell>{item._count?.items || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/inventory/audits/${item.id}`}>
                          Detail
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {audits && audits.meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={audits.meta.totalPages}
          pageSize={audits.meta.limit}
          total={audits.meta.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

export default function InventoryAuditsPage() {
  return (
    <MainLayout>
      <InventoryAuditsPageContent />
    </MainLayout>
  );
}
