"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTrialBalanceReport, AccountType } from "@/hooks/use-finance-enhancement";
import { useUnits } from "@/hooks/use-units";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function TrialBalancePage() {
  const currentDate = new Date();
  const [unitId, setUnitId] = useState("");
  const [startDate, setStartDate] = useState(
    format(new Date(currentDate.getFullYear(), 0, 1), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(format(currentDate, "yyyy-MM-dd"));

  const { data: units } = useUnits();
  const { data: report, isLoading } = useTrialBalanceReport({
    unitId: unitId || undefined,
    startDate,
    endDate,
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Neraca Saldo (Trial Balance)"
          description="Laporan saldo akhir semua akun dalam periode tertentu"
          actions={
            <Link href="/finance/reports">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>
          }
        />

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={unitId} onValueChange={setUnitId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Semua Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Unit</SelectItem>
                    {units?.map((unit: any) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Akhir</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : report ? (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Kode Akun</TableHead>
                        <TableHead>Nama Akun</TableHead>
                        <TableHead className="text-right">Saldo Awal</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Kredit</TableHead>
                        <TableHead className="text-right">Saldo Akhir</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.accounts.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Tidak ada data
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {report.accounts.map((acc, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-mono font-medium">
                                {acc.code}
                              </TableCell>
                              <TableCell>{acc.name}</TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground">
                                {formatCurrency(acc.startBalance)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {acc.debit > 0 ? formatCurrency(acc.debit) : "-"}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {acc.credit > 0
                                  ? formatCurrency(acc.credit)
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold">
                                {formatCurrency(acc.endBalance)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 font-bold border-t-2">
                            <TableCell colSpan={2}>TOTAL</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(report.totals.startBalance)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(report.totals.debit)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(report.totals.credit)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(report.totals.endBalance)}
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {!report.isBalanced && (
                  <div className="p-4 bg-red-50 text-red-800 rounded-md border border-red-200">
                    Warning: Neraca Saldo tidak seimbang. Selisih:{" "}
                    {formatCurrency(report.totals.endBalance)}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Pilih filter untuk melihat laporan
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
