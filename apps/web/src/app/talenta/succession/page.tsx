"use client";

import { useState } from "react";
import { useSuccessions, useSuccessorSuggestions } from "@/hooks/use-talenta";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { UserCheck, Star, Search, Loader2 } from "lucide-react";

interface SuccessionPlanItem {
  id: string;
  positionTitle: string;
  priority: string;
  readinessLevel: string | null;
  notes: string | null;
  targetDate: string | null;
  currentHolder: { id: string; name: string } | null;
  successor: { user: { id: string; name: string } } | null;
}

interface SuccessorSuggestion {
  name: string;
  readiness: string;
  matchScore: number;
  shariaMatch: boolean;
}

export default function SuccessionDashboardPage() {
  const { data: successions, isLoading } = useSuccessions();
  const [search, setSearch] = useState("");
  const { data: suggestions, isLoading: suggestionsLoading } =
    useSuccessorSuggestions(search);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <PageHeader
        title="Succession Planning"
        description="Identifikasi dan persiapan pemimpin masa depan unit"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Rencana Suksesi Aktif</CardTitle>
              <CardDescription>
                Daftar posisi strategis dan kandidat suksesinya
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin" />
                </div>
              ) : !successions || successions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  Belum ada rencana suksesi. Buat rencana dari modul Talenta.
                </p>
              ) : (
                <div className="space-y-4">
                  {(successions as SuccessionPlanItem[]).map((s) => (
                    <div
                      key={s.id}
                      className="p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg">
                            {s.positionTitle}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Pejabat saat ini:{" "}
                            {s.currentHolder?.name || "Kosong"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            s.priority === "CRITICAL" || s.priority === "HIGH"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {s.priority}
                        </Badge>
                      </div>
                      {s.successor ? (
                        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-md">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-emerald-600" />
                              <span className="font-medium">
                                {s.successor.user.name}
                              </span>
                            </div>
                            {s.readinessLevel && (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-100"
                              >
                                {s.readinessLevel}
                              </Badge>
                            )}
                          </div>
                          {s.notes && (
                            <p className="text-xs text-muted-foreground">
                              {s.notes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                          Belum ada kandidat terpilih
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" /> Cari Kandidat Suksesor
              </CardTitle>
              <CardDescription>
                Saran kandidat dari profil talenta, penilaian kompetensi, dan
                riwayat pelatihan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Ketik nama posisi (mis. Kepala Sekolah)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="space-y-3">
                {suggestionsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  (suggestions as SuccessorSuggestion[] | undefined)?.map(
                    (sug, i) => (
                      <div
                        key={i}
                        className="p-3 border rounded-lg shadow-sm space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold">{sug.name}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {sug.matchScore}% cocok
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">
                              Kesiapan
                            </span>
                            <span>{sug.readiness}</span>
                          </div>
                          <Progress
                            value={Math.min(100, sug.matchScore)}
                            className="h-1"
                          />
                        </div>
                        {sug.shariaMatch && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                            <Star className="h-3 w-3 fill-current" /> Pelatihan
                            syariah
                          </div>
                        )}
                      </div>
                    ),
                  )
                )}

                {search.length > 2 &&
                  !suggestionsLoading &&
                  suggestions?.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-4">
                      Tidak ada kandidat cocok ditemukan
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
