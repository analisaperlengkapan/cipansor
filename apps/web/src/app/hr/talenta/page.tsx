"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { TalentMatrix } from "@/components/hr/talent-matrix";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Award, TrendingUp, GitMerge, UserCheck, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TalentPage() {
  const { data: analyticsResponse, isLoading } = useQuery({
    queryKey: ["talent-analytics"],
    queryFn: async () => {
      const { data } = await api.get("/talenta/analytics");
      return data;
    }
  });
  const analytics = analyticsResponse?.data;

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
              <CardDescription>Rekomendasi suksesi pemegang jabatan berdasarkan kriteria talenta terbaik.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Demo interactive items or real data mapping if available */}
                <div className="p-5 border-2 border-dashed rounded-xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800">Kepala Sekolah (SMA Q)</h3>
                      <p className="text-xs text-muted-foreground">Critical Position • Current: Dr. Ahmad S.</p>
                    </div>
                    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">Urgent</Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Recommended Successors:</p>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                      <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">UM</div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-emerald-900">Ustadz Mansur</p>
                        <p className="text-[10px] text-emerald-700">Category: HIGH_POTENTIAL • Match: 95%</p>
                      </div>
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="p-5 border-2 border-dashed rounded-xl space-y-4 opacity-80">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800">Bendahara Yayasan</h3>
                      <p className="text-xs text-muted-foreground">Finance Domain • Current: Hj. Fatimah</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Strategic</Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Potential Candidates:</p>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 border border-blue-100">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">BK</div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-blue-900">Budi Kurniawan, M.Ak</p>
                        <p className="text-[10px] text-blue-700">Category: KEY_TALENT • Match: 88%</p>
                      </div>
                      <UserCheck className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-slate-50 rounded-lg text-center">
                <p className="text-sm text-slate-600 italic">Klik pada posisi untuk membuka modul pemetaan suksesi lengkap.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
