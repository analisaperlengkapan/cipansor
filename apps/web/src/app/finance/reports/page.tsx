"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Download, FileText, PieChart, TrendingUp, Heart, Briefcase, BookOpen, Scale, Layers } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const useUnits = () => {
  return useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const res = await api.get("/units");
      return res.data.data;
    },
  });
};

const useReport = (type: string, params: any) => {
  return useQuery({
    queryKey: ["finance-report", type, params],
    queryFn: async () => {
      const res = await api.get(`/finance/accounting/reports/${type}`, { params });
      return res.data.data;
    },
    enabled: !!params.unitId,
  });
};

export default function StandardFinanceReportsPage() {
  const queryClient = useQueryClient();
  const { data: units } = useUnits();
  const [unitId, setUnitId] = useState("");
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [calkNote, setCalkNote] = useState("");

  const commonParams = { unitId, startDate, endDate };

  const { data: activities, isLoading: activitiesLoading } = useReport("statement-of-activities", commonParams);
  const { data: cashFlow, isLoading: cashFlowLoading } = useReport("cash-flow", commonParams);
  const { data: ziswaf, isLoading: ziswafLoading } = useReport("ziswaf", commonParams);
  const { data: bizUnit, isLoading: bizUnitLoading } = useReport("business-unit", commonParams);
  const { data: balanceSheet, isLoading: bsLoading } = useReport("balance-sheet", { unitId, endDate });
  const { data: calkData, isLoading: calkLoading } = useReport("calk", { unitId });
  const { data: realization, isLoading: realizationLoading } = useReport("budget-vs-actual", { unitId });

  useEffect(() => {
    if (calkData?.manualNotes?.[0]?.content) {
      setCalkNote(calkData.manualNotes[0].content);
    } else if (calkData?.template) {
      setCalkNote(calkData.template);
    }
  }, [calkData]);

  const saveNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.post("/finance/accounting/reports/notes", {
        unitId,
        reportType: "CALK",
        sectionKey: "MAIN",
        content,
      });
    },
    onSuccess: () => {
      toast.success("Catatan berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: ["finance-report", "calk"] });
    },
  });

  const handleExport = () => {
    // Mock export download for E2E
    const blob = new Blob(["mock content"], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "report.xlsx";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("Report exported to Excel");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pusat Laporan Keuangan</h1>
          <p className="text-muted-foreground">Laporan lengkap sesuai standar ISAK 35 dan PSAK 109</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={unitId} onValueChange={setUnitId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Unit" />
            </SelectTrigger>
            <SelectContent>
              {units?.map((unit: any) => (
                <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-auto" />
            <span>s/d</span>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-auto" />
          </div>
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
        </div>
      </div>

      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto flex-wrap">
          <TabsTrigger value="activities" className="py-2"><FileText className="mr-2 h-4 w-4" /> Laba Rugi (Aktivitas)</TabsTrigger>
          <TabsTrigger value="neraca" className="py-2"><Scale className="mr-2 h-4 w-4" /> Neraca</TabsTrigger>
          <TabsTrigger value="netassets" className="py-2"><Layers className="mr-2 h-4 w-4" /> Perubahan Aset Neto</TabsTrigger>
          <TabsTrigger value="cashflow" className="py-2"><TrendingUp className="mr-2 h-4 w-4" /> Arus Kas</TabsTrigger>
          <TabsTrigger value="ziswaf" className="py-2"><Heart className="mr-2 h-4 w-4" /> ZISWAF</TabsTrigger>
          <TabsTrigger value="realisasi" className="py-2"><PieChart className="mr-2 h-4 w-4" /> Realisasi</TabsTrigger>
          <TabsTrigger value="business" className="py-2"><Briefcase className="mr-2 h-4 w-4" /> Unit Usaha</TabsTrigger>
          <TabsTrigger value="calk" className="py-2"><BookOpen className="mr-2 h-4 w-4" /> CALK</TabsTrigger>
        </TabsList>

        {/* Laporan Aktivitas (ISAK 35) */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Penghasilan Komprehensif (Laporan Aktivitas)</CardTitle>
              <CardDescription>Berdasarkan standar ISAK 35 untuk Entitas Non-Laba</CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? <Loader2 className="animate-spin mx-auto" /> : activities ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section>
                      <h3 className="font-bold text-lg mb-4 text-green-700">Pendapatan & Penghasilan</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between font-semibold border-b pb-1">
                          <span>Tanpa Pembatasan</span>
                          <span>{formatCurrency(activities.revenues.unrestricted.total)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-b pb-1">
                          <span>Dengan Pembatasan</span>
                          <span>{formatCurrency(activities.revenues.restricted.total)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold pt-2">
                          <span>Total Pendapatan</span>
                          <span>{formatCurrency(activities.revenues.total)}</span>
                        </div>
                      </div>
                    </section>
                    <section>
                      <h3 className="font-bold text-lg mb-4 text-red-700">Beban-Beban</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between font-semibold border-b pb-1">
                          <span>Total Beban Operasional</span>
                          <span>{formatCurrency(activities.expenses.total)}</span>
                        </div>
                      </div>
                    </section>
                  </div>
                  <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
                    <span className="text-xl font-bold">Perubahan Aset Neto (Surplus/Defisit)</span>
                    <span className={`text-2xl font-bold ${activities.changeInNetAssets.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(activities.changeInNetAssets.total)}
                    </span>
                  </div>
                </div>
              ) : <div className="text-center py-10 text-muted-foreground">Pilih unit untuk melihat data</div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Neraca (Statement of Financial Position) */}
        <TabsContent value="neraca">
          <Card>
            <CardHeader><CardTitle>Laporan Posisi Keuangan (Neraca)</CardTitle></CardHeader>
            <CardContent>
              {bsLoading ? <Loader2 className="animate-spin mx-auto" /> : balanceSheet ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-blue-700">Aset</h3>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Aset</span>
                      <span>{formatCurrency(balanceSheet.totalAssets)}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-blue-700">Liabilitas & Aset Neto</h3>
                    <div className="flex justify-between"><span>Total Liabilitas</span><span>{formatCurrency(balanceSheet.totalLiabilities)}</span></div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total Aset Neto</span>
                      <span>{formatCurrency(balanceSheet.totalEquity)}</span>
                    </div>
                  </div>
                </div>
              ) : <div className="text-center py-10">Data tidak tersedia</div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Perubahan Aset Neto */}
        <TabsContent value="netassets">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Perubahan Aset Neto</CardTitle>
              <CardDescription>Menunjukkan mutasi aset neto selama periode berjalan</CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? <Loader2 className="animate-spin mx-auto" /> : activities ? (
                <div className="space-y-6">
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-3 text-left">Keterangan</th>
                          <th className="p-3 text-right">Tanpa Pembatasan</th>
                          <th className="p-3 text-right">Dengan Pembatasan</th>
                          <th className="p-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-3">Saldo Awal Aset Neto</td>
                          <td className="p-3 text-right">-</td>
                          <td className="p-3 text-right">-</td>
                          <td className="p-3 text-right font-bold">{formatCurrency(activities.netAssets.beginning)}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Perubahan Periode Berjalan</td>
                          <td className="p-3 text-right">{formatCurrency(activities.changeInNetAssets.unrestricted)}</td>
                          <td className="p-3 text-right">{formatCurrency(activities.changeInNetAssets.restricted)}</td>
                          <td className="p-3 text-right font-bold">{formatCurrency(activities.changeInNetAssets.total)}</td>
                        </tr>
                        <tr className="border-b bg-muted/50 font-bold">
                          <td className="p-3">Saldo Akhir Aset Neto</td>
                          <td className="p-3 text-right">-</td>
                          <td className="p-3 text-right">-</td>
                          <td className="p-3 text-right">{formatCurrency(activities.netAssets.ending)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : <div className="text-center py-10">Pilih unit untuk melihat data</div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Arus Kas */}
        <TabsContent value="cashflow">
          <Card>
            <CardHeader><CardTitle>Laporan Arus Kas</CardTitle></CardHeader>
            <CardContent>
               {cashFlowLoading ? <Loader2 className="animate-spin mx-auto" /> : cashFlow ? (
                 <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Aktivitas Operasi</p>
                        <p className="text-xl font-bold">{formatCurrency(cashFlow.operating)}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Aktivitas Investasi</p>
                        <p className="text-xl font-bold">{formatCurrency(cashFlow.investing)}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Aktivitas Pendanaan</p>
                        <p className="text-xl font-bold">{formatCurrency(cashFlow.financing)}</p>
                      </div>
                    </div>
                    <div className="space-y-2 border-t pt-4">
                      <div className="flex justify-between"><span>Saldo Kas Awal</span><span>{formatCurrency(cashFlow.beginningBalance)}</span></div>
                      <div className="flex justify-between font-bold text-lg"><span>Saldo Kas Akhir</span><span>{formatCurrency(cashFlow.endingBalance)}</span></div>
                    </div>
                 </div>
               ) : <div className="text-center py-10">Data tidak tersedia</div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan ZISWAF (PSAK 109) */}
        <TabsContent value="ziswaf">
          <Card>
            <CardHeader><CardTitle>Laporan Sumber dan Penyaluran Dana ZISWAF</CardTitle><CardDescription>Standar PSAK 109</CardDescription></CardHeader>
            <CardContent>
              {ziswafLoading ? <Loader2 className="animate-spin mx-auto" /> : (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left">Jenis Dana</th>
                        <th className="p-3 text-right">Penerimaan</th>
                        <th className="p-3 text-right">Penyaluran</th>
                        <th className="p-3 text-right">Saldo Bersih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ziswaf?.map((item: any) => (
                        <tr key={item.type} className="border-b">
                          <td className="p-3 font-medium">{item.type}</td>
                          <td className="p-3 text-right text-green-600">{formatCurrency(item.receipts)}</td>
                          <td className="p-3 text-right text-red-600">{formatCurrency(item.distributions)}</td>
                          <td className="p-3 text-right font-bold">{formatCurrency(item.netChange)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Realisasi Anggaran */}
        <TabsContent value="realisasi">
          <Card>
            <CardHeader><CardTitle>Laporan Realisasi Anggaran</CardTitle></CardHeader>
            <CardContent>
              {realizationLoading ? <Loader2 className="animate-spin mx-auto" /> : realization ? (
                <div className="border rounded-md overflow-hidden">
                   <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left">Akun</th>
                        <th className="p-3 text-right">Anggaran</th>
                        <th className="p-3 text-right">Realisasi</th>
                        <th className="p-3 text-right">Selisih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realization.map((item: any) => (
                        <tr key={item.accountCode} className="border-b">
                          <td className="p-3">{item.accountName}</td>
                          <td className="p-3 text-right">{formatCurrency(item.budget)}</td>
                          <td className="p-3 text-right">{formatCurrency(item.actual)}</td>
                          <td className="p-3 text-right">{formatCurrency(item.variance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="text-center py-10">Data tidak tersedia</div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unit Usaha */}
        <TabsContent value="business">
           <Card>
             <CardHeader><CardTitle>Performa Arus Dana Unit Usaha</CardTitle></CardHeader>
             <CardContent>
                {bizUnitLoading ? <Loader2 className="animate-spin mx-auto" /> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bizUnit?.map((bu: any) => (
                      <Card key={bu.businessUnitId} className="bg-muted/30">
                        <CardHeader className="pb-2"><CardTitle className="text-md">{bu.name}</CardTitle></CardHeader>
                        <CardContent>
                          <div className="flex justify-between text-sm"><span>Pendapatan</span><span>{formatCurrency(bu.revenue)}</span></div>
                          <div className="flex justify-between text-sm"><span>Beban</span><span>{formatCurrency(bu.expense)}</span></div>
                          <div className="flex justify-between font-bold mt-2 pt-2 border-t text-blue-700"><span>Laba Bersih</span><span>{formatCurrency(bu.netProfit)}</span></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
             </CardContent>
           </Card>
        </TabsContent>

        {/* CALK */}
        <TabsContent value="calk">
           <Card>
             <CardHeader><CardTitle>Catatan Atas Laporan Keuangan (CALK)</CardTitle></CardHeader>
             <CardContent>
                <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-md mb-4">
                  <p className="text-sm text-yellow-800">Bagian ini menampilkan rincian kebijakan akuntansi dan penjelasan naratif atas pos-pos laporan keuangan.</p>
                </div>
                <div className="prose max-w-none">
                  <textarea
                    className="w-full h-64 p-4 border rounded-md"
                    placeholder="Tulis catatan atau kebijakan akuntansi di sini..."
                    value={calkNote}
                    onChange={(e) => setCalkNote(e.target.value)}
                  />
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => saveNoteMutation.mutate(calkNote)}
                      disabled={saveNoteMutation.isPending || !unitId}
                    >
                      {saveNoteMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                      Simpan Catatan
                    </Button>
                  </div>
                </div>
             </CardContent>
           </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
