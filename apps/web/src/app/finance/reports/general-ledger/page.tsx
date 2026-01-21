"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useJournals, useAccounts } from "@/hooks/use-accounting";
import { Loader2, Download, Search, Filter } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/shared/pagination";
import { DateRangePicker } from "@/components/ui/date-range-picker";

export default function GeneralLedgerPage() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [accountId, setAccountId] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data: accounts } = useAccounts();
  const { data: journalsData, isLoading } = useJournals({
    accountId: accountId === "all" ? undefined : accountId,
    startDate: dateRange.from?.toISOString(),
    endDate: dateRange.to?.toISOString(),
    page,
    limit: 50,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">General Ledger</h1>
          <p className="text-muted-foreground">
            View all financial transactions and journal entries.
          </p>
        </div>
        <Button onClick={handlePrint} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Print / PDF
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end bg-card p-4 rounded-lg border print:hidden">
        <div className="grid gap-1.5 flex-1 w-full md:w-auto">
          <Label>Filter by Account</Label>
          <Select
            value={accountId}
            onValueChange={(val) => {
              setAccountId(val);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts?.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Date Period</Label>
          <DateRangePicker
            date={dateRange}
            setDate={(range) => {
              if (range) setDateRange(range);
            }}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Ref</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading data...
                  </div>
                </TableCell>
              </TableRow>
            ) : !journalsData?.data || journalsData.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center h-24 text-muted-foreground"
                >
                  No transactions found for the selected criteria.
                </TableCell>
              </TableRow>
            ) : (
              journalsData.data.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {format(new Date(entry.date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{entry.account.code}</span>
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {entry.account.name}
                    </span>
                  </TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {entry.referenceType || "MANUAL"}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.debit > 0
                      ? formatCurrency(Number(entry.debit))
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.credit > 0
                      ? formatCurrency(Number(entry.credit))
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {journalsData && journalsData.meta.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={journalsData.meta.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
