'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGenerateReportCards } from '@/hooks';
import { useClasses, useAcademicYears } from '@/hooks';
import {
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle,
  Info,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function GenerateReportCardsPage() {
  const router = useRouter();
  const [classId, setClassId] = useState<string>('');
  const [semester, setSemester] = useState<string>('1');
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [includeAttendance, setIncludeAttendance] = useState(true);
  const [includeTahfidz, setIncludeTahfidz] = useState(true);
  const [includeExtracurricular, setIncludeExtracurricular] = useState(true);

  const { data: classes } = useClasses();
  const { data: academicYears } = useAcademicYears();
  const generateReportCards = useGenerateReportCards();

  const activeAcademicYear = academicYears?.data?.find((ay) => ay.isActive);
  const selectedClass = classes?.data?.find((c) => c.id === classId);

  const handleGenerate = async () => {
    if (!classId) {
      toast.error('Pilih kelas terlebih dahulu');
      return;
    }

    try {
      await generateReportCards.mutateAsync({
        classId,
        semester: parseInt(semester),
        academicYearId: academicYearId || activeAcademicYear?.id || '',
        options: {
          includeAttendance,
          includeTahfidz,
          includeExtracurricular,
        },
      });
      toast.success('Rapor berhasil di-generate');
      router.push('/assessment/report-cards');
    } catch (error) {
      toast.error('Gagal generate rapor');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Generate Rapor</h1>
            <p className="text-muted-foreground">
              Buat rapor untuk seluruh santri dalam satu kelas
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Generate</CardTitle>
              <CardDescription>Pilih kelas dan semester untuk generate rapor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tahun Ajaran</label>
                <Select value={academicYearId} onValueChange={setAcademicYearId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun ajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears?.data?.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name} {year.isActive && '(Aktif)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!academicYearId && activeAcademicYear && (
                  <p className="text-xs text-muted-foreground">
                    Default: {activeAcademicYear.name} (Aktif)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Semester</label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1 (Ganjil)</SelectItem>
                    <SelectItem value="2">Semester 2 (Genap)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Kelas</label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.data?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({cls.studentCount ?? 0} santri)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-3">Opsi Tambahan</p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="attendance"
                      checked={includeAttendance}
                      onCheckedChange={(checked) => setIncludeAttendance(checked as boolean)}
                    />
                    <label htmlFor="attendance" className="text-sm cursor-pointer">
                      Sertakan data kehadiran
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tahfidz"
                      checked={includeTahfidz}
                      onCheckedChange={(checked) => setIncludeTahfidz(checked as boolean)}
                    />
                    <label htmlFor="tahfidz" className="text-sm cursor-pointer">
                      Sertakan nilai tahfidz
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="extracurricular"
                      checked={includeExtracurricular}
                      onCheckedChange={(checked) => setIncludeExtracurricular(checked as boolean)}
                    />
                    <label htmlFor="extracurricular" className="text-sm cursor-pointer">
                      Sertakan nilai ekstrakurikuler
                    </label>
                  </div>
                </div>
              </div>

              <Button
                className="w-full mt-4"
                onClick={handleGenerate}
                disabled={!classId || generateReportCards.isPending}
              >
                {generateReportCards.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Rapor
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info & Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Informasi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Proses generate rapor akan membuat rapor untuk semua santri yang terdaftar di kelas
                  yang dipilih berdasarkan nilai penilaian yang sudah dipublikasikan.
                </p>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Yang akan dihitung:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Nilai rata-rata setiap mata pelajaran</li>
                    <li>Nilai akhir berdasarkan bobot penilaian</li>
                    <li>Peringkat di kelas</li>
                    {includeAttendance && <li>Rekap kehadiran (hadir, sakit, izin, alpha)</li>}
                    {includeTahfidz && <li>Catatan hafalan Al-Quran</li>}
                    {includeExtracurricular && <li>Nilai ekstrakurikuler yang diikuti</li>}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {selectedClass && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Kelas Terpilih
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Nama Kelas</dt>
                      <dd className="font-medium">{selectedClass.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Jumlah Santri</dt>
                      <dd className="font-medium">{selectedClass.studentCount ?? 0}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Wali Kelas</dt>
                      <dd className="font-medium">
                        {selectedClass.homeroomTeacher?.user.name ?? '-'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Tingkat</dt>
                      <dd className="font-medium">{selectedClass.grade}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            )}

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-5 w-5" />
                  Perhatian
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-yellow-800">
                <ul className="list-disc list-inside space-y-1">
                  <li>Pastikan semua nilai penilaian sudah dipublikasikan</li>
                  <li>Rapor yang sudah ada akan di-update dengan data terbaru</li>
                  <li>Proses mungkin memakan waktu tergantung jumlah santri</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
