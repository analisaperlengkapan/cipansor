"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useIncomeStatement } from "@/hooks/use-accounting";
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
import { DateRangePicker } from "@/components/ui/date-range-picker";

export default function IncomeStatementPage() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const { data: report, isLoading } = useIncomeStatement({
    startDate: dateRange.from?.toISOString(),
    endDate: dateRange.to?.toISOString(),
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Income Statement
          </h1>
          <p className="text-muted-foreground">Laporan Laba Rugi</p>
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

      <div className="bg-card rounded-lg border shadow-sm print:border-none print:shadow-none max-w-4xl mx-auto">
        <div className="p-6 text-center border-b print:border-none">
          <h2 className="text-xl font-bold">Income Statement</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Period:{" "}
            {dateRange.from ? format(dateRange.from, "dd MMM yyyy") : "-"} to{" "}
            {dateRange.to ? format(dateRange.to, "dd MMM yyyy") : "-"}
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
            <div className="space-y-8">
              {/* REVENUE */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-primary">
                  Revenue
                </h3>
                <Table>
                  <TableBody>
                    {report.revenues.map((item) => (
                      <TableRow key={item.accountId} className="border-b-0">
                        <TableCell>
                          <span className="font-mono text-muted-foreground mr-2">
                            {item.code}
                          </span>
                          {item.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.balance || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/30 border-t-2">
                      <TableCell>Total Revenue</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(report.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* EXPENSES */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-red-600">
                  Expenses
                </h3>
                <Table>
                  <TableBody>
                    {report.expenses.map((item) => (
                      <TableRow key={item.accountId} className="border-b-0">
                        <TableCell>
                          <span className="font-mono text-muted-foreground mr-2">
                            {item.code}
                          </span>
                          {item.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.balance || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/30 border-t-2">
                      <TableCell>Total Expenses</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(report.totalExpense)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* NET INCOME */}
              <div className="pt-4 border-t-4 border-double">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="text-xl font-bold">Net Income</span>
                  <span
                    className={`text-xl font-bold ${report.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(report.netIncome)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
