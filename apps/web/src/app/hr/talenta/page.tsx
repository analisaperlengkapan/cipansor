"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { TalentMatrix } from "@/components/hr/talent-matrix";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Award, TrendingUp, GitMerge, UserCheck, ShieldCheck, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout";

function TalentPageContent() {
  const [positionQuery, setPositionQuery] = useState("");
  const [searchTrigger, setSearchTrigger] = useState("");

  const { data: analyticsResponse, isLoading } = useQuery({
    queryKey: ["talent-analytics"],
    queryFn: async () => {
      const { data } = await api.get("/talenta/analytics");
      return data;
    }
  });
  const analytics = analyticsResponse?.data;

  const { data: suggestionsResponse, isLoading: isSuggestionsLoading } = useQuery({
    queryKey: ["succession-suggestions", searchTrigger],
    queryFn: async () => {
      const { data } = await api.get("/talenta/successions/suggest", {
        params: { positionTitle: searchTrigger },
      });
      return data;
    },
    enabled: !!searchTrigger,
  });
  const suggestions = suggestionsResponse?.data || [];

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <PageHeader
        title="Manajemen Talenta"
        description="Analisis Kategori Talenta dan Perencanaan Suksesi"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Pegawai Terdata</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Key Talents</CardTitle>
            <Award className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.distribution?.KEY_TALENT || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">High Potentials</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.distribution?.HIGH_POTENTIAL || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="matrix" className="space-y-6">
        <TabsList className="bg-slate-100/50">
          <TabsTrigger value="matrix" className="gap-2">
            <Users className="h-4 w-4" /> Talent Matrix
          </TabsTrigger>
          <TabsTrigger value="succession" className="gap-2">
            <GitMerge className="h-4 w-4" /> Succession Planning
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Matriks Talenta (9-Box Grid)</CardTitle>
              <CardDescription>Pemetaan pegawai berdasarkan performa dan potensi</CardDescription>
            </CardHeader>
            <CardContent>
              <TalentMatrix profiles={analytics?.profiles || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="succession">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>AI-Driven Succession Recommendations</CardTitle>
              <CardDescription>Cari posisi jabatan untuk mendapatkan rekomendasi suksesi berdasarkan data talenta.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Input
                  placeholder="Masukkan nama jabatan, misal: Kepala Sekolah"
                  value={positionQuery}
                  onChange={(e) => setPositionQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && positionQuery.trim()) setSearchTrigger(positionQuery.trim()); }}
                />
                <Button
                  onClick={() => { if (positionQuery.trim()) setSearchTrigger(positionQuery.trim()); }}
                  disabled={!positionQuery.trim() || isSuggestionsLoading}
                >
                  {isSuggestionsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {!searchTrigger ? (
                <div className="text-center py-12 text-muted-foreground">
                  <GitMerge className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Masukkan nama jabatan di atas untuk melihat rekomendasi suksesi.</p>
                </div>
              ) : isSuggestionsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase">
                    Rekomendasi untuk &ldquo;{searchTrigger}&rdquo;:
                  </p>
                  {suggestions.map((sug: any, i: number) => (
                    <div key={sug.talentProfileId || i} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                      <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                        {(sug.name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-emerald-900">{sug.name}</p>
                        <p className="text-[10px] text-emerald-700">
                          {sug.currentRole} • {sug.category} • Readiness: {sug.readiness}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-emerald-700 border-emerald-200">
                        Match: {sug.matchScore}%
                      </Badge>
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Tidak ditemukan kandidat suksesi untuk jabatan ini.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function TalentPage() {
  return (
    <MainLayout>
      <TalentPageContent />
    </MainLayout>
  );
}
