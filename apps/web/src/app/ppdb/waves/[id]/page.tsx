'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  GraduationCap,
  Pencil,
  Users,
  Calendar,
  Target,
  DollarSign,
  FileText,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  ArrowLeft,
  Search,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';

import { MainLayout } from '@/components/layout/main-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useWave,
  useWaveRegistrants,
  useUpdateWaveStatus,
  useUpdateRegistrantStatus,
  useUpdateRegistrantScores,
  WAVE_STATUSES,
  REGISTRANT_STATUSES,
  WaveStatus,
  RegistrantStatus,
  WaveRegistrant,
  formatRegistrationFee,
  calculateQuotaPercentage,
  getNextStatus,
} from '@/hooks/use-ppdb-wave';

interface Props {
  params: Promise<{ id: string }>;
}

export default function WaveDetailPage({ params }: Props) {
  const { id } = use(params);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegistrant, setSelectedRegistrant] = useState<string | null>(null);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [scores, setScores] = useState({ testScore: '', interviewScore: '' });

  const { data: wave, isLoading: waveLoading } = useWave(id);
  const { data: registrantsData, isLoading: registrantsLoading } = useWaveRegistrants(id, {
    page,
    limit: pageSize,
    status: (statusFilter as RegistrantStatus) || undefined,
    search: searchTerm || undefined,
  });
  const updateWaveStatus = useUpdateWaveStatus();
  const updateRegistrantStatus = useUpdateRegistrantStatus();
  const updateScores = useUpdateRegistrantScores();

  const registrants = (registrantsData?.data || []) as WaveRegistrant[];
  const pagination = registrantsData?.meta;

  const handleWaveStatusChange = async (status: WaveStatus) => {
    try {
      await updateWaveStatus.mutateAsync({ id, status });
      toast.success(`Status gelombang berhasil diubah`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengubah status';
      toast.error(errorMessage);
    }
  };

  const handleRegistrantStatusChange = async (registrantId: string, status: RegistrantStatus) => {
    try {
      await updateRegistrantStatus.mutateAsync({ waveId: id, id: registrantId, status });
      toast.success(`Status pendaftar berhasil diubah`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengubah status';
      toast.error(errorMessage);
    }
  };

  const handleSaveScores = async () => {
    if (!selectedRegistrant) return;
    try {
      await updateScores.mutateAsync({
        waveId: id,
        id: selectedRegistrant,
        testScore: scores.testScore ? Number(scores.testScore) : undefined,
        interviewScore: scores.interviewScore ? Number(scores.interviewScore) : undefined,
      });
      toast.success('Nilai berhasil disimpan');
      setScoreDialogOpen(false);
      setSelectedRegistrant(null);
      setScores({ testScore: '', interviewScore: '' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan nilai';
      toast.error(errorMessage);
    }
  };

  const getWaveStatusBadge = (status: WaveStatus) => {
    const config = WAVE_STATUSES.find((s) => s.value === status);
    return (
      <Badge variant="secondary" className={config?.color}>
        {config?.label || status}
      </Badge>
    );
  };

  const getRegistrantStatusBadge = (status: RegistrantStatus) => {
    const config = REGISTRANT_STATUSES.find((s) => s.value === status);
    return (
      <Badge variant="secondary" className={config?.color}>
        {config?.label || status}
      </Badge>
    );
  };

  if (waveLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!wave) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Gelombang PPDB tidak ditemukan</p>
          <Button asChild className="mt-4">
            <Link href="/ppdb/waves">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const quotaPercentage = calculateQuotaPercentage(wave.registeredCount, wave.quota);

  return (
    <MainLayout>
      <PageHeader
        title={wave.name}
        description={`${wave.unit?.name || ''} - ${wave.period?.name || ''}`}
        backHref="/ppdb/waves"
        backLabel="Kembali"
        action={
          <div className="flex gap-2">
            {wave.status === 'DRAFT' && (
              <Button onClick={() => handleWaveStatusChange('OPEN')}>
                <Play className="h-4 w-4 mr-2" />
                Buka Pendaftaran
              </Button>
            )}
            {wave.status === 'OPEN' && (
              <Button variant="outline" onClick={() => handleWaveStatusChange('CLOSED')}>
                <Pause className="h-4 w-4 mr-2" />
                Tutup Pendaftaran
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/ppdb/waves/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* Info Cards */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Periode Pendaftaran</span>
            </div>
            <p className="font-medium">
              {format(new Date(wave.startDate), 'd MMM yyyy', { locale: localeId })} -{' '}
              {format(new Date(wave.endDate), 'd MMM yyyy', { locale: localeId })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Biaya Pendaftaran</span>
            </div>
            <p className="font-medium">
              {wave.registrationFee > 0 ? formatRegistrationFee(wave.registrationFee) : 'Gratis'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Kuota Pendaftaran</span>
              </div>
              {getWaveStatusBadge(wave.status)}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">{wave.registeredCount}</span>
                <span className="text-muted-foreground">/ {wave.quota}</span>
              </div>
              <Progress value={quotaPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requirements & Description */}
      {(wave.requirements || wave.description) && (
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          {wave.requirements && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Persyaratan Pendaftaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm">{wave.requirements}</p>
              </CardContent>
            </Card>
          )}
          {wave.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deskripsi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm">{wave.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Registrants List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Daftar Pendaftar
              </CardTitle>
              <CardDescription>
                Total {pagination?.total || 0} pendaftar
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Status</SelectItem>
                  {REGISTRANT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button asChild>
                <Link href={`/ppdb/waves/${id}/registrants/new`}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tambah Pendaftar
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Pendaftaran</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Orang Tua</TableHead>
                <TableHead>Tanggal Daftar</TableHead>
                <TableHead>Nilai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrantsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : registrants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Belum ada pendaftar</p>
                    {wave.status === 'OPEN' && (
                      <Button asChild className="mt-4">
                        <Link href={`/ppdb/waves/${id}/registrants/new`}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Tambah Pendaftar
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                registrants.map((registrant) => {
                  const nextStatus = getNextStatus(registrant.status);
                  return (
                    <TableRow key={registrant.id}>
                      <TableCell className="font-mono text-sm">
                        {registrant.registrationNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{registrant.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {registrant.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{registrant.parentName}</p>
                          <p className="text-sm text-muted-foreground">{registrant.parentPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(registrant.registrationDate), 'd MMM yyyy', {
                          locale: localeId,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {registrant.testScore !== null && (
                            <p>Tes: <span className="font-medium">{registrant.testScore}</span></p>
                          )}
                          {registrant.interviewScore !== null && (
                            <p>Interview: <span className="font-medium">{registrant.interviewScore}</span></p>
                          )}
                          {registrant.finalScore !== null && (
                            <p className="font-bold text-primary">
                              Total: {registrant.finalScore}
                            </p>
                          )}
                          {registrant.testScore === null && registrant.interviewScore === null && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRegistrant(registrant.id);
                                setScores({
                                  testScore: registrant.testScore?.toString() || '',
                                  interviewScore: registrant.interviewScore?.toString() || '',
                                });
                                setScoreDialogOpen(true);
                              }}
                            >
                              Input Nilai
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRegistrantStatusBadge(registrant.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/ppdb/waves/${id}/registrants/${registrant.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {nextStatus && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRegistrantStatusChange(registrant.id, nextStatus)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {registrant.status !== 'REJECTED' && registrant.status !== 'ENROLLED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRegistrantStatusChange(registrant.id, 'REJECTED')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pagination && (
        <div className="mt-4">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.limit}
            total={pagination.total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* Score Dialog */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Input Nilai</DialogTitle>
            <DialogDescription>
              Masukkan nilai tes dan wawancara untuk pendaftar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nilai Tes</label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="0 - 100"
                value={scores.testScore}
                onChange={(e) => setScores({ ...scores, testScore: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nilai Wawancara</label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="0 - 100"
                value={scores.interviewScore}
                onChange={(e) => setScores({ ...scores, interviewScore: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveScores} disabled={updateScores.isPending}>
              {updateScores.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
