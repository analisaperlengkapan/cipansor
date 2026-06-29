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
  Plus,
  ShoppingBag,
  WashingMachine,
  Store,
  Utensils,
  BookOpen,
  TrendingUp,
  Settings,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useBusinessUnits } from "@/hooks/use-business-unit";

const TYPE_ICONS: Record<string, any> = {
  CANTEEN: Utensils,
  LAUNDRY: WashingMachine,
  COOPERATIVE: Store,
  BOOKSTORE: BookOpen,
  OTHER: ShoppingBag,
};

export default function BusinessUnitPage() {
  const { data: businessUnits, isLoading } = useBusinessUnits();

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Unit Usaha</h1>
            <p className="text-muted-foreground">
              Manajemen unit bisnis dan layanan komersial yayasan
            </p>
          </div>
          <Button className="gap-2">
            <Plus size={16} /> Tambah Unit Usaha
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Unit Aktif</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : businessUnits?.filter(bu => bu.isActive).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monitoring Unit</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Pantau performa real-time seluruh unit bisnis yayasan.
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transaksi (Historis)</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : businessUnits?.reduce((acc, bu) => acc + (bu._count?.canteenTransactions || 0) + (bu._count?.laundryTransactions || 0), 0).toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Unit Usaha</CardTitle>
            <CardDescription>Seluruh unit usaha yang terdaftar di bawah Yayasan</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Unit</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Items/Layanan</TableHead>
                  <TableHead className="text-right">Transaksi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Memuat data...</TableCell></TableRow>
                ) : businessUnits?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada unit usaha.</TableCell></TableRow>
                ) : businessUnits?.map((bu) => {
                  const Icon = TYPE_ICONS[bu.type] || ShoppingBag;
                  const totalTx = (bu._count?.canteenTransactions || 0) + (bu._count?.laundryTransactions || 0);
                  return (
                    <TableRow key={bu.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="font-medium">{bu.name}</p>
                            <p className="text-xs text-muted-foreground">{bu.code}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {bu.type.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{bu._count?.canteenItems || bu._count?.laundryPricings || 0}</TableCell>
                      <TableCell className="text-right font-mono">
                        {totalTx.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={bu.isActive ? "default" : "secondary"}>
                          {bu.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="icon" asChild>
                              <Link href={`/unit-usaha/${bu.id}`}>
                                <ArrowRight size={16} />
                              </Link>
                           </Button>
                           <Button variant="ghost" size="icon">
                              <Settings size={16} />
                           </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
