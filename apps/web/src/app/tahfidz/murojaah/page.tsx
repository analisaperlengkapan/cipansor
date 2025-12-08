'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { MainLayout } from '@/components/layout';
import { PageHeader, DataTable, SearchInput, ConfirmDialog } from '@/components/shared';
import {
  useMurojaahRecords,
  useDeleteMurojaah,
  MurojaahRecord,
} from '@/hooks/use-murojaah';
import { useClasses } from '@/hooks/use-classes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Plus,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu',
  REVIEWED: 'Direview',
  PASSED: 'Lulus',
  NEED_IMPROVEMENT: 'Perlu Perbaikan',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  REVIEWED: 'bg-blue-100 text-blue-800',
  PASSED: 'bg-green-100 text-green-800',
  NEED_IMPROVEMENT: 'bg-orange-100 text-orange-800',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-3 w-3" />,
  REVIEWED: <Eye className="h-3 w-3" />,
  PASSED: <CheckCircle className="h-3 w-3" />,
  NEED_IMPROVEMENT: <AlertTriangle className="h-3 w-3" />,
};

export default function MurojaahListPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: classes } = useClasses({ unitId: user?.unitId });

  const { data, isLoading } = useMurojaahRecords({
    page,
    limit: pageSize,
    search: search || undefined,
    status: statusFilter || undefined,
    classId: classFilter || undefined,
    dateFrom: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateTo: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    unitId: user?.role !== 'SUPER_ADMIN' ? user?.unitId : undefined,
  });

  const deleteMutation = useDeleteMurojaah();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('Record murojaah berhasil dihapus');
      setDeleteId(null);
    } catch {
      toast.error('Gagal menghapus record murojaah');
    }
  };

  const columns: ColumnDef<MurojaahRecord>[] = [
    {
      accessorKey: 'student',
      header: 'Santri',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.student?.photoUrl ? (
            <img
              src={row.original.student.photoUrl}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium">
                {row.original.student?.user?.name?.[0] || '?'}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium">{row.original.student?.user?.name || '-'}</p>
            <p className="text-xs text-muted-foreground">{row.original.student?.nis}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Tanggal',
      cell: ({ row }) => (
        <span className="text-sm">
          {format(new Date(row.original.date), 'dd MMM yyyy', { locale: idLocale })}
        </span>
      ),
    },
    {
      accessorKey: 'surah',
      header: 'Surah & Ayat',
      cell: ({ row }) => (
        <div>
          <p className="font-medium flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {row.original.surahName}
          </p>
          <p className="text-xs text-muted-foreground">
            Ayat {row.original.startAyat} - {row.original.endAyat}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'repetitions',
      header: 'Pengulangan',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.repetitions}x</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={cn('font-normal gap-1', STATUS_COLORS[row.original.status])}>
          {STATUS_ICONS[row.original.status]}
          {STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: 'grade',
      header: 'Nilai',
      cell: ({ row }) => (
        <span
          className={cn(
            'font-semibold',
            row.original.grade
              ? row.original.grade >= 80
                ? 'text-green-600'
                : row.original.grade >= 60
                ? 'text-yellow-600'
                : 'text-red-600'
              : 'text-muted-foreground'
          )}
        >
          {row.original.grade ?? '-'}
        </span>
      ),
    },
    {
      accessorKey: 'teacher',
      header: 'Musyrif',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.teacher?.user?.name || '-'}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/tahfidz/murojaah/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/tahfidz/murojaah/${row.original.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {row.original.status === 'PENDING' && (
              <DropdownMenuItem onClick={() => router.push(`/tahfidz/murojaah/${row.original.id}/review`)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Review
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteId(row.original.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Murojaah Al-Qur'an"
          description="Kelola catatan murojaah (pengulangan) hafalan santri"
          actions={
            <Button onClick={() => router.push('/tahfidz/murojaah/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Murojaah
            </Button>
          }
        />

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SearchInput
            placeholder="Cari nama santri atau surah..."
            value={search}
            onChange={setSearch}
          />

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Kelas/Halaqah" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Kelas/Halaqah</SelectItem>
              {classes?.data?.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DatePickerWithRange
            value={dateRange}
            onChange={setDateRange}
            placeholder="Pilih tanggal"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Menunggu Review</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {data?.summary?.pending || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Lulus</p>
                <p className="text-2xl font-bold text-green-800">
                  {data?.summary?.passed || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Perlu Perbaikan</p>
                <p className="text-2xl font-bold text-orange-800">
                  {data?.summary?.needImprovement || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Total Bulan Ini</p>
                <p className="text-2xl font-bold text-blue-800">
                  {data?.summary?.thisMonth || 0}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          pagination={{
            pageIndex: page - 1,
            pageSize,
            pageCount: data?.pagination?.totalPages || 0,
            total: data?.pagination?.total || 0,
            onPageChange: (newPage) => setPage(newPage + 1),
            onPageSizeChange: setPageSize,
          }}
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={() => setDeleteId(null)}
          title="Hapus Record Murojaah"
          description="Apakah Anda yakin ingin menghapus record murojaah ini? Tindakan ini tidak dapat dibatalkan."
          onConfirm={handleDelete}
          loading={deleteMutation.isPending}
        />
      </div>
    </MainLayout>
  );
}
