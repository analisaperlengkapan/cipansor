"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useTrialBalance } from "@/hooks/use-accounting";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/date-range-picker";

export default function TrialBalancePage() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  const { data: report, isLoading } = useTrialBalance({
    startDate: dateRange.from?.toISOString(),
    endDate: dateRange.to?.toISOString(),
  });

  const handlePrint = () => {
    window.print();
  };

  const totalDebit = report?.reduce((sum, item) => sum + (item.debit || 0), 0) || 0;
  const totalCredit = report?.reduce((sum, item) => sum + (item.credit || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trial Balance</h1>
          <p className="text-muted-foreground">Neraca Saldo</p>
        </div>
        <div className="flex gap-4">
          <DateRangePicker
            date={dateRange}
            setDate={(range) => {
              if (range) setDateRange(range);
            }}
          />
          <Button onClick={handlePrint} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm print:border-none print:shadow-none">
        <div className="p-6 text-center border-b print:border-none">
          <h2 className="text-xl font-bold">Trial Balance Report</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Period: {dateRange.from ? format(dateRange.from, "dd MMM yyyy") : "-"} to {dateRange.to ? format(dateRange.to, "dd MMM yyyy") : "-"}
          </p>
        </div>
        <div className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !report || report.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No data available for the selected period.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead className="text-right w-[150px]">Debit</TableHead>
                  <TableHead className="text-right w-[150px]">Credit</TableHead>
                  <TableHead className="text-right w-[150px]">Net Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.map((item) => (
                  <TableRow key={item.accountId}>
                    <TableCell className="font-mono font-medium">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.debit && item.debit > 0 ? formatCurrency(item.debit) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.credit && item.credit > 0 ? formatCurrency(item.credit) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(item.balance || 0)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50 border-t-2">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalDebit)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalCredit)}</TableCell>
                  <TableCell className="text-right"></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
