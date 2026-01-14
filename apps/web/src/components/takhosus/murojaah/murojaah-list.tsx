'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, BookOpen } from 'lucide-react';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useMurojaahRecords, useDeleteMurojaah, MUROJAAH_TYPES } from '@/hooks/use-murojaah';
import { MurojaahFormDialog } from './murojaah-form-dialog';
import { toast } from 'sonner';

interface MurojaahListProps {
  studentId?: string;
  halaqohId?: string;
  unitId?: string;
  showStudentName?: boolean;
}

export function MurojaahList({ studentId, halaqohId, unitId, showStudentName = true }: MurojaahListProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<import('@/hooks/use-murojaah').MurojaahRecord | null>(null);

  const { data, isLoading } = useMurojaahRecords({
    page,
    limit: pageSize,
    studentId,
    halaqohId,
    unitId,
  });

  const deleteMurojaah = useDeleteMurojaah();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMurojaah.mutateAsync(deleteId);
      toast.success('Data murojaah berhasil dihapus');
      setDeleteId(null);
    } catch {
      toast.error('Gagal menghapus data');
    }
  };

  const getTypeLabel = (type: string) => {
    return MUROJAAH_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getQualityBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500">Mumtaz ({score})</Badge>;
    if (score >= 75) return <Badge className="bg-blue-500">Jayyid ({score})</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">Maqbul ({score})</Badge>;
    return <Badge variant="destructive">Rasib ({score})</Badge>;
  };

  const records = data?.records || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              {showStudentName && <TableHead>Santri</TableHead>}
              <TableHead>Jenis</TableHead>
              <TableHead>Juz</TableHead>
              <TableHead>Halaman</TableHead>
              <TableHead>Durasi</TableHead>
              <TableHead>Nilai</TableHead>
              <TableHead>Salah</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={showStudentName ? 9 : 8} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showStudentName ? 9 : 8} className="text-center py-8">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <BookOpen className="h-10 w-10 mb-2" />
                    <p>Belum ada data murojaah</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              records.map((record: import('@/hooks/use-murojaah').MurojaahRecord) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {format(new Date(record.murojaahDate), 'd MMM yyyy', { locale: localeId })}
                  </TableCell>
                  {showStudentName && (
                    <TableCell className="font-medium">{record.student?.user?.name}</TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline">{getTypeLabel(record.murojaahType)}</Badge>
                  </TableCell>
                  <TableCell>
                    {record.juzStart === record.juzEnd
                      ? `Juz ${record.juzStart}`
                      : `Juz ${record.juzStart}-${record.juzEnd}`}
                  </TableCell>
                  <TableCell>{record.pagesReviewed} Hal</TableCell>
                  <TableCell>{record.durationMinutes} mnt</TableCell>
                  <TableCell>{getQualityBadge(record.qualityScore)}</TableCell>
                  <TableCell>
                    {record.mistakeCount > 0 ? (
                      <Badge variant="secondary" className="text-red-500">
                        {record.mistakeCount}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditItem(record)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteId(record.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          pageSize={pagination.limit}
          total={pagination.total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus Data Murojaah"
        description="Apakah Anda yakin ingin menghapus catatan murojaah ini?"
        onConfirm={handleDelete}
        isLoading={deleteMurojaah.isPending}
      />

      {editItem && (
        <MurojaahFormDialog
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
          studentId={editItem.studentId}
          initialData={editItem}
        />
      )}
    </div>
  );
}
