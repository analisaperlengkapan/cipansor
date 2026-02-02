"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useStatementOfFinancialPositionReport } from "@/hooks/use-finance-enhancement";
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
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function StatementOfFinancialPositionPage() {
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data: report, isLoading } = useStatementOfFinancialPositionReport({
    date: endDate.toISOString(),
  });

  const handlePrint = () => {
    window.print();
  };

  const renderSection = (title: string, items: any[], total: number) => (
    <div className="space-y-4">
        <div className="flex justify-between items-center border-b-2 border-primary/20 pb-2">
            <h3 className="text-lg font-bold text-primary">{title}</h3>
            <span className="font-bold">{formatCurrency(total)}</span>
        </div>
        <Table>
            <TableBody>
                {items.map((item) => (
                    <RecursiveRow key={item.code} item={item} />
                ))}
            </TableBody>
        </Table>
    </div>
  );

  const RecursiveRow = ({ item, level = 0 }: { item: any, level?: number }) => (
      <>
        <TableRow className={`border-b border-muted/50 ${level === 0 ? "font-medium" : ""}`}>
            <TableCell style={{ paddingLeft: `${level * 24 + 12}px` }}>
                <span className="font-mono text-muted-foreground mr-2 text-xs">{item.code}</span>
                {item.name}
            </TableCell>
            <TableCell className="text-right">
                {formatCurrency(item.amount)}
            </TableCell>
        </TableRow>
        {item.children?.map((child: any) => (
            <RecursiveRow key={child.code} item={child} level={level + 1} />
        ))}
      </>
  );

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
              Laporan Posisi Keuangan
            </h1>
          </div>
          <p className="text-muted-foreground ml-10">
            Statement of Financial Position (ISAK 35)
          </p>
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

      <Card className="print:border-none print:shadow-none">
        <CardContent className="p-6">
          <div className="text-center border-b pb-6 mb-6 print:border-none">
            <h2 className="text-2xl font-bold uppercase">Laporan Posisi Keuangan</h2>
            <p className="text-muted-foreground mt-2">
              Per Tanggal {format(endDate, "dd MMMM yyyy")}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* ASSETS */}
              <div>
                {renderSection(report.assets.title, report.assets.items, report.assets.total)}

                <div className="mt-8 p-4 bg-muted/30 rounded-lg flex justify-between items-center font-bold text-lg border border-primary/20">
                    <span>Total Aset</span>
                    <span>{formatCurrency(report.assets.total)}</span>
                </div>
              </div>

              {/* LIABILITIES & NET ASSETS */}
              <div className="space-y-8">
                {renderSection(report.liabilities.title, report.liabilities.items, report.liabilities.total)}

                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b-2 border-primary/20 pb-2">
                        <h3 className="text-lg font-bold text-primary">Aset Neto (Net Assets)</h3>
                        <span className="font-bold">{formatCurrency(report.netAssets.total)}</span>
                    </div>

                    <div className="space-y-6 pl-2">
                        {/* Unrestricted */}
                        <div>
                            <div className="font-semibold mb-2 flex justify-between bg-muted/20 p-2 rounded">
                                <span>Tanpa Pembatasan</span>
                                <span>{formatCurrency(report.netAssets.unrestricted.total)}</span>
                            </div>
                            <Table>
                                <TableBody>
                                    {report.netAssets.unrestricted.items.map(item => (
                                        <TableRow key={item.code} className="border-b border-muted/30">
                                            <TableCell className="py-2 pl-4 text-sm">
                                                {item.name}
                                            </TableCell>
                                            <TableCell className="py-2 text-right text-sm">
                                                {formatCurrency(item.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Restricted */}
                        <div>
                            <div className="font-semibold mb-2 flex justify-between bg-muted/20 p-2 rounded">
                                <span>Dengan Pembatasan</span>
                                <span>{formatCurrency(report.netAssets.restricted.total)}</span>
                            </div>
                            <Table>
                                <TableBody>
                                    {report.netAssets.restricted.items.map(item => (
                                        <TableRow key={item.code} className="border-b border-muted/30">
                                            <TableCell className="py-2 pl-4 text-sm">
                                                {item.name}
                                            </TableCell>
                                            <TableCell className="py-2 text-right text-sm">
                                                {formatCurrency(item.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-muted/30 rounded-lg flex justify-between items-center font-bold text-lg border border-primary/20">
                    <span>Total Liabilitas & Aset Neto</span>
                    <span>{formatCurrency(report.liabilities.total + report.netAssets.total)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
