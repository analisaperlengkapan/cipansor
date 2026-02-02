"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useStatementOfActivitiesReport } from "@/hooks/use-finance-enhancement";
import { Loader2, Download, ArrowLeft } from "lucide-react";
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
import { DateRangePicker } from "@/components/ui/date-range-picker";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function StatementOfActivitiesPage() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });

  const { data: report, isLoading } = useStatementOfActivitiesReport({
    startDate: dateRange.from?.toISOString() || "",
    endDate: dateRange.to?.toISOString() || "",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/finance/reports">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">
              Laporan Aktivitas
            </h1>
          </div>
          <p className="text-muted-foreground ml-10">
            Statement of Activities (ISAK 35)
          </p>
        </div>
        <div className="flex gap-4">
          <DateRangePicker
            date={dateRange as any}
            setDate={(range) => {
              if (range) setDateRange(range as any);
            }}
          />
          <Button onClick={handlePrint} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
        </div>
      </div>

      <Card className="print:border-none print:shadow-none">
        <CardContent className="p-6">
          <div className="text-center border-b pb-6 mb-6 print:border-none">
            <h2 className="text-2xl font-bold uppercase">Laporan Aktivitas</h2>
            <p className="text-muted-foreground mt-2">
              Periode:{" "}
              {dateRange.from ? format(dateRange.from, "dd MMM yyyy") : "-"}{" "}
              s/d {dateRange.to ? format(dateRange.to, "dd MMM yyyy") : "-"}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !report ? (
            <div className="text-center py-12 text-muted-foreground">
              Tidak ada data tersedia.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[40%]">Uraian</TableHead>
                    <TableHead className="text-right">Tanpa Pembatasan</TableHead>
                    <TableHead className="text-right">Dengan Pembatasan</TableHead>
                    <TableHead className="text-right font-bold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* PENDAPATAN */}
                  <TableRow className="bg-muted/20 font-semibold">
                    <TableCell colSpan={4}>PENDAPATAN (REVENUES)</TableCell>
                  </TableRow>

                  {/* Combine items from both or list them distinct?
                      Usually we list categories. Here we iterate all found accounts.
                      Ideally we merge by account name if code is same, but code is unique.
                      We will list Unrestricted items first, then Restricted items, or mix?
                      Since the breakdown is column based, we need rows.
                      But our data structure separates them.

                      Let's list all unique account codes involved.
                  */}
                  {[...report.revenues.unrestricted.items, ...report.revenues.restricted.items]
                    // De-duplicate by code if necessary (though current logic splits them by code so duplication implies same code in both lists? No, code is unique account)
                    // If an account is 'Unrestricted', it's in unrestricted list.
                    // So we can just map them.
                    .sort((a, b) => a.code.localeCompare(b.code))
                    .map((item, idx) => {
                       // Find which bucket it belongs to (it's only in one based on service logic)
                       const isUnrestricted = report.revenues.unrestricted.items.find(i => i.code === item.code);
                       const isRestricted = report.revenues.restricted.items.find(i => i.code === item.code);

                       const unresAmount = isUnrestricted ? item.amount : 0;
                       const resAmount = isRestricted ? item.amount : 0;

                       return (
                        <TableRow key={item.code} className="border-b">
                          <TableCell>
                            <span className="font-mono text-muted-foreground mr-2 text-xs">
                              {item.code}
                            </span>
                            {item.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {unresAmount !== 0 ? formatCurrency(unresAmount) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {resAmount !== 0 ? formatCurrency(resAmount) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(unresAmount + resAmount)}
                          </TableCell>
                        </TableRow>
                       );
                    })}

                  <TableRow className="font-bold bg-muted/30 border-t-2">
                    <TableCell>Total Pendapatan</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(report.revenues.unrestricted.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(report.revenues.restricted.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(report.revenues.total)}
                    </TableCell>
                  </TableRow>

                  {/* BEBAN */}
                  <TableRow className="h-8"></TableRow>
                  <TableRow className="bg-muted/20 font-semibold">
                    <TableCell colSpan={4}>BEBAN (EXPENSES)</TableCell>
                  </TableRow>

                  {[...report.expenses.unrestricted.items, ...report.expenses.restricted.items]
                    .sort((a, b) => a.code.localeCompare(b.code))
                    .map((item, idx) => {
                       const isUnrestricted = report.expenses.unrestricted.items.find(i => i.code === item.code);
                       const isRestricted = report.expenses.restricted.items.find(i => i.code === item.code);

                       const unresAmount = isUnrestricted ? item.amount : 0;
                       const resAmount = isRestricted ? item.amount : 0;

                       return (
                        <TableRow key={item.code} className="border-b">
                          <TableCell>
                            <span className="font-mono text-muted-foreground mr-2 text-xs">
                              {item.code}
                            </span>
                            {item.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {unresAmount !== 0 ? formatCurrency(unresAmount) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {resAmount !== 0 ? formatCurrency(resAmount) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(unresAmount + resAmount)}
                          </TableCell>
                        </TableRow>
                       );
                    })}

                  <TableRow className="font-bold bg-muted/30 border-t-2">
                    <TableCell>Total Beban</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(report.expenses.unrestricted.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(report.expenses.restricted.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(report.expenses.total)}
                    </TableCell>
                  </TableRow>

                  {/* PERUBAHAN ASET NETO */}
                  <TableRow className="h-8"></TableRow>
                  <TableRow className="font-bold bg-primary/10 border-t-2 border-primary text-lg">
                    <TableCell>Perubahan Aset Neto</TableCell>
                    <TableCell className={`text-right ${report.changeInNetAssets.unrestricted < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(report.changeInNetAssets.unrestricted)}
                    </TableCell>
                    <TableCell className={`text-right ${report.changeInNetAssets.restricted < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(report.changeInNetAssets.restricted)}
                    </TableCell>
                    <TableCell className={`text-right ${report.changeInNetAssets.total < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(report.changeInNetAssets.total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
