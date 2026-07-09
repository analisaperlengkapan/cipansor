"use client";

import { useSyariahSummary } from "@/hooks/use-syariah";
import { useTalentAnalytics } from "@/hooks/use-talenta";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Users,
  HeartPulse,
  AlertTriangle
} from "lucide-react";

export default function LPMDashboardPage() {
  const { data: syariah } = useSyariahSummary();
  const { data: talent } = useTalentAnalytics();

  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        title="Dashboard Lembaga Penjamin Mutu (LPM)"
        description="Monitoring kualitas terintegrasi: Syariah, Talenta, dan Wellbeing."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sharia Compliance Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kepatuhan Syariah</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syariah?.averageScore || 0}%</div>
            <Progress value={syariah?.averageScore || 0} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {syariah?.compliant || 0} dari {syariah?.total || 0} item sesuai
            </p>
          </CardContent>
        </Card>

        {/* Talent Index Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Indeks Talenta</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{talent?.total || 0} Terpetakan</div>
            <div className="flex gap-1 mt-2">
              <Badge variant="outline" className="text-[10px]">HP: {talent?.distribution?.HIGH_POTENTIAL || 0}</Badge>
              <Badge variant="outline" className="text-[10px]">KT: {talent?.distribution?.KEY_TALENT || 0}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Distribusi talenta kunci (High Potential & Key Talent)
            </p>
          </CardContent>
        </Card>

        {/* Student Wellbeing Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wellbeing Index (Avg)</CardTitle>
            <HeartPulse className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84%</div>
            <Progress value={84} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Berdasarkan 32 rekam medis & 12 sesi konseling bulan ini
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Analisis Kepatuhan Per Kategori</CardTitle>
            <CardDescription>Pemantauan 4 pilar utama syariah</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {syariah?.byCategory && Object.entries(syariah.byCategory).map(([cat, data]: [string, any]) => (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{cat}</span>
                  <span className="font-medium">{Math.round(data.averageScore)}%</span>
                </div>
                <Progress value={data.averageScore} className="h-1" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Early Warning System
            </CardTitle>
            <CardDescription>Deteksi dini indikator kritis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-100">
                <div className="text-sm font-medium text-red-800">Skor Syariah Unit TK Rendah</div>
                <Badge variant="destructive">Critical</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                <div className="text-sm font-medium text-yellow-800">Gap Kompetensi Guru SMA</div>
                <Badge className="bg-yellow-500">Major</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
