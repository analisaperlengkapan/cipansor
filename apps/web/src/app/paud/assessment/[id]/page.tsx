'use client';

import { useRouter, useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import {
  usePAUDAssessment,
  useDeletePAUDAssessment,
  ASPECT_LABELS,
  ACHIEVEMENT_LABELS,
  ACHIEVEMENT_COLORS,
} from '@/hooks/use-paud-assessment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Pencil, Trash2, Calendar, User, BookOpen, Image } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PAUDAssessmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: assessment, isLoading, error } = usePAUDAssessment(id);
  const deleteMutation = useDeletePAUDAssessment();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Penilaian berhasil dihapus');
      router.push('/paud/assessment');
    } catch {
      toast.error('Gagal menghapus penilaian');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-64" />
            <Skeleton className="h-64 lg:col-span-2" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !assessment) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-lg font-semibold">Penilaian tidak ditemukan</h2>
          <p className="text-muted-foreground mb-4">
            Data penilaian yang Anda cari tidak tersedia.
          </p>
          <Button onClick={() => router.push('/paud/assessment')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Detail Penilaian"
          description={`Penilaian ${ASPECT_LABELS[assessment.aspect]} - ${format(new Date(assessment.periodDate), 'dd MMMM yyyy', { locale: idLocale })}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
              <Button variant="outline" onClick={() => router.push(`/paud/assessment/${id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Penilaian?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini tidak dapat dibatalkan. Data penilaian akan dihapus secara permanen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Student Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Siswa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {assessment.student?.photoUrl ? (
                  <img
                    src={assessment.student.photoUrl}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xl font-bold text-muted-foreground">
                      {assessment.student?.user?.name?.[0] || '?'}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{assessment.student?.user?.name}</h3>
                  <p className="text-sm text-muted-foreground">NIS: {assessment.student?.nis}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tahun Ajaran</span>
                  <span className="text-sm font-medium">{assessment.academicYear?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Periode</span>
                  <span className="text-sm font-medium capitalize">{assessment.periodType.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tanggal</span>
                  <span className="text-sm font-medium">
                    {format(new Date(assessment.periodDate), 'dd/MM/yyyy')}
                  </span>
                </div>
              </div>

              <Separator />

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/paud/assessment/student/${assessment.studentId}`)}
              >
                Lihat Progress Siswa
              </Button>
            </CardContent>
          </Card>

          {/* Assessment Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Detail Penilaian
              </CardTitle>
              <CardDescription>
                Aspek: {ASPECT_LABELS[assessment.aspect]}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Achievement Level */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm text-muted-foreground">Tingkat Capaian</p>
                  <p className="text-lg font-semibold">{ACHIEVEMENT_LABELS[assessment.achievementLevel]}</p>
                </div>
                <Badge
                  className={cn(
                    'text-lg px-4 py-2',
                    ACHIEVEMENT_COLORS[assessment.achievementLevel]
                  )}
                >
                  {assessment.achievementLevel}
                </Badge>
              </div>

              {/* Indicator */}
              {assessment.indicator && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Indikator</h4>
                  <p className="text-sm">{assessment.indicator.name}</p>
                </div>
              )}

              {/* Narrative */}
              {assessment.narrativeText && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Deskripsi Perkembangan</h4>
                  <p className="text-sm whitespace-pre-wrap">{assessment.narrativeText}</p>
                </div>
              )}

              {/* Teacher Notes */}
              {assessment.teacherNotes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Catatan Guru</h4>
                  <p className="text-sm whitespace-pre-wrap">{assessment.teacherNotes}</p>
                </div>
              )}

              {/* Recommendations */}
              {assessment.recommendations && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Rekomendasi untuk Orang Tua</h4>
                  <p className="text-sm whitespace-pre-wrap">{assessment.recommendations}</p>
                </div>
              )}

              {/* Assessor */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dinilai oleh</span>
                  <span className="font-medium">{assessment.assessedBy?.name || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Terakhir diperbarui</span>
                  <span>{format(new Date(assessment.updatedAt), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evidences */}
        {assessment.evidences && assessment.evidences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Bukti / Dokumentasi
              </CardTitle>
              <CardDescription>
                {assessment.evidences.length} file dokumentasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {assessment.evidences.map((evidence) => (
                  <div key={evidence.id} className="relative group">
                    <a
                      href={evidence.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {evidence.fileType.startsWith('image/') ? (
                        <img
                          src={evidence.fileUrl}
                          alt={evidence.caption || 'Evidence'}
                          className="w-full h-32 object-cover rounded-lg border hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted rounded-lg border flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">
                            {evidence.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                          </span>
                        </div>
                      )}
                    </a>
                    {evidence.caption && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {evidence.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
