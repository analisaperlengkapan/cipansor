"use client";

import { useLeadInteractions } from "@/hooks/use-leads";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export function LeadInteractionTimeline({ leadId }: { leadId: string }) {
  const { data: interactions, isLoading } = useLeadInteractions(leadId);

  if (isLoading) {
    return <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />;
  }

  if (!interactions || interactions.length === 0) {
    return <div className="text-center text-muted-foreground py-4">Belum ada interaksi</div>;
  }

  return (
    <div className="space-y-4">
      {interactions.map((interaction: any) => (
        <div key={interaction.id} className="border rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex gap-2 items-center">
              <Badge variant="outline">{interaction.type}</Badge>
              <span className="text-sm text-muted-foreground">
                {format(new Date(interaction.date), "d MMM yyyy, HH:mm", { locale: idLocale })}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Oleh: {interaction.recordedBy?.name}
            </div>
          </div>
          {interaction.notes && (
            <p className="text-sm whitespace-pre-wrap">{interaction.notes}</p>
          )}
          {interaction.nextActionDate && (
            <div className="text-xs font-medium text-blue-600 mt-2">
              Tindak lanjut: {format(new Date(interaction.nextActionDate), "d MMM yyyy", { locale: idLocale })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
