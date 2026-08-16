"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Users,
  Search,
  TrendingUp,
  UserPlus,
  Loader2,
  Target,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import { SuccessionPlanningList } from "@/components/hr/succession-planning-list";

import { MainLayout } from "@/components/layout";
function SuccessionPlanningPageContent() {
  const [positionSearch, setPositionSearch] = useState("Kepala Sekolah");

  const { data: suggestions, isLoading, refetch } = useQuery({
    queryKey: ["talent-succession-suggestions", positionSearch],
    queryFn: async () => {
      const response = await api.get(`/talenta/successions/suggest?positionTitle=${positionSearch}`);
      return response.data.data;
    },
    enabled: !!positionSearch,
  });

  return (
    <div className="container mx-auto py-8 space-y-8">
      <PageHeader
        title="AI-Driven Succession Planning"
        description="Identifikasi calon pemimpin masa depan berbasis matriks talenta"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <Target className="h-4 w-4" /> Cari Posisi
            </CardTitle>
            <CardDescription>Masukkan nama jabatan yang akan dicari suksesornya</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Misal: Kepala Sekolah, Bendahara..."
                value={positionSearch}
                onChange={(e) => setPositionSearch(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={() => refetch()}>
              <Search className="mr-2 h-4 w-4" /> Cari Kandidat
            </Button>

            <div className="pt-4 border-t space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Populer</p>
              <div className="flex flex-wrap gap-2">
                {["Kepala Sekolah", "Musyrif", "Waka Kurikulum"].map(p => (
                  <Badge
                    key={p}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-white"
                    onClick={() => setPositionSearch(p)}
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Kandidat Suksesor Terbaik untuk "{positionSearch}"
            </h3>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              AI Powered Recommendations
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-xl border border-dashed">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Menganalisis matriks talenta dan riwayat pelatihan...</p>
            </div>
          ) : (
            <SuccessionPlanningList
              candidates={suggestions || []}
              positionTitle={positionSearch}
            />
          )}

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-900">Metodologi Penilaian</p>
              <p className="text-xs text-blue-800 opacity-80 mt-1">
                Skor kecocokan (Match Score) dihitung secara otomatis berdasarkan performa (PKG),
                potensi talenta, relevansi peran saat ini terhadap target posisi, dan penyelesaian
                program pelatihan yang relevan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessionPlanningPage() {
  return (
    <MainLayout>
      <SuccessionPlanningPageContent />
    </MainLayout>
  );
}
