"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Calendar, User, ShieldCheck } from "lucide-react";
import { useCounselingSessions } from "@/hooks/use-counseling";
import { useParentChildren } from "@/hooks/use-parent-portal";

export default function ParentCounselingPage() {
  const { data: children, isLoading: loadingChildren } = useParentChildren();

  // For simplicity, we fetch sessions for the first child or show a selector
  const selectedStudentId = children?.[0]?.id;

  const { data: sessions, isLoading: loadingSessions } = useCounselingSessions({
    studentId: selectedStudentId,
  });

  const isLoading = loadingChildren || loadingSessions;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Filter out confidential sessions for parents
  const visibleSessions = useMemo(() => {
    return sessions?.data?.filter(s => !s.isConfidential && s.status === 'COMPLETED') || [];
  }, [sessions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bimbingan & Konseling</h1>
        <p className="text-muted-foreground">Riwayat pembinaan dan observasi santri.</p>
      </div>

      {visibleSessions.length === 0 ? (
        <Card className="bg-slate-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-500">Belum ada riwayat konseling yang dibagikan.</p>
            <p className="text-xs text-slate-400 mt-1">Hanya sesi non-rahasia yang sudah selesai yang akan muncul di sini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {visibleSessions.map((session) => (
            <Card key={session.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{session.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(session.scheduledAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {session.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg text-sm">
                  <p className="font-bold text-xs uppercase text-slate-500 mb-1 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Ringkasan Pembimbing
                  </p>
                  <p className="text-slate-700 leading-relaxed">{session.summary || "Tidak ada ringkasan yang dibagikan."}</p>
                </div>

                {session.recommendations && (
                  <div className="p-3 bg-emerald-50 rounded-lg text-sm border border-emerald-100">
                    <p className="font-bold text-xs uppercase text-emerald-700 mb-1">Rekomendasi untuk Orang Tua</p>
                    <p className="text-emerald-900">{session.recommendations}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <User className="h-3 w-3" />
                  <span>Pembimbing: {session.counselor?.user?.name}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
