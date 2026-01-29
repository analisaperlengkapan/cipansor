"use client";

import { useMaintenances } from "@/hooks/use-inventory";
import { DataTable } from "@/components/shared/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { AssetMaintenance, AssetMaintenanceStatus } from "@cipansor/shared";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { MaintenanceRequestDialog } from "../dialogs/maintenance-request-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PenTool } from "lucide-react";

export function MaintenanceTab() {
  const { data, isLoading } = useMaintenances({
    limit: 50,
  });

  const columns: ColumnDef<AssetMaintenance>[] = [
    {
      accessorKey: "maintenanceDate",
      header: "Tanggal",
      cell: ({ row }) =>
        format(new Date(row.original.maintenanceDate), "dd MMM yyyy", {
          locale: localeId,
        }),
    },
    {
      accessorKey: "asset.name",
      header: "Aset",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.asset?.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.asset?.code}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Masalah",
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <div className="font-medium truncate">{row.original.type}</div>
          <div className="text-sm text-muted-foreground truncate">
            {row.original.description}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const color =
          status === "COMPLETED"
            ? "bg-green-100 text-green-800"
            : status === "IN_PROGRESS"
            ? "bg-blue-100 text-blue-800"
            : status === "PENDING"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-gray-100 text-gray-800";

        return <Badge className={color}>{status}</Badge>;
      },
    },
    {
      accessorKey: "requestedBy.name",
      header: "Pelapor",
      cell: ({ row }) => row.original.requestedBy?.name || "-",
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Daftar Perbaikan & Pemeliharaan
          </CardTitle>
          <MaintenanceRequestDialog />
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.data || []}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
