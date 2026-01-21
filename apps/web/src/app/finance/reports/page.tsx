"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { BudgetRealizationItem } from "@cipansor/shared";
import { Loader2, Download, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock or existing hook for units
const useUnits = () => {
  return useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const res = await api.get("/units");
      return res.data.data;
    },
  });
};

const useBalanceSheet = (unitId: string, date: string) => {
  return useQuery({
    queryKey: ["balance-sheet", unitId, date],
    queryFn: async () => {
      const res = await api.get("/finance-enhancement/reports/balance-sheet", {
        params: { unitId, date },
      });
      return res.data.data;
    },
    enabled: !!unitId && !!date,
  });
};

const useIncomeStatement = (
  unitId: string,
  startDate: string,
  endDate: string,
) => {
  return useQuery({
    queryKey: ["income-statement", unitId, startDate, endDate],
    queryFn: async () => {
      const res = await api.get(
        "/finance-enhancement/reports/income-statement",
        { params: { unitId, startDate, endDate } },
      );
      return res.data.data;
    },
    enabled: !!unitId && !!startDate && !!endDate,
  });
};

const useBudgetRealization = (unitId: string, academicYearId: string) => {
  return useQuery({
    queryKey: ["budget-realization", unitId, academicYearId],
    queryFn: async () => {
      const res = await api.get(
        "/finance-enhancement/reports/budget-realization",
        { params: { unitId, academicYearId } },
      );
      return res.data.data;
    },
    enabled: !!unitId && !!academicYearId,
  });
};

const useAcademicYears = () => {
  return useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const res = await api.get("/academic-years");
      return res.data.data;
    },
  });
};

// Recursive component for BS Tree
const AccountNode = ({ node, level = 0 }: { node: any; level?: number }) => (
  <>
    <div
      className={`flex justify-between py-2 border-b ${level === 0 ? "font-bold bg-muted/50 px-2" : ""}`}
      style={{ paddingLeft: `${level * 20 + 8}px` }}
    >
      <span>
        {node.code} - {node.name}
      </span>
      <span>{formatCurrency(node.amount)}</span>
    </div>
    {node.children?.map((child: any) => (
      <AccountNode key={child.code} node={child} level={level + 1} />
    ))}
  </>
);

