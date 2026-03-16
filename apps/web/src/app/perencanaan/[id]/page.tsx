"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { usePlan, useApprovePlan } from "@/hooks/use-perencanaan";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Target, Calendar, CheckCircle2, TrendingUp, Activity, BarChart, ShieldAlert, ClipboardCheck, ArrowRight } from "lucide-react";
import { RiskLevelBadge } from "@/components/risk/risk-badges";
import Link from "next/link";

export default function PerencanaanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const { data: plan, isLoading } = usePlan(planId);
  const approvePlan = useApprovePlan();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Rencana Tidak Ditemukan</h2>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  const handleApprove = async () => {
    if (confirm("Apakah Anda yakin ingin menyetujui dokumen perencanaan ini?")) {
      await approvePlan.mutateAsync(plan.id);
    }
  };

  const statusColor = {
    DRAFT: "bg-slate-100 text-slate-700",
    REVIEW: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    ACTIVE: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-purple-100 text-purple-700",
  }[plan.status as string] || "bg-gray-100 text-gray-700";

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Button variant="ghost" className="mb-2 -ml-4" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali
      </Button>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <PageHeader title={plan.title} description={`Tipe: ${plan.type}`} />
            <Badge className={`${statusColor} hover:${statusColor} ml-2 mt-[-24px]`}>
              {plan.status}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {(plan.status === "DRAFT" || plan.status === "REVIEW") && (
            <Button onClick={handleApprove} disabled={approvePlan.isPending}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Setujui Rencana
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" /> Deskripsi Perencanaan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm rounded-md leading-relaxed">
              {plan.description || "Belum ada deskripsi."}
            </p>
            
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Progres Keseluruhan Rencana
                </span>
                <span className="text-sm font-bold text-primary">{plan.progress}%</span>
              </div>
              <Progress value={plan.progress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Detail Waktu & Dana
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Unit Terkait</span>
              <span className="font-medium">Semua Unit (Demo)</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Anggaran (Estimasi)</span>
              <span className="font-medium">Rp {Number(plan.budget || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Tgl Mulai</span>
              <span className="font-medium">{plan.startDate ? format(new Date(plan.startDate), "dd MMM yyyy", { locale: localeId }) : "-"}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Tgl Selesai</span>
              <span className="font-medium">{plan.endDate ? format(new Date(plan.endDate), "dd MMM yyyy", { locale: localeId }) : "-"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="objectives">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-slate-100/50">
            <TabsTrigger value="objectives" className="flex items-center gap-2">
              <Target className="w-4 h-4" /> Tujuan & Sasaran (IKI)
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Activity className="w-4 h-4" /> Program & Kegiatan
            </TabsTrigger>
            <TabsTrigger value="risks" className="flex items-center gap-2 text-rose-600 data-[state=active]:text-rose-700">
              <ShieldAlert className="w-4 h-4" /> Faktor Risiko
            </TabsTrigger>
            <TabsTrigger value="audits" className="flex items-center gap-2 text-blue-600 data-[state=active]:text-blue-700">
              <ClipboardCheck className="w-4 h-4" /> Jejak Audit & Temuan
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="objectives">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-lg">Daftar Sasaran Strategis</CardTitle>
              <Button size="sm" variant="outline">+ Tambah Sasaran</Button>
            </CardHeader>
            <CardContent className="p-0">
              {plan.objectives && plan.objectives.length > 0 ? (
                <div className="divide-y">
                  {plan.objectives.map((obj: any) => (
                    <div key={obj.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-base">{obj.title}</h4>
                          <span className="text-xs text-muted-foreground">Bobot: {obj.weight}% | Prioritas: {obj.priority}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-primary">{obj.progress}%</span>
                          <Progress value={obj.progress} className="h-2 w-24 mt-1" />
                        </div>
                      </div>

                      {obj.indicators && obj.indicators.length > 0 && (
                        <div className="mt-3 bg-slate-50 border rounded-md p-3">
                          <h5 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                            <BarChart className="w-3 h-3" /> Indikator Kinerja Utama
                          </h5>
                          <div className="space-y-2">
                            {obj.indicators.map((ind: any) => (
                              <div key={ind.id} className="flex justify-between text-sm items-center">
                                <span className="text-slate-700">• {ind.name}</span>
                                <div className="text-right">
                                  <span className="font-medium">{ind.currentValue}</span>
                                  <span className="text-slate-400 mx-1">/</span>
                                  <span className="text-slate-500">{ind.targetValue} {ind.unit}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Belum ada sasaran strategis yang ditambahkan.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Daftar kegiatan terkait rencana ini akan ditampilkan di sini.</p>
              <Button variant="outline" className="mt-4">Petakan Kegiatan Baru</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks">
          <Card className="border-rose-100 shadow-sm">
            <CardHeader className="bg-rose-50/50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-rose-800">
                <ShieldAlert className="w-5 h-5" /> Identifikasi & Pemetaan Risiko
              </CardTitle>
              <CardDescription>
                Daftar risiko yang berpotensi menghambat eksekusi Rencana Strategis ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {plan.risks && plan.risks.length > 0 ? (
                <div className="space-y-4">
                  {plan.risks.map((risk: any) => (
                    <div key={risk.id} className="p-4 border rounded-lg bg-white flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <RiskLevelBadge level={risk.riskLevel || 'UNKNOWN'} />
                        <div>
                          <p className="font-medium text-slate-800">{risk.code} - {risk.category}</p>
                          <p className="text-xs text-muted-foreground">{risk.status}</p>
                        </div>
                      </div>
                      <Link href={`/risk-management/${risk.id}`}>
                        <Button size="sm" variant="ghost">Lihat Detail Mitigasi <ArrowRight className="w-4 h-4 ml-1" /></Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30 text-rose-400" />
                  <p>Belum ada risiko yang dipetakan pada rencana ini.</p>
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <Link href={`/risk-management/create?strategicPlanId=${plan.id}`}>
                  <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50">Identifikasi Risiko Baru</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="bg-blue-50/50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                <ClipboardCheck className="w-5 h-5" /> Rekam Jejak Audit Internal
              </CardTitle>
              <CardDescription>
                Daftar temuan audit (SPI) dan status tindak lanjut (Follow-up) atas program/kegiatan dalam rencana ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {plan.internalAudits && plan.internalAudits.length > 0 ? (
                <div className="space-y-4">
                  {plan.internalAudits.map((audit: any) => (
                    <div key={audit.id} className="p-4 border rounded-lg bg-white flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                          {audit.status}
                        </Badge>
                        <span className="font-medium text-slate-800">Audit Terkait Perencanaan</span>
                      </div>
                      <Link href={`/pengawasan/${audit.id}`}>
                        <Button size="sm" variant="ghost">Buka Detail Audit <ArrowRight className="w-4 h-4 ml-1" /></Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-400" />
                  <p>Belum ada rekaman audit internal yang dikaitkan.</p>
                </div>
              )}
              <div className="mt-4 flex justify-end">
                 <Link href={`/pengawasan?strategicPlanId=${plan.id}&create=true`}>
                   <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">Jadwalkan Audit Internal</Button>
                 </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
