'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProcurement } from '@/hooks/use-procurement';
import { useUnits } from '@/hooks/use-units';
import { PurchaseRequestStatus } from '@cipansor/shared';
import { Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function ProcurementPage() {
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { units } = useUnits();
  const { requests, isLoading } = useProcurement(
    selectedUnit === 'all' ? undefined : selectedUnit,
    selectedStatus === 'all' ? undefined : (selectedStatus as PurchaseRequestStatus)
  );

  const getStatusColor = (status: PurchaseRequestStatus) => {
    switch (status) {
      case PurchaseRequestStatus.APPROVED: return 'bg-green-100 text-green-800';
      case PurchaseRequestStatus.REJECTED: return 'bg-red-100 text-red-800';
      case PurchaseRequestStatus.RECEIVED: return 'bg-blue-100 text-blue-800';
      case PurchaseRequestStatus.ORDERED: return 'bg-purple-100 text-purple-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pengadaan Barang</h1>
            <p className="text-muted-foreground">Kelola pengajuan pengadaan barang dan aset.</p>
          </div>
          <Button asChild>
            <Link href="/procurement/create">
              <Plus className="mr-2 h-4 w-4" />
              Buat Pengajuan
            </Link>
          </Button>
        </div>

        <div className="flex gap-4">
          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Unit</SelectItem>
              {units?.map((unit: any) => (
                <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {Object.values(PurchaseRequestStatus).map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengajuan</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Pemohon</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Total Estimasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Tidak ada data</TableCell>
                  </TableRow>
                ) : (
                  requests.map((req: any) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.code}</TableCell>
                      <TableCell>
                        {format(new Date(req.date), 'dd MMM yyyy', { locale: idLocale })}
                      </TableCell>
                      <TableCell>{req.unit?.name}</TableCell>
                      <TableCell>{req.requester?.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{req.description || '-'}</TableCell>
                      <TableCell>{formatCurrency(req.totalEstimated)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(req.status)} variant="outline">
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/procurement/${req.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
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
