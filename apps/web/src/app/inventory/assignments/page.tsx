"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAssetAssignments } from "@/hooks/use-inventory";
import { MainLayout } from "@/components/layout";

function InventoryAssignmentsPageContent() {
  const [page, setPage] = useState(1);
  const { data: assignments, isLoading } = useAssetAssignments({
    page,
    limit: 10,
  });

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
              Peminjaman Aset
            </h1>
            <p className="text-muted-foreground">
              Kelola peminjaman aset ke pegawai/guru
            </p>
          </div>
        </div>
        {/* Creating assignment usually happens from Asset Detail or a specific form, simplified here */}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : assignments?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Belum ada data peminjaman</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aset</TableHead>
                  <TableHead>Peminjam</TableHead>
                  <TableHead>Tanggal Pinjam</TableHead>
                  <TableHead>Batas Kembali</TableHead>
                  <TableHead>Tanggal Kembali</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments?.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.asset?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.asset?.code}
                      </div>
                    </TableCell>
                    <TableCell>{item.user?.name || "-"}</TableCell>
                    <TableCell>{formatDate(item.assignedAt)}</TableCell>
                    <TableCell>{formatDate(item.dueDate)}</TableCell>
                    <TableCell>{formatDate(item.returnedAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "ACTIVE" ? "default" : "secondary"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.assetId && (
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/inventory/${item.assetId}?tab=assignments`}
                          >
                            Lihat Aset
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {assignments && assignments.meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={assignments.meta.totalPages}
          pageSize={assignments.meta.limit}
          total={assignments.meta.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

export default function InventoryAssignmentsPage() {
  return (
    <MainLayout>
      <InventoryAssignmentsPageContent />
    </MainLayout>
  );
}
