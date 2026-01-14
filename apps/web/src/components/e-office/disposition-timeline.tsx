import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { LetterDispositionDetail } from '@cipansor/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight, Clock } from 'lucide-react';

interface DispositionTimelineProps {
  dispositions: LetterDispositionDetail[];
}

export function DispositionTimeline({ dispositions }: DispositionTimelineProps) {
  if (!dispositions || dispositions.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground text-sm">
        Belum ada riwayat disposisi.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dispositions.map((disposition, index) => (
        <Card key={disposition.id} className="relative overflow-hidden">
          {/* Vertical line connector */}
          {index !== dispositions.length - 1 && (
            <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-border -z-10" />
          )}

          <CardHeader className="pb-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{disposition.senderName[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{disposition.senderName}</span>
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground" />

                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{disposition.recipientName[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{disposition.recipientName}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(new Date(disposition.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-3 rounded-md text-sm">
              <p className="font-medium mb-1 text-xs text-muted-foreground">Instruksi:</p>
              <p>{disposition.instruction}</p>

              {disposition.deadline && (
                <div className="mt-2 text-xs text-red-600 font-medium">
                  Batas Waktu: {format(new Date(disposition.deadline), 'dd MMMM yyyy', { locale: id })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
