"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { format } from "date-fns";
import { useCashFlowStatement } from "@/hooks/use-finance-reports";
import { useAuthStore } from "@/stores/auth";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export default function CashFlowPage() {
  const user = useAuthStore((state) => state.user);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const { data: report, isLoading } = useCashFlowStatement(
    user?.unitId || "",
    dateRange?.from || new Date(),
    dateRange?.to || new Date(),
  );

  const handlePrint = () => {
    window.print();
  };

  const renderSection = (title: string, items: any[], total: number) => (
    <>
      <TableRow className="bg-muted/30">
        <TableCell colSpan={2} className="font-semibold pt-4 pb-2">
          {title}
        </TableCell>
      </TableRow>
      {items.length === 0 ? (
        <TableRow>
          <TableCell className="text-muted-foreground italic pl-8">
            Tidak ada aktivitas
          </TableCell>
          <TableCell className="text-right text-muted-foreground">-</TableCell>
        </TableRow>
      ) : (
        items.map((item, idx) => (
          <TableRow key={idx}>
            <TableCell className="pl-8">{item.name}</TableCell>
            <TableCell className="text-right">
              {formatCurrency(item.amount)}
            </TableCell>
          </TableRow>
        ))
      )}
      <TableRow className="font-bold border-t-2">
        <TableCell className="pl-8">Arus Kas Bersih dari {title}</TableCell>
        <TableCell className="text-right">{formatCurrency(total)}</TableCell>
      </TableRow>
    </>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <h1 className="text-2xl font-bold">Laporan Arus Kas (Cash Flow)</h1>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          <Button onClick={handlePrint} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Cetak / PDF
          </Button>
        </div>

        <Card className="print:border-none print:shadow-none">
          <CardHeader className="text-center">
            <CardTitle>Laporan Arus Kas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Periode:{" "}
              {dateRange?.from ? format(dateRange.from, "dd MMM yyyy") : "-"} -{" "}
              {dateRange?.to ? format(dateRange.to, "dd MMM yyyy") : "-"}
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
                  <TableBody>
                    {renderSection(
                      report.operatingActivities.title,
                      report.operatingActivities.items,
                      report.operatingActivities.total,
                    )}
                    {renderSection(
                      report.investingActivities.title,
                      report.investingActivities.items,
                      report.investingActivities.total,
                    )}
                    {renderSection(
                      report.financingActivities.title,
                      report.financingActivities.items,
                      report.financingActivities.total,
                    )}

                    <TableRow className="h-8 border-none">
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>

                    <TableRow className="font-bold text-lg bg-muted/50">
                      <TableCell>Kenaikan (Penurunan) Bersih Kas</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(report.netChangeInCash)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Saldo Kas Awal Periode</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(report.beginningCashBalance)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold text-lg bg-primary/5">
                      <TableCell>Saldo Kas Akhir Periode</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(report.endingCashBalance)}
                      </TableCell>
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
