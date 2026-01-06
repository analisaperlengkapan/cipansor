'use client';
// Force HMR Rebuild

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { MainLayout } from '@/components/layout';
import { PageHeader, DataTable, SearchInput, ConfirmDialog } from '@/components/shared';
import {
  usePAUDAssessments,
  useDeletePAUDAssessment,
  PAUDAssessment,
  PAUDAspect,
  PAUDAchievementLevel,
  ASPECT_LABELS,
  ACHIEVEMENT_LABELS,
  ACHIEVEMENT_COLORS,
} from '@/hooks/use-paud-assessment';
import { useAcademicYears } from '@/hooks/use-academic-years';
import { useClasses } from '@/hooks/use-classes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MoreHorizontal, Eye, Pencil, Trash2, Plus, CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import { PAUDReportPeriod } from '@cipansor/shared';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

const PERIOD_TYPES = [
  { value: 'HARIAN', label: 'Harian' },
  { value: 'MINGGUAN', label: 'Mingguan' },
  { value: 'BULANAN', label: 'Bulanan' },
  { value: 'SEMESTER', label: 'Semester' },
];

export default function PAUDAssessmentListPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [aspectFilter, setAspectFilter] = useState<string>('');
  const [achievementFilter, setAchievementFilter] = useState<string>('');
  const [periodTypeFilter, setPeriodTypeFilter] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: academicYears } = useAcademicYears();
  const { data: classes } = useClasses({ unitId: user?.unitId });

  const { data, isLoading } = usePAUDAssessments({
    page,
    limit: pageSize,
    search: search || undefined,
    aspect: aspectFilter as PAUDAspect || undefined,
    achievementLevel: achievementFilter as PAUDAchievementLevel || undefined,
    periodType: periodTypeFilter || undefined,
    classId: classFilter || undefined,
    academicYearId: academicYearFilter || undefined,
    startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    unitId: user?.role !== 'SUPER_ADMIN' ? user?.unitId : undefined,
  });

  const deleteMutation = useDeletePAUDAssessment();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('Penilaian berhasil dihapus');
      setDeleteId(null);
    } catch {
      toast.error('Gagal menghapus penilaian');
    }
  };

  const columns: ColumnDef<PAUDAssessment>[] = [
    {
      accessorKey: 'periodDate',
      header: 'Tanggal',
      cell: ({ row }) => (
        <div className="text-sm">
          <p className="font-medium">
            {format(new Date(row.original.periodDate), 'dd MMM yyyy', { locale: idLocale })}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {row.original.periodType.toLowerCase()}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'student',
      header: 'Siswa',
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
      accessorKey: 'aspect',
      header: 'Aspek',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-normal">
          {ASPECT_LABELS[row.original.aspect]}
        </Badge>
      ),
    },
    {
      accessorKey: 'achievementLevel',
      header: 'Capaian',
      cell: ({ row }) => (
        <Badge className={cn('font-normal', ACHIEVEMENT_COLORS[row.original.achievementLevel])}>
          {row.original.achievementLevel} - {ACHIEVEMENT_LABELS[row.original.achievementLevel]}
        </Badge>
      ),
    },
    {
      accessorKey: 'narrativeText',
      header: 'Catatan',
      cell: ({ row }) => (
        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
          {row.original.narrativeText || '-'}
        </p>
      ),
    },
    {
      accessorKey: 'academicYear',
      header: 'Tahun Ajaran',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.academicYear?.name || '-'}</span>
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
            <DropdownMenuItem onClick={() => router.push(`/paud/assessment/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/paud/assessment/${row.original.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
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
          title="Penilaian TK Qur'an"
          description="Kelola catatan perkembangan anak berdasarkan 6 aspek perkembangan"
          actions={
            <Button onClick={() => router.push('/paud/assessment/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Penilaian
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <SearchInput
            placeholder="Cari nama siswa atau NIS..."
            value={search}
            onChange={setSearch}
            className="w-full md:w-[300px]"
          />

          <div className="flex flex-wrap items-center gap-2">
             {/* Primary Filters */}
             <Select value={aspectFilter || 'all'} onValueChange={(val) => setAspectFilter(val === 'all' ? '' : val)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Aspek" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aspek</SelectItem>
                {Object.entries(ASPECT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Advanced Filters Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-dashed">
                   <CalendarIcon className="mr-2 h-4 w-4" />
                   Filter Lanjutan
                   {(achievementFilter || periodTypeFilter || classFilter || academicYearFilter || startDate || endDate) && (
                      <Badge variant="secondary" className="ml-2 px-1 h-5">{
                        [achievementFilter, periodTypeFilter, classFilter, academicYearFilter, startDate, endDate].filter(Boolean).length
                      }</Badge>
                   )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-4" align="start">
                 <div className="space-y-4">
                    <h4 className="font-medium leading-none">Filter Lanjutan</h4>
                    
                    <div className="grid gap-2">
                       <Label className="text-xs">Capaian</Label>
                       <Select value={achievementFilter || 'all'} onValueChange={(val) => setAchievementFilter(val === 'all' ? '' : val)}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Semua Capaian" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Capaian</SelectItem>
                          {Object.entries(ACHIEVEMENT_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {value} - {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                       <Label className="text-xs">Periode</Label>
                       <Select value={periodTypeFilter || 'all'} onValueChange={(val) => setPeriodTypeFilter(val === 'all' ? '' : val)}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Semua Periode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Periode</SelectItem>
                          {PERIOD_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                       <Label className="text-xs">Kelas</Label>
                       <Select value={classFilter || 'all'} onValueChange={(val) => setClassFilter(val === 'all' ? '' : val)}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Semua Kelas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Kelas</SelectItem>
                          {classes?.data?.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-xs">Tanggal Mulai</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="h-8 justify-start text-left font-normal w-full">
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {startDate ? format(startDate, 'dd/MM/yyyy') : 'Dari Tanggal'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-xs">Tanggal Akhir</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="h-8 justify-start text-left font-normal w-full">
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {endDate ? format(endDate, 'dd/MM/yyyy') : 'Sampai Tanggal'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={setEndDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                    </div>
                 </div>
              </PopoverContent>
            </Popover>

            {/* Clear Filters Button */}
            {(achievementFilter || periodTypeFilter || classFilter || academicYearFilter || startDate || endDate || aspectFilter || search) && (
                <Button 
                   variant="ghost" 
                   size="icon"
                   onClick={() => {
                       setSearch('');
                       setAspectFilter('');
                       setAchievementFilter('');
                       setPeriodTypeFilter('');
                       setClassFilter('');
                       setAcademicYearFilter('');
                       setStartDate(undefined);
                       setEndDate(undefined);
                   }}
                   title="Reset Filter"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          pagination={{
            page: page,
            pageSize,
            totalPages: data?.meta?.totalPages || 0,
            total: data?.meta?.total || 0,
            onPageChange: (newPage) => setPage(newPage),
            onPageSizeChange: setPageSize,
          }}
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={() => setDeleteId(null)}
          title="Hapus Penilaian"
          description="Apakah Anda yakin ingin menghapus penilaian ini? Tindakan ini tidak dapat dibatalkan."
          onConfirm={handleDelete}
          loading={deleteMutation.isPending}
        />
      </div>
    </MainLayout>
  );
}
