"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { TalentMatrix } from "@/components/hr/talent-matrix";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Award, TrendingUp } from "lucide-react";

export default function TalentPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["talent-analytics"],
    queryFn: async () => {
      const { data } = await api.get("/talenta/analytics");
      return data.data;
    }
  });

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

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Matriks Talenta</CardTitle>
          <CardDescription>Pemetaan pegawai berdasarkan performa dan potensi</CardDescription>
        </CardHeader>
        <CardContent>
          <TalentMatrix profiles={analytics?.profiles || []} />
        </CardContent>
      </Card>
    </div>
  );
}