export default function FinanceReportsPage() {
  const { data: units } = useUnits();
  const { data: years } = useAcademicYears();

  const [unitId, setUnitId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const { data: bs, isLoading: bsLoading } = useBalanceSheet(unitId, date);
  const { data: pl, isLoading: plLoading } = useIncomeStatement(
    unitId,
    startDate,
    endDate,
  );
  const { data: realization, isLoading: realizationLoading } =
    useBudgetRealization(unitId, academicYearId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Laporan Keuangan</h1>
        <div className="flex gap-4">
          <Select value={unitId} onValueChange={setUnitId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Pilih Unit" />
            </SelectTrigger>
            <SelectContent>
              {units?.map((unit: any) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={academicYearId} onValueChange={setAcademicYearId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              {years?.map((year: any) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link href="/finance/reports/trial-balance" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Neraca Saldo
              </CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Trial Balance</div>
              <p className="text-xs text-muted-foreground">
                Lihat saldo akhir semua akun
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/finance/reports/general-ledger" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Buku Besar</CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">General Ledger</div>
              <p className="text-xs text-muted-foreground">
                Detail transaksi per akun
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/finance/reports/cash-flow" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Arus Kas</CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Cash Flow</div>
              <p className="text-xs text-muted-foreground">
                Laporan keluar masuk kas
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Tabs defaultValue="neraca" className="space-y-4">
        <TabsList>
          <TabsTrigger value="neraca">Neraca (Balance Sheet)</TabsTrigger>
          <TabsTrigger value="laba-rugi">
            Laba Rugi (Income Statement)
          </TabsTrigger>
          <TabsTrigger value="realisasi">Realisasi Anggaran</TabsTrigger>
        </TabsList>

        <TabsContent value="realisasi" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Laporan Realisasi Anggaran</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {realizationLoading ? (
                <Loader2 className="animate-spin" />
              ) : realization ? (
                <div className="space-y-6">
                  {/* Totals Summary */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Total Anggaran
                      </div>
                      <div className="text-xl font-bold">
                        {formatCurrency(realization.totals.budget)}
                      </div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Realisasi
                      </div>
                      <div className="text-xl font-bold">
                        {formatCurrency(realization.totals.actual)}
                      </div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Sisa Anggaran
                      </div>
                      <div className="text-xl font-bold">
                        {formatCurrency(realization.totals.variance)}
                      </div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Persentase
                      </div>
                      <div className="text-xl font-bold">
                        {realization.totals.percentage.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-md">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 font-semibold">
                        <tr>
                          <th className="p-3 text-left">Kode Akun</th>
                          <th className="p-3 text-left">Uraian</th>
                          <th className="p-3 text-right">Anggaran</th>
                          <th className="p-3 text-right">Realisasi</th>
                          <th className="p-3 text-right">Sisa</th>
                          <th className="p-3 text-center">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {realization.items.map(
                          (item: BudgetRealizationItem) => (
                            <tr
                              key={item.accountId}
                              className="border-b hover:bg-muted/10"
                            >
                              <td className="p-3 font-mono">{item.code}</td>
                              <td className="p-3">{item.name}</td>
                              <td className="p-3 text-right">
                                {formatCurrency(item.budgetAmount)}
                              </td>
                              <td className="p-3 text-right">
                                {formatCurrency(item.actualAmount)}
                              </td>
                              <td
                                className={`p-3 text-right font-medium ${item.variance < 0 ? "text-red-600" : "text-green-600"}`}
                              >
                                {formatCurrency(item.variance)}
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${item.percentage > 90 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
                                >
                                  {item.percentage.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  Pilih Unit dan Tahun Ajaran untuk melihat laporan.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="neraca" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Posisi Keuangan per {date}</CardTitle>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-auto"
                />
                <Button variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {bsLoading ? (
                <Loader2 className="animate-spin" />
              ) : bs ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">
                      Aktiva (Assets)
                    </h3>
                    {bs.assets.items.map((node: any) => (
                      <AccountNode key={node.code} node={node} />
                    ))}
                    <div className="flex justify-between font-bold text-lg pt-4 border-t-2">
                      <span>Total Aktiva</span>
                      <span>{formatCurrency(bs.assets.total)}</span>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Kewajiban (Liabilities)
                      </h3>
                      {bs.liabilities.items.map((node: any) => (
                        <AccountNode key={node.code} node={node} />
                      ))}
                      <div className="flex justify-between font-bold pt-2">
                        <span>Total Kewajiban</span>
                        <span>{formatCurrency(bs.liabilities.total)}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Ekuitas (Equity)
                      </h3>
                      {bs.equity.items.map((node: any) => (
                        <AccountNode key={node.code} node={node} />
                      ))}
                      <div className="flex justify-between font-bold pt-2">
                        <span>Total Ekuitas</span>
                        <span>{formatCurrency(bs.equity.total)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-4 border-t-2">
                      <span>Total Pasiva</span>
                      <span>
                        {formatCurrency(bs.liabilities.total + bs.equity.total)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  Pilih Unit untuk melihat laporan.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="laba-rugi" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Laporan Aktivitas {startDate} s/d {endDate}
              </CardTitle>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-auto"
                />
                <span className="self-center">-</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-auto"
                />
                <Button variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {plLoading ? (
                <Loader2 className="animate-spin" />
              ) : pl ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <div className="text-sm text-green-600">
                        Total Pendapatan
                      </div>
                      <div className="text-2xl font-bold text-green-700">
                        {formatCurrency(pl.summary.totalIncome)}
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                      <div className="text-sm text-red-600">Total Beban</div>
                      <div className="text-2xl font-bold text-red-700">
                        {formatCurrency(pl.summary.totalExpense)}
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-sm text-blue-600">
                        Surplus/Defisit
                      </div>
                      <div className="text-2xl font-bold text-blue-700">
                        {formatCurrency(pl.summary.netIncome)}
                      </div>
                    </div>
                  </div>

                  {/* Detailed List (This normally needs grouping by type, simplified here) */}
                  <div className="border rounded-md">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-2 text-left">Kode Akun</th>
                          <th className="p-2 text-left">Nama Akun</th>
                          <th className="p-2 text-right">Pendapatan</th>
                          <th className="p-2 text-right">Beban</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pl.breakdown.map((item: any) => (
                          <tr key={item.accountCode} className="border-b">
                            <td className="p-2">{item.accountCode}</td>
                            <td className="p-2">{item.accountName}</td>
                            <td className="p-2 text-right">
                              {item.income > 0
                                ? formatCurrency(item.income)
                                : "-"}
                            </td>
                            <td className="p-2 text-right">
                              {item.expense > 0
                                ? formatCurrency(item.expense)
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  Pilih Unit untuk melihat laporan.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
