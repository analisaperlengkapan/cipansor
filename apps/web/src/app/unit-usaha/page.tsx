"use client";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  ShoppingBag,
  WashingMachine,
  Store,
  Utensils,
  BookOpen,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { useBusinessUnits } from "@/hooks/use-business-unit";

const TYPE_ICONS: Record<string, LucideIcon> = {
  CANTEEN: Utensils,
  LAUNDRY: WashingMachine,
  COOPERATIVE: Store,
  BOOKSTORE: BookOpen,
  OTHER: ShoppingBag,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function BusinessUnitPage() {
  const { data: businessUnits = [], isLoading } = useBusinessUnits();

  const activeCount = businessUnits.filter((bu) => bu.isActive).length;
  const totalRevenue = businessUnits.reduce(
    (sum, bu) => sum + bu.monthlyRevenue,
    0,
  );
  const totalTransactions = businessUnits.reduce(
    (sum, bu) => sum + bu.monthlyTransactions,
    0,
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unit Usaha</h1>
          <p className="text-muted-foreground">
            Manajemen unit bisnis dan layanan komersial yayasan
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Unit Aktif
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Pendapatan (Bulan Ini)
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(totalRevenue)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Transaksi (Bulan Ini)
                  </CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalTransactions.toLocaleString("id-ID")}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Daftar Unit Usaha</CardTitle>
                <CardDescription>
                  Seluruh unit usaha yang terdaftar di bawah Yayasan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {businessUnits.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Belum ada unit usaha terdaftar. Unit usaha dibuat melalui
                    modul Kantin/Laundry masing-masing unit.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Unit</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Pengelola</TableHead>
                        <TableHead className="text-right">
                          Pendapatan Bulan Ini
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {businessUnits.map((bu) => {
                        const Icon = TYPE_ICONS[bu.type] || ShoppingBag;
                        return (
                          <TableRow key={bu.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                  <Icon size={18} />
                                </div>
                                <div>
                                  <p className="font-medium">{bu.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {bu.code}
                                    {bu.unit ? ` • ${bu.unit.name}` : ""}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {bu.type.toLowerCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>{bu.manager?.name || "—"}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(bu.monthlyRevenue)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={bu.isActive ? "default" : "secondary"}
                              >
                                {bu.isActive ? "AKTIF" : "NONAKTIF"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/unit-usaha/${bu.id}`}>
                                  <ArrowRight size={16} />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
