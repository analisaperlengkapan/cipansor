"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays, format } from "date-fns";
import { useGeneralLedger } from "@/hooks/use-finance-reports";
import { useAuthStore } from "@/stores/auth";
import { Loader2, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Note: We need a hook to fetch account list. Assuming useAccounts exists or create basic one locally.
// For now, text input for Account ID/Code is minimal viable.

export default function GeneralLedgerPage() {
  const user = useAuthStore((state) => state.user);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [accountId, setAccountId] = useState<string>(""); // Ideally a dropdown

  const { data: report, isLoading, refetch } = useGeneralLedger(
    user?.unitId || "",
    accountId,
    dateRange.from,
    dateRange.to
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <h1 className="text-2xl font-bold">Buku Besar (General Ledger)</h1>
          <div className="flex gap-4 items-end">
            <div className="grid gap-1.5">
              <Label>Periode</Label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange as any} />
            </div>
            <div className="grid gap-1.5 w-64">
              <Label>Akun ID (Sementara)</Label>
              <Input
                placeholder="Masukkan ID Akun"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handlePrint} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Cetak / PDF
          </Button>
        </div>

        <Card className="print:border-none print:shadow-none">
          <CardHeader className="text-center">
            <CardTitle>Buku Besar</CardTitle>
            <p className="text-sm text-muted-foreground">
              Periode: {format(dateRange.from, "dd MMM yyyy")} - {format(dateRange.to, "dd MMM yyyy")}
            </p>
            {report && report.accounts.length > 0 && (
              <div className="mt-2 font-semibold">
                {report.accounts[0].code} - {report.accounts[0].name}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!accountId ? (
              <div className="text-center py-8 text-muted-foreground">
                Silakan pilih akun untuk melihat detail buku besar
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : report && report.accounts.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>Ref</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Kredit</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell colSpan={5}>Saldo Awal</TableCell>
                      <TableCell className="text-right">{formatCurrency(report.accounts[0].startBalance)}</TableCell>
                    </TableRow>
                    {report.accounts[0].entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{format(new Date(entry.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{entry.reference || '-'}</TableCell>
                        <TableCell className="text-right">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</TableCell>
                        <TableCell className="text-right">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(entry.balance)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={5}>Saldo Akhir</TableCell>
                      <TableCell className="text-right">{formatCurrency(report.accounts[0].endBalance)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data transaksi untuk akun ini pada periode yang dipilih
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
