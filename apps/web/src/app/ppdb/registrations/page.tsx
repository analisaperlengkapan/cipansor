"use client";

import { useState } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useRegistrations,
  REGISTRATION_STATUSES,
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_COLORS,
} from "@/hooks/use-admissions";
import { Search, Eye, Filter } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function RegistrationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useRegistrations({
    page,
    limit,
    search: searchQuery,
    status: statusFilter === "all" ? undefined : (statusFilter as any),
  });

  const registrations = data?.data || [];
  const meta = data?.meta;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Data Pendaftar
            </h1>
            <p className="text-muted-foreground">
              Kelola data calon santri baru
            </p>
          </div>
          <Button asChild>
            <Link href="/ppdb/registrations/new">Tambah Manual</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Calon Santri</CardTitle>
            <CardDescription>
              Total {meta?.total || 0} pendaftar ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau nomor pendaftaran..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-[200px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    {REGISTRATION_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {REGISTRATION_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pendaftaran</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Tanggal Daftar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : registrations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Tidak ada data ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    registrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-mono text-xs font-medium">
                          {reg.registrationNo}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{reg.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {reg.gender === "MALE" ? "Laki-laki" : "Perempuan"}
                          </div>
                        </TableCell>
                        <TableCell>{reg.admissionPeriod?.unit?.name}</TableCell>
                        <TableCell>
                          {format(new Date(reg.createdAt), "d MMM yyyy", {
                            locale: idLocale,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${REGISTRATION_STATUS_COLORS[reg.status]} hover:bg-opacity-80`}
                          >
                            {REGISTRATION_STATUS_LABELS[reg.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/ppdb/registrations/${reg.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Detail
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls could go here */}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
