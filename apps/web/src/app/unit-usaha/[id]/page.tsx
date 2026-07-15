"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, TrendingUp, ShoppingBag, Gauge } from "lucide-react";
import {
  useBusinessUnit,
  useBusinessUnitPerformance,
  useBusinessUnitEfficiency,
} from "@/hooks/use-business-unit";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function BusinessUnitDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: bu, isLoading } = useBusinessUnit(id);
  // The performance endpoint requires an explicit range — default to 30 days
  const [startDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { data: performance } = useBusinessUnitPerformance(id, {
    startDate,
    endDate,
  });
  const { data: efficiency } = useBusinessUnitEfficiency(id);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!bu) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <p className="text-muted-foreground">Unit usaha tidak ditemukan</p>
          <Button asChild>
            <Link href="/unit-usaha">Kembali</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/unit-usaha">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {bu.name}
              <Badge variant={bu.isActive ? "default" : "secondary"}>
                {bu.isActive ? "AKTIF" : "NONAKTIF"}
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              {bu.code} • {bu.type}
              {bu.unit ? ` • ${bu.unit.name}` : ""}
              {bu.manager ? ` • Pengelola: ${bu.manager.name}` : ""}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pendapatan (30 hari)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance ? formatCurrency(performance.revenue) : "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Transaksi (30 hari)
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance
                  ? performance.transactionCount.toLocaleString("id-ID")
                  : "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Skor Efisiensi
              </CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {efficiency ? `${efficiency.overallEfficiency}` : "—"}
              </div>
              {efficiency?.message && (
                <p className="text-xs text-muted-foreground mt-1">
                  {efficiency.message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {efficiency?.topItems && efficiency.topItems.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Item Paling Efisien</CardTitle>
                <CardDescription>
                  Perputaran stok tertinggi (turnover / stok)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ItemTable items={efficiency.topItems} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Item Kurang Efisien</CardTitle>
                <CardDescription>
                  Kandidat evaluasi stok / penawaran
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ItemTable items={efficiency.lowItems ?? []} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function ItemTable({
  items,
}: {
  items: {
    id: string;
    name: string;
    stock: number;
    turnover: number;
    efficiencyScore: number;
  }[];
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada data.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Stok</TableHead>
          <TableHead className="text-right">Terjual</TableHead>
          <TableHead className="w-[160px]">Skor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="text-right">{item.stock}</TableCell>
            <TableCell className="text-right">{item.turnover}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress
                  value={Math.min(item.efficiencyScore, 100)}
                  className="h-2 flex-1"
                />
                <span className="text-xs font-bold w-10 text-right">
                  {item.efficiencyScore}
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
