"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { usePlan, useApprovePlan, usePlanRealization } from "@/hooks/use-perencanaan";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Target, Calendar, CheckCircle2, TrendingUp, Activity, BarChart, ShieldAlert, ClipboardCheck, Plus, Wallet } from "lucide-react";
import { ObjectiveForm } from "@/components/perencanaan/objective-form";
import { ActivityForm } from "@/components/perencanaan/activity-form";

// Helper to format currency
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function PerencanaanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const { data: plan, isLoading } = usePlan(planId);
  const { data: realization, isLoading: isLoadingRealization } = usePlanRealization(planId);
  const approvePlan = useApprovePlan();

  const [objectiveDialogOpen, setObjectiveDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

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

  const handleAddActivity = (objectiveId: string) => {
    setSelectedObjectiveId(objectiveId);
    setEditingItem(null);
    setActivityDialogOpen(true);
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
              <span className="font-medium">{plan.unit?.name || "Semua Unit"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Tgl Mulai</span>
              <span className="font-medium">{plan.startDate ? format(new Date(plan.startDate), "dd MMM yyyy", { locale: localeId }) : "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Tgl Selesai</span>
              <span className="font-medium">{plan.endDate ? format(new Date(plan.endDate), "dd MMM yyyy", { locale: localeId }) : "-"}</span>
            </div>

            <div className="pt-2">
              <h4 className="font-semibold mb-2 flex items-center gap-1">
                <Wallet className="w-4 h-4" /> Status Keuangan
              </h4>
              {isLoadingRealization ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Anggaran Kegiatan</span>
                    <span className="font-bold">{formatRupiah(realization?.activitiesTotalBudget || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-600">
                    <span>Realisasi (Keuangan)</span>
                    <span className="font-bold">{formatRupiah(realization?.realizedAmount || 0)}</span>
                  </div>
                  <Progress
                    value={realization?.activitiesTotalBudget > 0 ? (realization.realizedAmount / realization.activitiesTotalBudget) * 100 : 0}
                    className="h-2 bg-slate-100 [&>div]:bg-emerald-500"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activities">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-slate-100/50">
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Activity className="w-4 h-4" /> Program & Kegiatan
            </TabsTrigger>
            <TabsTrigger value="objectives" className="flex items-center gap-2">
              <Target className="w-4 h-4" /> Tujuan & Sasaran (IKI)
            </TabsTrigger>
            <TabsTrigger value="risks" className="flex items-center gap-2 text-rose-600 data-[state=active]:text-rose-700">
              <ShieldAlert className="w-4 h-4" /> Faktor Risiko
            </TabsTrigger>
            <TabsTrigger value="audits" className="flex items-center gap-2 text-blue-600 data-[state=active]:text-blue-700">
              <ClipboardCheck className="w-4 h-4" /> Jejak Audit
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="objectives">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-lg">Daftar Sasaran Strategis</CardTitle>
              <Button size="sm" onClick={() => { setEditingItem(null); setObjectiveDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Tambah Sasaran
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {plan.objectives && plan.objectives.length > 0 ? (
                <div className="divide-y">
                  {plan.objectives.map((obj: any) => (
                    <div key={obj.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-base">{obj.title}</h4>
                          <p className="text-sm text-muted-foreground">{obj.description}</p>
                          <span className="text-xs text-muted-foreground mt-1 block">
                            Bobot: {obj.weight}% | Prioritas: {obj.priority}
                          </span>
                        </div>
                        <div className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleAddActivity(obj.id)}>
                            + Kegiatan
                          </Button>
                        </div>
                      </div>
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
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-lg">Daftar Kegiatan & Anggaran</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {plan.objectives?.flatMap((o: any) => o.activities).length > 0 ? (
                <div className="divide-y">
                  {plan.objectives.map((obj: any) => (
                    <div key={obj.id}>
                      <div className="bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 border-b border-t">
                        {obj.title}
                      </div>
                      {obj.activities?.map((act: any) => {
                        const realizationItem = realization?.details?.find((r: any) => r.activityId === act.id);
                        return (
                          <div key={act.id} className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center hover:bg-white transition-colors">
                            <div className="flex-1">
                              <h5 className="font-medium">{act.title}</h5>
                              <p className="text-sm text-muted-foreground line-clamp-1">{act.description}</p>
                              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {act.startDate ? format(new Date(act.startDate), "dd/MM/yy") : "-"} s/d {act.endDate ? format(new Date(act.endDate), "dd/MM/yy") : "-"}
                                </span>
                                {act.account && (
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                                    Akun: {act.account.code} - {act.account.name}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="w-full md:w-64 bg-slate-50 p-3 rounded border border-slate-100">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Anggaran:</span>
                                <span className="font-medium">{formatRupiah(Number(act.budget || 0))}</span>
                              </div>
                              <div className="flex justify-between text-xs mb-2">
                                <span>Realisasi:</span>
                                <span className="font-medium text-emerald-600">
                                  {formatRupiah(realizationItem?.realizedAmount || 0)}
                                </span>
                              </div>
                              <Progress
                                value={Number(act.budget) > 0 ? ((realizationItem?.realizedAmount || 0) / Number(act.budget)) * 100 : 0}
                                className="h-1.5"
                              />
                            </div>
                          </div>
                        );
                      })}
                      {(!obj.activities || obj.activities.length === 0) && (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          Belum ada kegiatan untuk sasaran ini.
                          <Button variant="link" size="sm" onClick={() => handleAddActivity(obj.id)}>Tambah Kegiatan</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Belum ada kegiatan. Tambahkan sasaran terlebih dahulu.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30 text-rose-400" />
              <p>Fitur Manajemen Risiko tersedia di modul terpisah.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-400" />
              <p>Fitur Audit Internal tersedia di modul terpisah.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={objectiveDialogOpen} onOpenChange={setObjectiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Sasaran" : "Tambah Sasaran"}</DialogTitle>
          </DialogHeader>
          <ObjectiveForm
            planId={planId}
            initialData={editingItem}
            onSuccess={() => setObjectiveDialogOpen(false)}
            onCancel={() => setObjectiveDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Kegiatan" : "Tambah Kegiatan"}</DialogTitle>
          </DialogHeader>
          <ActivityForm
            planId={planId}
            objectiveId={selectedObjectiveId || ""}
            initialData={editingItem}
            onSuccess={() => setActivityDialogOpen(false)}
            onCancel={() => setActivityDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
