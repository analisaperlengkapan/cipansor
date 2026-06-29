"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUnits } from "@/hooks/use-units";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Printer, Download, Filter, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function CashFlowPage() {
  const [unitId, setUnitId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );

  const { data: units } = useUnits();

  const { data: report, isLoading } = useQuery({
    queryKey: ["cash-flow", unitId, startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get("/finance/accounting/reports/cash-flow", {
        params: { unitId, startDate, endDate },
      });
      return data.data;
    },
    enabled: !!startDate && !!endDate,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan Arus Kas</h1>
          <p className="text-muted-foreground">
            Laporan mutasi kas masuk dan keluar berdasarkan kategori aktivitas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Cetak
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit</SelectItem>
                  {units?.map((unit: any) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
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
              <Label>Tanggal Selesai</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Arus Kas Bersih</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${report.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(report.netCashFlow)}
                </div>
                <p className="text-xs text-muted-foreground">Total mutasi kas periode ini</p>
              </CardContent>
            </Card>
            {Object.entries(report.categories).map(([key, cat]: [string, any]) => (
              <Card key={key}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{cat.name}</CardTitle>
                  {cat.total >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className={`text-xl font-bold ${cat.total >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(cat.total)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-8">
            {Object.entries(report.categories).map(([key, cat]: [string, any]) => (
              <Card key={key} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <CardTitle>{cat.name}</CardTitle>
                  <CardDescription>Detail rincian transaksi {cat.name.toLowerCase()}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Tanggal</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead>Akun</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cat.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            Tidak ada transaksi dalam kategori ini
                          </TableCell>
                        </TableRow>
                      ) : (
                        cat.items.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm">
                              {format(new Date(item.date), "dd MMM yyyy", { locale: id })}
                            </TableCell>
                            <TableCell className="max-w-md truncate font-medium">
                              {item.description}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {item.accountCode} - {item.accountName}
                            </TableCell>
                            <TableCell className={`text-right font-mono ${item.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      <TableRow className="bg-muted/30 font-bold">
                        <TableCell colSpan={3}>Subtotal {cat.name}</TableCell>
                        <TableCell className={`text-right font-mono ${cat.total >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(cat.total)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-between items-center p-4 bg-primary text-primary-foreground rounded-lg shadow-lg">
              <span className="text-lg font-bold">KENAIKAN/PENURUNAN BERSIH KAS</span>
              <span className="text-2xl font-mono font-bold">
                {formatCurrency(report.netCashFlow)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center space-y-2">
            <DollarSign className="h-12 w-12 text-muted-foreground/20" />
            <p className="text-muted-foreground">Pilih unit dan periode untuk menampilkan laporan</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
