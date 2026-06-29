"use client";

import { useSuccessions, useSuccessorSuggestions } from "@/hooks/use-talenta";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserCheck, Star, Clock, AlertTriangle, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function SuccessionDashboardPage() {
  const { data: successions, isLoading } = useSuccessions();
  const [search, setSearch] = useState("");
  const { data: suggestions, isLoading: suggestionsLoading } = useSuccessorSuggestions(search);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <PageHeader
        title="Succession Readiness"
        description="Identifikasi dan persiapan pemimpin masa depan unit"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Succession Plans</CardTitle>
              <CardDescription>Daftar posisi strategis dan kandidat suksesi</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                 <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
              ) : (
                <div className="space-y-4">
                  {successions?.map((s: any) => (
                    <div key={s.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{s.positionTitle}</h3>
                          <p className="text-sm text-muted-foreground">Current: {s.currentHolder?.name || 'Vacant'}</p>
                        </div>
                        <Badge variant={s.priority === 'CRITICAL' ? 'destructive' : 'secondary'}>
                          {s.priority}
                        </Badge>
                      </div>

                      {s.successor ? (
                        <div className="bg-white p-3 border rounded-md">
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <UserCheck className="h-4 w-4 text-emerald-600" />
                               <span className="font-medium">{s.successor.user.name}</span>
                             </div>
                             <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                               Ready: {s.readinessLevel}
                             </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{s.notes}</p>
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

        <div className="space-y-6">
          <Card className="border-blue-100 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Search className="h-5 w-5" /> AI Successor Finder
              </CardTitle>
              <CardDescription>Cari kandidat berdasarkan kriteria talenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Ketik nama posisi (misal: Kepala Sekolah)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white"
              />

              <div className="space-y-3">
                {suggestionsLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : suggestions?.map((sug: any, i: number) => (
                  <div key={i} className="p-3 bg-white border rounded-lg shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">{sug.name}</span>
                      <Badge variant="secondary" className="text-[10px]">{sug.matchScore}% Match</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">Readiness</span>
                        <span>{sug.readiness}</span>
                      </div>
                      <Progress value={sug.matchScore} className="h-1" />
                    </div>
                    {sug.shariaMatch && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                        <Star className="h-3 w-3 fill-current" /> Sharia Certified
                      </div>
                    )}
                  </div>
                ))}

                {search && !suggestionsLoading && suggestions?.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-4">Tidak ada kandidat cocok ditemukan</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Risk Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-start gap-2 p-2 rounded bg-amber-50 text-amber-800 text-xs">
                 <AlertTriangle className="h-4 w-4 shrink-0" />
                 <p>3 posisi strategis belum memiliki rencana suksesi aktif.</p>
               </div>
               <div className="flex items-start gap-2 p-2 rounded bg-blue-50 text-blue-800 text-xs">
                 <Clock className="h-4 w-4 shrink-0" />
                 <p>2 kandidat memerlukan pelatihan kepemimpinan dalam 6 bulan.</p>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
