'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Plus,
  Search,
  Heart,
  Eye,
  Trash2,
  Filter,
  AlertCircle,
  Activity,
  CalendarClock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { toast } from 'sonner';
import {
  useHealthRecords,
  useDeleteHealthRecord,
  useHealthSummary,
  HEALTH_RECORD_TYPES,
  HEALTH_STATUSES,
  HealthRecordType,
  HealthStatus,
} from '@/hooks/use-health';

function getStatusBadge(status: HealthStatus) {
  const statusInfo = HEALTH_STATUSES.find((s) => s.value === status);
  return (
    <Badge variant="outline" className={statusInfo?.color}>
      {statusInfo?.label || status}
    </Badge>
  );
}

function getRecordTypeLabel(type: HealthRecordType) {
  return HEALTH_RECORD_TYPES.find((t) => t.value === type)?.label || type;
}

export default function HealthPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data: healthData, isLoading } = useHealthRecords({
    page,
    limit: 10,
    recordType: typeFilter !== 'ALL' ? (typeFilter as HealthRecordType) : undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as HealthStatus) : undefined,
  });

  const { data: summaryData } = useHealthSummary();
  const deleteMutation = useDeleteHealthRecord();

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Rekam kesehatan berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus rekam kesehatan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kesehatan</h1>
          <p className="text-muted-foreground">Kelola rekam kesehatan santri</p>
        </div>
        <Button asChild>
          <Link href="/health/new">
            <Plus className="mr-2 h-4 w-4" />
            Catat Kesehatan
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rekam</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.totalRecords || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sedang Sakit</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summaryData?.currentlySick || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perlu Follow-Up</CardTitle>
            <CalendarClock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {summaryData?.needFollowUp || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pemulihan</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summaryData?.byStatus?.find((s) => s.status === 'RECOVERING')?.count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Jenis Rekam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Jenis</SelectItem>
              {HEALTH_RECORD_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            {HEALTH_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Health Records Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : healthData?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Belum ada data kesehatan</p>
              <Button asChild className="mt-4">
                <Link href="/health/new">Catat Kesehatan Baru</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Santri</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Keluhan/Diagnosis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {healthData?.data.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {format(new Date(record.date), 'dd MMM yyyy', { locale: localeId })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.student?.name}</p>
                        <p className="text-sm text-muted-foreground">{record.student?.nis}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getRecordTypeLabel(record.recordType)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {record.diagnosis || record.symptoms || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/health/${record.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <ConfirmDialog
                          title="Hapus Rekam Kesehatan"
                          description="Apakah Anda yakin ingin menghapus data rekam kesehatan ini?"
                          onConfirm={() => handleDelete(record.id)}
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
      {healthData && healthData.meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={healthData.meta.totalPages}
          pageSize={healthData.meta.limit}
          total={healthData.meta.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
