"use client";

import { useState } from "react";
import { safeFormat } from "@/lib/date";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  useGeneralLedgerReport,
  useAccountCodes,
} from "@/hooks/use-finance-enhancement";
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
import { id as localeID } from "date-fns/locale";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function GeneralLedgerPage() {
  const currentDate = new Date();
  const [unitId, setUnitId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [startDate, setStartDate] = useState(
    safeFormat(new Date(currentDate.getFullYear(), 0, 1), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(format(currentDate, "yyyy-MM-dd"));

  const { data: units } = useUnits();
  const { data: accounts } = useAccountCodes({ isActive: true, limit: 1000 });
  const { data: report, isLoading } = useGeneralLedgerReport({
    unitId: unitId || undefined,
    accountId,
    startDate,
    endDate,
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Buku Besar (General Ledger)"
          description="Rincian transaksi per akun"
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={unitId} onValueChange={setUnitId}>
                  <SelectTrigger>
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
                <Label>Akun</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Akun" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.data.map((acc: any) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : report && report.accounts.length > 0 ? (
              <div className="space-y-8">
                {report.accounts.map((acc) => (
                  <div key={acc.accountId} className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <div>
                        <h3 className="text-lg font-bold">
                          {acc.code} - {acc.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          Saldo Awal
                        </div>
                        <div className="font-mono font-medium">
                          {formatCurrency(acc.startBalance)}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[120px]">Tanggal</TableHead>
                            <TableHead>Keterangan</TableHead>
                            <TableHead className="text-right w-[150px]">
                              Debit
                            </TableHead>
                            <TableHead className="text-right w-[150px]">
                              Kredit
                            </TableHead>
                            <TableHead className="text-right w-[150px]">
                              Saldo
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {acc.entries.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-4 text-muted-foreground"
                              >
                                Tidak ada transaksi
                              </TableCell>
                            </TableRow>
                          ) : (
                            acc.entries.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell>
                                  {safeFormat(
                                    new Date(entry.date),
                                    "dd/MM/yyyy",
                                  )}
                                </TableCell>
                                <TableCell>
                                  {entry.description}
                                  {entry.reference && (
                                    <span className="ml-2 text-xs text-muted-foreground bg-muted px-1 rounded">
                                      Ref: {entry.reference}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {entry.debit > 0
                                    ? formatCurrency(entry.debit)
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {entry.credit > 0
                                    ? formatCurrency(entry.credit)
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-right font-mono font-medium">
                                  {formatCurrency(entry.balance)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-end pt-2">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          Saldo Akhir
                        </div>
                        <div className="text-xl font-bold">
                          {formatCurrency(acc.endBalance)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {!accountId
                  ? "Pilih akun untuk melihat rincian buku besar"
                  : "Tidak ada data transaksi untuk filter ini"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
