'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  Calendar,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  usePsychologyRecords,
  useDeletePsychologyRecord,
  usePsychologyTests,
} from '@/hooks/use-psychology';
import { useDebounce } from '@/hooks/use-debounce';

export default function AssessmentsPage() {
  const [search, setSearch] = useState('');
  const [testId, setTestId] = useState<string>('ALL');

  const debouncedSearch = useDebounce(search, 300);

  const { data: records, isLoading } = usePsychologyRecords({
    testId: testId !== 'ALL' ? testId : undefined,
  });

  const { data: tests } = usePsychologyTests();
  const deleteMutation = useDeletePsychologyRecord();

  // Client-side filtering for search
  const filteredRecords = records?.filter((record) =>
    !debouncedSearch ||
    record.student.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    record.student.nis.includes(debouncedSearch)
  );

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus data asesmen ini?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari siswa (Nama/NIS)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={testId} onValueChange={setTestId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter Jenis Tes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Jenis Tes</SelectItem>
              {tests?.map((test) => (
                <SelectItem key={test.id} value={test.id}>
                  {test.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href="/counseling/assessments/new">
            <Plus className="h-4 w-4 mr-2" />
            Input Asesmen
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Asesmen Psikologi</CardTitle>
          <CardDescription>
            Daftar hasil tes dan asesmen psikologi siswa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredRecords?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada data asesmen</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Jenis Tes</TableHead>
                  <TableHead>Klasifikasi/Skor</TableHead>
                  <TableHead>Pencatat</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords?.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(record.testDate), 'dd MMM yyyy', { locale: localeId })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.student.nis} • {record.student.enrollments[0]?.class?.name || '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.test.name}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{record.test.type}</p>
                    </TableCell>
                    <TableCell>
                      {record.classification && (
                        <Badge className="mr-2">{record.classification}</Badge>
                      )}
                      {record.score && (
                        <span className="font-mono font-bold text-sm">
                          {record.score}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.recordedBy.name}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/students/${record.studentId}?tab=psychology`}>
                              <FileText className="h-4 w-4 mr-2" />
                              Lihat di Profil
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(record.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
