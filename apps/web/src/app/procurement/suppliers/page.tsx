"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSuppliers, useSupplierMutation } from "@/hooks/use-suppliers";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const { data: suppliers, isLoading } = useSuppliers({
    search,
    isActive: true,
  });
  const { remove } = useSupplierMutation();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data Supplier</h1>
            <p className="text-muted-foreground">
              Kelola data pemasok barang dan jasa.
            </p>
          </div>
          <Button asChild>
            <Link href="/procurement/suppliers/create">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Supplier
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, kontak..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Email/Telepon</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : !suppliers?.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        {supplier.name}
                      </TableCell>
                      <TableCell>
                        {supplier.category ? (
                          <Badge variant="outline">{supplier.category}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{supplier.contactPerson || "-"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{supplier.email || "-"}</div>
                          <div className="text-muted-foreground">
                            {supplier.phone || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.rating ? `⭐ ${supplier.rating}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              href={`/procurement/suppliers/${supplier.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Hapus Supplier?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Data supplier akan dinonaktifkan (soft
                                  delete).
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => remove.mutate(supplier.id)}
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
