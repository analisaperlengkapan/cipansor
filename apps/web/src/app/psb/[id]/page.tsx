'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useRegistration,
  useUpdateRegistrationStatus,
  useScheduleTest,
  useRecordTestResult,
  useScheduleInterview,
  useRecordInterviewResult,
  useAcceptRegistration,
  useRejectRegistration,
  useEnrollRegistration,
  useDeleteRegistration,
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_COLORS,
  type RegistrationStatus,
} from '@/hooks';
import { useClasses } from '@/hooks';
import { useDormitories } from '@/hooks';
import {
  ArrowLeft,
  User,
  FileText,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  Home,
  Phone,
  Mail,
  MapPin,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Edit,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';

export default function PSBDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: registration, isLoading } = useRegistration(id);
  const { data: classes } = useClasses();
  const { data: dormitories } = useDormitories();

  // Mutations
  const scheduleTestMutation = useScheduleTest();
  const recordTestMutation = useRecordTestResult();
  const scheduleInterviewMutation = useScheduleInterview();
  const recordInterviewMutation = useRecordInterviewResult();
  const acceptMutation = useAcceptRegistration();
  const rejectMutation = useRejectRegistration();
  const enrollMutation = useEnrollRegistration();
  const deleteMutation = useDeleteRegistration();

  // Dialog states
  const [scheduleTestOpen, setScheduleTestOpen] = useState(false);
  const [recordTestOpen, setRecordTestOpen] = useState(false);
  const [scheduleInterviewOpen, setScheduleInterviewOpen] = useState(false);
  const [recordInterviewOpen, setRecordInterviewOpen] = useState(false);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Form states
  const [testDate, setTestDate] = useState('');
  const [testScore, setTestScore] = useState('');
  const [testNotes, setTestNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewScore, setInterviewScore] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDormitoryId, setSelectedDormitoryId] = useState('');

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!registration) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Data pendaftaran tidak ditemukan</p>
          <Button variant="link" asChild>
            <Link href="/psb">Kembali ke daftar</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handleScheduleTest = async () => {
    try {
      await scheduleTestMutation.mutateAsync({
        id,
        testDate,
        notes: testNotes,
      });
      toast.success('Jadwal tes berhasil disimpan');
      setScheduleTestOpen(false);
      setTestDate('');
      setTestNotes('');
    } catch {
      toast.error('Gagal menyimpan jadwal tes');
    }
  };

  const handleRecordTest = async () => {
    try {
      await recordTestMutation.mutateAsync({
        id,
        score: Number(testScore),
        notes: testNotes,
      });
      toast.success('Hasil tes berhasil disimpan');
      setRecordTestOpen(false);
      setTestScore('');
      setTestNotes('');
    } catch {
      toast.error('Gagal menyimpan hasil tes');
    }
  };

  const handleScheduleInterview = async () => {
    try {
      await scheduleInterviewMutation.mutateAsync({
        id,
        interviewDate,
        notes: interviewNotes,
      });
      toast.success('Jadwal wawancara berhasil disimpan');
      setScheduleInterviewOpen(false);
      setInterviewDate('');
      setInterviewNotes('');
    } catch {
      toast.error('Gagal menyimpan jadwal wawancara');
    }
  };

  const handleRecordInterview = async () => {
    try {
      await recordInterviewMutation.mutateAsync({
        id,
        score: Number(interviewScore),
        notes: interviewNotes,
      });
      toast.success('Hasil wawancara berhasil disimpan');
      setRecordInterviewOpen(false);
      setInterviewScore('');
      setInterviewNotes('');
    } catch {
      toast.error('Gagal menyimpan hasil wawancara');
    }
  };

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync({ id });
      toast.success('Pendaftar diterima');
      setAcceptOpen(false);
    } catch {
      toast.error('Gagal menerima pendaftar');
    }
  };

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync({ id, reason: rejectReason });
      toast.success('Pendaftar ditolak');
      setRejectOpen(false);
      setRejectReason('');
    } catch {
      toast.error('Gagal menolak pendaftar');
    }
  };

  const handleEnroll = async () => {
    try {
      await enrollMutation.mutateAsync({
        id,
        classId: selectedClassId,
        dormitoryId: selectedDormitoryId || undefined,
      });
      toast.success('Pendaftar berhasil didaftarkan sebagai santri');
      setEnrollOpen(false);
    } catch {
      toast.error('Gagal mendaftarkan santri');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Data pendaftaran berhasil dihapus');
      router.push('/psb');
    } catch {
      toast.error('Gagal menghapus data');
    }
  };

  const getStatusBadge = (status: RegistrationStatus) => (
    <Badge className={REGISTRATION_STATUS_COLORS[status]}>
      {REGISTRATION_STATUS_LABELS[status]}
    </Badge>
  );

  const canScheduleTest = ['SUBMITTED', 'DOCUMENT_REVIEW'].includes(registration.status);
  const canRecordTest = registration.status === 'TEST_SCHEDULED';
  const canScheduleInterview = registration.status === 'TEST_COMPLETED';
  const canRecordInterview = registration.status === 'INTERVIEW_SCHEDULED';
  const canDecide = registration.status === 'INTERVIEW_COMPLETED';
  const canEnroll = registration.status === 'ACCEPTED';

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/psb">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{registration.fullName}</h1>
                {getStatusBadge(registration.status)}
              </div>
              <p className="text-muted-foreground">
                No. Pendaftaran: {registration.registrationNumber}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/psb/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
          </div>
        </div>

        {/* Action Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {canScheduleTest && (
                <Button onClick={() => setScheduleTestOpen(true)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Jadwalkan Tes
                </Button>
              )}
              {canRecordTest && (
                <Button onClick={() => setRecordTestOpen(true)}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Input Hasil Tes
                </Button>
              )}
              {canScheduleInterview && (
                <Button onClick={() => setScheduleInterviewOpen(true)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Jadwalkan Wawancara
                </Button>
              )}
              {canRecordInterview && (
                <Button onClick={() => setRecordInterviewOpen(true)}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Input Hasil Wawancara
                </Button>
              )}
              {canDecide && (
                <>
                  <Button variant="default" onClick={() => setAcceptOpen(true)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Terima
                  </Button>
                  <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak
                  </Button>
                </>
              )}
              {canEnroll && (
                <Button onClick={() => setEnrollOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Daftar Ulang
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="biodata">
          <TabsList>
            <TabsTrigger value="biodata">
              <User className="mr-2 h-4 w-4" />
              Biodata
            </TabsTrigger>
            <TabsTrigger value="family">
              <Home className="mr-2 h-4 w-4" />
              Keluarga
            </TabsTrigger>
            <TabsTrigger value="education">
              <GraduationCap className="mr-2 h-4 w-4" />
              Pendidikan
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="mr-2 h-4 w-4" />
              Dokumen
            </TabsTrigger>
            <TabsTrigger value="selection">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Seleksi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="biodata" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Pribadi</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Nama Lengkap</Label>
                  <p className="font-medium">{registration.fullName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Nama Panggilan</Label>
                  <p className="font-medium">{registration.nickname || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Jenis Kelamin</Label>
                  <p className="font-medium">
                    {registration.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Tempat, Tanggal Lahir</Label>
                  <p className="font-medium">
                    {registration.birthPlace},{' '}
                    {format(new Date(registration.birthDate), 'd MMMM yyyy', {
                      locale: idLocale,
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">NIK</Label>
                  <p className="font-medium font-mono">{registration.nationalId || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">No. Kartu Keluarga</Label>
                  <p className="font-medium font-mono">{registration.familyCardNumber || '-'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alamat</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-muted-foreground">Alamat Lengkap</Label>
                  <p className="font-medium">{registration.address}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Desa/Kelurahan</Label>
                  <p className="font-medium">{registration.village}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Kecamatan</Label>
                  <p className="font-medium">{registration.district}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Kota/Kabupaten</Label>
                  <p className="font-medium">{registration.city}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Provinsi</Label>
                  <p className="font-medium">{registration.province}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Kode Pos</Label>
                  <p className="font-medium">{registration.postalCode || '-'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="family" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Ayah</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Nama Ayah</Label>
                  <p className="font-medium">{registration.fatherName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Pekerjaan</Label>
                  <p className="font-medium">{registration.fatherOccupation || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">No. Telepon</Label>
                  <p className="font-medium">{registration.fatherPhone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{registration.fatherEmail || '-'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Ibu</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Nama Ibu</Label>
                  <p className="font-medium">{registration.motherName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Pekerjaan</Label>
                  <p className="font-medium">{registration.motherOccupation || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">No. Telepon</Label>
                  <p className="font-medium">{registration.motherPhone || '-'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pendidikan Sebelumnya</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Asal Sekolah</Label>
                  <p className="font-medium">{registration.previousSchool || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Alamat Sekolah</Label>
                  <p className="font-medium">{registration.previousSchoolAddress || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Tahun Lulus</Label>
                  <p className="font-medium">{registration.graduationYear || '-'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kemampuan Al-Quran</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Kemampuan Baca</Label>
                  <p className="font-medium">{registration.quranAbility || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Hafalan (Juz)</Label>
                  <p className="font-medium">
                    {registration.memorizedJuz ? `${registration.memorizedJuz} Juz` : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dokumen Persyaratan</CardTitle>
                <CardDescription>Dokumen yang diunggah oleh pendaftar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <DocumentItem
                    label="Pas Foto"
                    url={registration.photoUrl}
                  />
                  <DocumentItem
                    label="Akta Kelahiran"
                    url={registration.birthCertificateUrl}
                  />
                  <DocumentItem
                    label="Kartu Keluarga"
                    url={registration.familyCardUrl}
                  />
                  <DocumentItem
                    label="Ijazah/SKL"
                    url={registration.diplomaUrl}
                  />
                  <DocumentItem
                    label="Surat Keterangan Sehat"
                    url={registration.healthCertificateUrl}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="selection" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Tanggal Tes</Label>
                    <p className="font-medium">
                      {registration.testDate
                        ? format(new Date(registration.testDate), 'd MMMM yyyy, HH:mm', {
                            locale: idLocale,
                          })
                        : '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Nilai Tes</Label>
                    <p className="text-2xl font-bold">
                      {registration.testScore ?? '-'}
                    </p>
                  </div>
                  {registration.testNotes && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Catatan</Label>
                      <p className="text-sm">{registration.testNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Wawancara</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Tanggal Wawancara</Label>
                    <p className="font-medium">
                      {registration.interviewDate
                        ? format(new Date(registration.interviewDate), 'd MMMM yyyy, HH:mm', {
                            locale: idLocale,
                          })
                        : '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Nilai Wawancara</Label>
                    <p className="text-2xl font-bold">
                      {registration.interviewScore ?? '-'}
                    </p>
                  </div>
                  {registration.interviewNotes && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Catatan</Label>
                      <p className="text-sm">{registration.interviewNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {registration.status === 'ACCEPTED' && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-700">Diterima</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-600">
                    Diterima pada:{' '}
                    {registration.acceptedAt
                      ? format(new Date(registration.acceptedAt), 'd MMMM yyyy', {
                          locale: idLocale,
                        })
                      : '-'}
                  </p>
                </CardContent>
              </Card>
            )}

            {registration.status === 'REJECTED' && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-700">Ditolak</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-red-600">
                    Ditolak pada:{' '}
                    {registration.rejectedAt
                      ? format(new Date(registration.rejectedAt), 'd MMMM yyyy', {
                          locale: idLocale,
                        })
                      : '-'}
                  </p>
                  {registration.rejectionReason && (
                    <p className="text-sm text-red-600">
                      Alasan: {registration.rejectionReason}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {registration.status === 'ENROLLED' && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardHeader>
                  <CardTitle className="text-emerald-700">Terdaftar sebagai Santri</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-emerald-600">
                    Terdaftar pada:{' '}
                    {registration.enrolledAt
                      ? format(new Date(registration.enrolledAt), 'd MMMM yyyy', {
                          locale: idLocale,
                        })
                      : '-'}
                  </p>
                  {registration.studentId && (
                    <Button variant="link" className="p-0 text-emerald-700" asChild>
                      <Link href={`/students/${registration.studentId}`}>
                        Lihat Data Santri →
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Schedule Test Dialog */}
      <Dialog open={scheduleTestOpen} onOpenChange={setScheduleTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jadwalkan Tes</DialogTitle>
            <DialogDescription>
              Tentukan tanggal dan waktu tes untuk pendaftar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tanggal & Waktu Tes</Label>
              <Input
                type="datetime-local"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea
                value={testNotes}
                onChange={(e) => setTestNotes(e.target.value)}
                placeholder="Ruangan, hal yang perlu disiapkan, dll"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleTestOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleScheduleTest}
              disabled={!testDate || scheduleTestMutation.isPending}
            >
              {scheduleTestMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Test Dialog */}
      <Dialog open={recordTestOpen} onOpenChange={setRecordTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Input Hasil Tes</DialogTitle>
            <DialogDescription>Masukkan nilai hasil tes pendaftar</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nilai Tes (0-100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={testScore}
                onChange={(e) => setTestScore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea
                value={testNotes}
                onChange={(e) => setTestNotes(e.target.value)}
                placeholder="Keterangan hasil tes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordTestOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleRecordTest}
              disabled={!testScore || recordTestMutation.isPending}
            >
              {recordTestMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={scheduleInterviewOpen} onOpenChange={setScheduleInterviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jadwalkan Wawancara</DialogTitle>
            <DialogDescription>
              Tentukan tanggal dan waktu wawancara untuk pendaftar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tanggal & Waktu Wawancara</Label>
              <Input
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                placeholder="Hal yang perlu disiapkan"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleInterviewOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleScheduleInterview}
              disabled={!interviewDate || scheduleInterviewMutation.isPending}
            >
              {scheduleInterviewMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Interview Dialog */}
      <Dialog open={recordInterviewOpen} onOpenChange={setRecordInterviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Input Hasil Wawancara</DialogTitle>
            <DialogDescription>Masukkan nilai hasil wawancara pendaftar</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nilai Wawancara (0-100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={interviewScore}
                onChange={(e) => setInterviewScore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                placeholder="Keterangan hasil wawancara"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordInterviewOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleRecordInterview}
              disabled={!interviewScore || recordInterviewMutation.isPending}
            >
              {recordInterviewMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Dialog */}
      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terima Pendaftar</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menerima pendaftar ini?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              <strong>{registration.fullName}</strong> akan diterima sebagai calon santri.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Nilai Tes: {registration.testScore ?? '-'} | Nilai Wawancara:{' '}
              {registration.interviewScore ?? '-'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAccept} disabled={acceptMutation.isPending}>
              {acceptMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Ya, Terima
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pendaftar</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan pendaftar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alasan Penolakan</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Alasan mengapa pendaftar ditolak"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason || rejectMutation.isPending}
            >
              {rejectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Tolak Pendaftar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daftar Ulang</DialogTitle>
            <DialogDescription>
              Pilih kelas dan asrama untuk santri baru
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kelas</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.data?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Asrama (Opsional)</Label>
              <Select value={selectedDormitoryId} onValueChange={setSelectedDormitoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih asrama" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak memilih asrama</SelectItem>
                  {dormitories?.data?.map((dorm) => (
                    <SelectItem key={dorm.id} value={dorm.id}>
                      {dorm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={!selectedClassId || enrollMutation.isPending}
            >
              {enrollMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Daftarkan Santri
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pendaftaran</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data pendaftaran ini? Tindakan ini
              tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function DocumentItem({ label, url }: { label: string; url?: string }) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm font-medium mb-2">{label}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          Lihat Dokumen →
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">Belum diunggah</p>
      )}
    </div>
  );
}
