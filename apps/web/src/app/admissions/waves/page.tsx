"use client";
import { useAdmissionWaves } from "@/hooks/use-admissions";
import { safeFormat } from "@/lib/date";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { id } from "date-fns/locale";

export default function AdmissionWavesPage() {
  const { data: wavesResponse, isLoading } = useAdmissionWaves();
  const waves = wavesResponse?.data || [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Gelombang Pendaftaran"
          description="Manajemen periode gelombang PPDB per unit"
        />
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Tambah Gelombang
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Gelombang</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Mulai</TableHead>
              <TableHead>Selesai</TableHead>
              <TableHead>Kuota</TableHead>
              <TableHead>Terdaftar</TableHead>
              <TableHead>Status</TableHead>
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
            ) : waves.length > 0 ? (
              waves.map((wave: any) => (
                <TableRow key={wave.id}>
                  <TableCell className="font-bold">{wave.name}</TableCell>
                  <TableCell>{wave.period?.name}</TableCell>
                  <TableCell className="text-xs">
                    {safeFormat(new Date(wave.startDate), "d MMM yyyy", {
                      locale: id,
                    })}
                  </TableCell>
                  <TableCell className="text-xs">
                    {safeFormat(new Date(wave.endDate), "d MMM yyyy", {
                      locale: id,
                    })}
                  </TableCell>
                  <TableCell>{wave.quota}</TableCell>
                  <TableCell>{wave.registeredCount}</TableCell>
                  <TableCell>
                    <Badge
                      variant={wave.status === "OPEN" ? "default" : "secondary"}
                    >
                      {wave.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground italic"
                >
                  Belum ada data gelombang.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
