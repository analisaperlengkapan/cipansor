"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
import { useMaintenances } from "@/hooks/use-inventory";
import { Pagination } from "@/components/shared/pagination";
import { MaintenanceRequestDialog } from "./components/request-dialog";

export default function MaintenanceSchedulePage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useMaintenances({
    page,
    limit: 10,
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Jadwal Maintenance
          </h1>
          <p className="text-muted-foreground">
            Daftar riwayat dan rencana pemeliharaan aset
          </p>
        </div>
        <div className="ml-auto">
          <MaintenanceRequestDialog />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Aset</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pelaksana</TableHead>
                <TableHead>Jadwal Berikutnya</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{formatDate(m.maintenanceDate)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/inventory/${m.assetId}`}
                        className="hover:underline font-medium"
                      >
                        {m.asset?.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {m.asset?.code}
                      </div>
                    </TableCell>
                    <TableCell>{m.type}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.status}</Badge>
                    </TableCell>
                    <TableCell>{m.performedBy || "-"}</TableCell>
                    <TableCell>
                      {m.nextSchedule ? formatDate(m.nextSchedule) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/inventory/${m.assetId}?tab=maintenance`}>
                          Detail
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data && data.meta.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                page={page}
                totalPages={data.meta.totalPages}
                pageSize={data.meta.limit}
                total={data.meta.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
