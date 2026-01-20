'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  useSimaanExams,
  SIMAAN_TYPES,
  SIMAAN_GRADES,
  SimaanExam
} from '@/hooks/use-simaan';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { SkeletonTable } from '@/components/shared/skeleton-table';
import { Search } from 'lucide-react';
import { Plus, Eye, Award } from 'lucide-react';

export default function SimaanListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useSimaanExams({
    page,
    limit: 10,
    search
  });

  const getSimaanTypeLabel = (type: string) => {
    return SIMAAN_TYPES.find(t => t.value === type)?.label || type;
  };

  const getGradeLabel = (grade: string | undefined) => {
    if (!grade) return '-';
    const gradeObj = SIMAAN_GRADES.find(g => g.value === grade);
    return gradeObj ? gradeObj.label.split('(')[0].trim() : grade;
  };

  const getStatusBadge = (passed: boolean, grade?: string) => {
    if (!grade) return <Badge variant="outline" className="bg-gray-100 text-gray-700">Terjadwal</Badge>;
    if (passed) return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Lulus</Badge>;
    return <Badge variant="destructive">Tidak Lulus</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal & Hasil Simaan"
        description="Kelola jadwal ujian simaan dan input penilaian."
        actions={
          <Button onClick={() => router.push('/takhosus/simaan/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Jadwal
          </Button>
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari santri..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <SkeletonTable columns={6} rows={5} />
          ) : !data?.exams?.length ? (
            <EmptyState
              title="Belum ada data simaan"
              description="Buat jadwal simaan baru untuk memulai."
              action={
                <Button onClick={() => router.push('/takhosus/simaan/create')}>
                  Buat Jadwal
                </Button>
              }
            />
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Santri</TableHead>
                    <TableHead>Jenis Simaan</TableHead>
                    <TableHead>Juz</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.exams.map((exam: SimaanExam) => (
                    <TableRow key={exam.id}>
                      <TableCell>
                        {format(new Date(exam.examDate), 'dd MMMM yyyy', { locale: id })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {exam.student?.user?.name || '-'}
                      </TableCell>
                      <TableCell>{getSimaanTypeLabel(exam.simaanType)}</TableCell>
                      <TableCell>
                        Juz {exam.juzStart} - {exam.juzEnd}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(exam.passed, exam.grade)}
                      </TableCell>
                      <TableCell>{getGradeLabel(exam.grade)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!exam.grade ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/takhosus/simaan/${exam.id}/grade`)}
                            >
                              <Award className="mr-2 h-3 w-3" />
                              Nilai
                            </Button>
                          ) : (
                             <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/takhosus/simaan/${exam.id}/grade`)}
                            >
                              <Eye className="mr-2 h-3 w-3" />
                              Detail
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {data?.pagination && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={data.pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
