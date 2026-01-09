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
import { Pencil, Trash2, Award } from 'lucide-react';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useSimaanExams, useDeleteSimaan, SIMAAN_TYPES, SIMAAN_GRADES } from '@/hooks/use-simaan';
import { SimaanFormDialog } from './simaan-form-dialog';
import { toast } from 'sonner';

interface SimaanListProps {
  studentId?: string;
  halaqohId?: string;
  unitId?: string;
  showStudentName?: boolean;
}

export function SimaanList({ studentId, halaqohId, unitId, showStudentName = true }: SimaanListProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<import('@/hooks/use-simaan').SimaanExam | null>(null);

  const { data, isLoading } = useSimaanExams({
    page,
    limit: pageSize,
    studentId,
    halaqohId,
    unitId,
  });

  const deleteSimaan = useDeleteSimaan();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSimaan.mutateAsync(deleteId);
      toast.success('Data ujian berhasil dihapus');
      setDeleteId(null);
    } catch {
      toast.error('Gagal menghapus data');
    }
  };

  const getTypeLabel = (type: string) => {
    return SIMAAN_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getGradeBadge = (grade?: string) => {
    if (!grade) return <span className="text-muted-foreground">-</span>;
    const gradeConfig = SIMAAN_GRADES.find(g => g.value === grade);
    return (
      <Badge variant="outline" className={gradeConfig?.color}>
        {gradeConfig?.label || grade}
      </Badge>
    );
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
              <TableHead>Jenis Ujian</TableHead>
              <TableHead>Juz</TableHead>
              <TableHead>Nilai</TableHead>
              <TableHead>Predikat</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={showStudentName ? 8 : 7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showStudentName ? 8 : 7} className="text-center py-8">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Award className="h-10 w-10 mb-2" />
                    <p>Belum ada data ujian</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              records.map((record: import('@/hooks/use-simaan').SimaanExam) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {format(new Date(record.examDate), 'd MMM yyyy', { locale: localeId })}
                  </TableCell>
                  {showStudentName && (
                    <TableCell className="font-medium">{record.student?.user?.name}</TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline">{getTypeLabel(record.simaanType)}</Badge>
                  </TableCell>
                  <TableCell>
                    {record.juzStart === record.juzEnd
                      ? `Juz ${record.juzStart}`
                      : `Juz ${record.juzStart}-${record.juzEnd}`}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {record.overallScore || '-'}
                  </TableCell>
                  <TableCell>{getGradeBadge(record.grade)}</TableCell>
                  <TableCell>
                    {record.passed ? (
                      <Badge className="bg-green-500">Lulus</Badge>
                    ) : (
                      <Badge variant="secondary">Belum/Tidak Lulus</Badge>
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
        title="Hapus Data Ujian"
        description="Apakah Anda yakin ingin menghapus data ujian ini?"
        onConfirm={handleDelete}
        isLoading={deleteSimaan.isPending}
      />

      {editItem && (
        <SimaanFormDialog
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
          studentId={editItem.studentId}
          initialData={editItem}
        />
      )}
    </div>
  );
}
