"use client";

import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Package,
  ShoppingCart,
  TrendingUp,
  User,
  Activity,
  History,
} from "lucide-react";
import { useBusinessUnit, useBusinessUnitPerformance } from "@/hooks/use-business-unit";
import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function BusinessUnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const buId = params.id as string;

  const [dateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    end: new Date().toISOString(),
  });

  const { data: bu, isLoading } = useBusinessUnit(buId);
  const { data: performance, isLoading: loadingPerf } = useBusinessUnitPerformance(
    buId,
    dateRange.start,
    dateRange.end
  );

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/4" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!bu) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{bu.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{bu.code}</Badge>
              <Badge variant="secondary">{bu.type}</Badge>
              <Badge className={bu.isActive ? "bg-emerald-100 text-emerald-700" : ""}>
                {bu.isActive ? "AKTIF" : "NONAKTIF"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendapatan (Bulan Ini)</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingPerf ? "..." : formatCurrency(performance?.revenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Periode: {format(new Date(dateRange.start), "MMM yyyy", { locale: id })}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
              <ShoppingCart className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingPerf ? "..." : performance?.transactionCount || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Transaksi sukses</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Item/Aset</CardTitle>
              <Package className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bu._count?.canteenItems || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Item aktif terdaftar</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                Informasi Pengelola
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Manager</span>
                <span className="text-sm font-medium">{bu.managerId ? "Terhubung" : "Belum Ditentukan"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Unit Induk</span>
                <span className="text-sm font-medium">{bu.unit?.name || "Yayasan"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Status Operasional</span>
                <Badge variant={bu.isActive ? "default" : "secondary"}>
                   {bu.isActive ? "Beroperasi" : "Tutup Sementara"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                Efisiensi Operasional
              </CardTitle>
              <CardDescription>Indikator performa unit bisnis</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
               <div className="text-center">
                  <p className="text-4xl font-black text-slate-900 mb-1">A+</p>
                  <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Operational Grade</p>
               </div>
               <div className="w-full mt-6 space-y-3">
                  <div className="flex justify-between text-xs">
                     <span>Stock Turnover</span>
                     <span className="font-bold">85%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-500" style={{ width: '85%' }}></div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
