'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { FileText, Calendar, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { usePsychologyRecords } from '@/hooks/use-psychology';

interface StudentPsychologyTabProps {
  studentId: string;
}

export function StudentPsychologyTab({ studentId }: StudentPsychologyTabProps) {
  const { data: records, isLoading } = usePsychologyRecords({ studentId });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Riwayat Asesmen Psikologi</h3>
        <Button size="sm" asChild>
          <Link href="/counseling/assessments/new">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Asesmen
          </Link>
        </Button>
      </div>

      {!records?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Belum ada data asesmen psikologi untuk siswa ini.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => (
            <Card key={record.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {record.test.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(record.testDate), 'dd MMMM yyyy', { locale: localeId })}
                      <span>•</span>
                      <span>Oleh: {record.recordedBy.name}</span>
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{record.test.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Skor Total</p>
                    <p className="font-semibold">{record.score || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Klasifikasi</p>
                    <p className="font-semibold">{record.classification || '-'}</p>
                  </div>
                </div>

                {record.analysis && (
                  <div className="bg-muted/50 p-3 rounded-md text-sm">
                    <p className="font-medium text-xs mb-1">Analisis/Kesimpulan:</p>
                    <p className="whitespace-pre-line">{record.analysis}</p>
                  </div>
                )}

                {record.details && typeof record.details === 'object' && record.details !== null && Object.keys(record.details).length > 0 && (
                   <div className="border-t pt-2 mt-2">
                       <p className="text-xs font-medium mb-1">Detail Aspek:</p>
                       <div className="flex flex-wrap gap-2">
                           {Object.entries(record.details).map(([key, value]) => (
                               <Badge key={key} variant="secondary" className="text-xs font-normal">
                                   {key}: {String(value)}
                               </Badge>
                           ))}
                       </div>
                   </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
