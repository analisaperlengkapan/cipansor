'use client';

import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useExams, ExamStatus } from '@/hooks/use-assessment';
import { useAuthStore } from '@/stores/auth';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Loader2, PlayCircle, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentExamsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Fetch exams. Ideally we should filter by the student's class.
  // Assuming the API handles permission or we pass classId if available.
  // For now, fetching all SCHEDULED exams and filtering in UI or API.
  const { data: exams, isLoading } = useExams({
    status: ExamStatus.SCHEDULED,
    // classId: user?.student?.classId // If available
  });

  const activeExams = exams?.filter(exam => exam.status === 'SCHEDULED') || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ujian Online</h1>
          <p className="text-muted-foreground">
            Daftar ujian yang tersedia untuk Anda
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeExams.length > 0 ? (
            activeExams.map((exam) => (
              <Card key={exam.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge>{exam.subject?.name}</Badge>
                    {exam.type && <Badge variant="outline">{exam.type}</Badge>}
                  </div>
                  <CardTitle className="mt-2">{exam.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {exam.description || 'Tidak ada deskripsi'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(exam.scheduledAt), 'EEEE, d MMMM yyyy', { locale: id })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{exam.duration} Menit</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4">
                    <Button className="w-full" asChild>
                      <Link href={`/student/exams/${exam.id}/take`}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Mulai Ujian
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-muted/20 rounded-lg border border-dashed">
              <p className="text-muted-foreground">Tidak ada ujian yang dijadwalkan saat ini</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
