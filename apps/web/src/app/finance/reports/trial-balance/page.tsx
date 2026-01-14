"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays, format } from "date-fns";
import { useTrialBalance } from "@/hooks/use-finance-reports";
import { useAuthStore } from "@/stores/auth";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export default function TrialBalancePage() {
  const user = useAuthStore((state) => state.user);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  const { data: report, isLoading } = useTrialBalance(
    user?.unitId || "",
    dateRange.from,
    dateRange.to
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <h1 className="text-2xl font-bold">Neraca Saldo (Trial Balance)</h1>
          <DatePickerWithRange date={dateRange} setDate={setDateRange as any} />
          <Button onClick={handlePrint} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Cetak / PDF
          </Button>
        </div>

        <Card className="print:border-none print:shadow-none">
          <CardHeader className="text-center">
            <CardTitle>Neraca Saldo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Periode: {format(dateRange.from, "dd MMM yyyy")} - {format(dateRange.to, "dd MMM yyyy")}
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : report ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Akun</TableHead>
                      <TableHead>Nama Akun</TableHead>
                      <TableHead className="text-right">Saldo Awal</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Kredit</TableHead>
                      <TableHead className="text-right">Saldo Akhir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.accounts.map((item) => (
                      <TableRow key={item.code}>
                        <TableCell className="font-mono">{item.code}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.startBalance)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.debit)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.credit)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.endBalance)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(report.totals.startBalance)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(report.totals.debit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(report.totals.credit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(report.totals.endBalance)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data untuk periode ini
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
