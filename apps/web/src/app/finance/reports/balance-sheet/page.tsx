"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useBalanceSheet } from "@/hooks/use-accounting";
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
import { DatePicker } from "@/components/ui/date-picker";

export default function BalanceSheetPage() {
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data: report, isLoading } = useBalanceSheet({
    endDate: endDate.toISOString(),
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Balance Sheet</h1>
          <p className="text-muted-foreground">Laporan Posisi Keuangan (Neraca)</p>
        </div>
        <div className="flex gap-4">
          <div className="w-[200px]">
            <DatePicker date={endDate} setDate={(d) => d && setEndDate(d)} />
          </div>
          <Button onClick={handlePrint} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm print:border-none print:shadow-none">
        <div className="p-6 text-center border-b print:border-none">
          <h2 className="text-xl font-bold">Balance Sheet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            As of {format(endDate, "dd MMMM yyyy")}
          </p>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !report ? (
            <div className="text-center py-12 text-muted-foreground">
              No data available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* ASSETS */}
              <div>
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Assets</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.assets.map((item) => (
                      <TableRow key={item.accountId}>
                        <TableCell>
                          <span className="font-mono text-muted-foreground mr-2">{item.code}</span>
                          {item.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.balance || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell>Total Assets</TableCell>
                      <TableCell className="text-right text-lg">
                        {formatCurrency(report.totalAssets)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* LIABILITIES & EQUITY */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">Liabilities</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.liabilities.map((item) => (
                        <TableRow key={item.accountId}>
                          <TableCell>
                            <span className="font-mono text-muted-foreground mr-2">{item.code}</span>
                            {item.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.balance || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell>Total Liabilities</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(report.totalLiabilities)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">Equity</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.equity.map((item) => (
                        <TableRow key={item.accountId}>
                          <TableCell>
                            <span className="font-mono text-muted-foreground mr-2">{item.code}</span>
                            {item.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.balance || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Net Income Row */}
                      <TableRow>
                        <TableCell className="italic">Net Income (Current Period)</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(report.netIncome)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell>Total Equity</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(report.totalEquity)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="p-4 bg-muted rounded-md flex justify-between items-center font-bold text-lg border">
                  <span>Total Liabilities & Equity</span>
                  <span>{formatCurrency(report.totalLiabilities + report.totalEquity)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
