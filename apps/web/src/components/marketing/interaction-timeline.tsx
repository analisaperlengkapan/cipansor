"use client";

import { useInteractions } from "@/hooks/use-marketing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Phone, MessageCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function InteractionTimeline({
  registrantId,
}: {
  registrantId: string;
}) {
  const { data: interactions, isLoading } = useInteractions(registrantId);

  if (isLoading) return <Loader2 className="animate-spin h-6 w-6" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Interaksi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {interactions?.map((interaction) => (
            <div
              key={interaction.id}
              className="flex gap-4 p-4 border rounded-lg"
            >
              <div className="bg-muted h-10 w-10 rounded-full flex items-center justify-center shrink-0">
                {interaction.type === "CALL" ? (
                  <Phone className="h-5 w-5" />
                ) : interaction.type === "WA" ? (
                  <MessageCircle className="h-5 w-5" />
                ) : (
                  <Calendar className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{interaction.type}</p>
                    <p className="text-xs text-muted-foreground">
                      Oleh: {interaction.recordedBy?.name || "Unknown"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(interaction.date), "d MMM HH:mm", {
                      locale: idLocale,
                    })}
                  </span>
                </div>
                {interaction.notes && (
                  <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    {interaction.notes}
                  </p>
                )}
                {interaction.nextActionDate && (
                  <p className="mt-2 text-xs text-blue-600 font-medium">
                    Jadwal Berikutnya:{" "}
                    {format(
                      new Date(interaction.nextActionDate),
                      "d MMM yyyy",
                      { locale: idLocale },
                    )}
                  </p>
                )}
              </div>
            </div>
          ))}
          {(!interactions || interactions.length === 0) && (
            <p className="text-center text-muted-foreground py-4">
              Belum ada interaksi
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
