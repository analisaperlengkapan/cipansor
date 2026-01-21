"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  usePayrollPeriods,
  useCreatePayrollPeriod,
  useClosePayrollPeriod,
  usePayrollPeriodSummary,
  type PayrollPeriod,
  type PayrollPeriodStatus,
  PAYROLL_PERIOD_STATUS_LABELS,
} from "@/hooks";
import { useUnits } from "@/hooks";
import {
  ArrowLeft,
  Plus,
  Search,
  Loader2,
  Calendar,
  Eye,
  Lock,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { toast } from "sonner";

const months = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export default function PayrollPeriodsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState(currentYear.toString());
  const [statusFilter, setStatusFilter] = useState<PayrollPeriodStatus | "ALL">(
    "ALL",
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [closingPeriod, setClosingPeriod] = useState<PayrollPeriod | null>(
    null,
  );

  // Form state
  const [formMonth, setFormMonth] = useState(
    (new Date().getMonth() + 1).toString(),
  );
  const [formYear, setFormYear] = useState(currentYear.toString());

  const { data: periodsData, isLoading } = usePayrollPeriods({
    year: parseInt(yearFilter),
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  });
  const { data: units } = useUnits();
  const createPeriod = useCreatePayrollPeriod();
  const closePeriod = useClosePayrollPeriod();

  const periods = periodsData?.data || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: PayrollPeriodStatus) => {
    const colors: Record<PayrollPeriodStatus, string> = {
      OPEN: "bg-green-100 text-green-800",
      PROCESSING: "bg-yellow-100 text-yellow-800",
      CLOSED: "bg-gray-100 text-gray-800",
    };
    const icons: Record<PayrollPeriodStatus, React.ReactNode> = {
      OPEN: <Clock className="h-3 w-3 mr-1" />,
      PROCESSING: <AlertCircle className="h-3 w-3 mr-1" />,
      CLOSED: <Lock className="h-3 w-3 mr-1" />,
    };
    return (
      <Badge className={`${colors[status]} flex items-center`}>
        {icons[status]}
        {PAYROLL_PERIOD_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const handleCreate = async () => {
    const month = parseInt(formMonth);
    const year = parseInt(formYear);
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));
    const monthName = months.find((m) => m.value === month)?.label || "";

    try {
      await createPeriod.mutateAsync({
        name: `Periode Gaji ${monthName} ${year}`,
        month,
        year,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      toast.success("Periode penggajian berhasil dibuat");
      setIsFormOpen(false);
    } catch (error) {
      toast.error("Gagal membuat periode penggajian");
    }
  };

  const handleClose = async () => {
    if (!closingPeriod) return;

    try {
      await closePeriod.mutateAsync(closingPeriod.id);
      toast.success("Periode penggajian berhasil ditutup");
      setIsCloseOpen(false);
      setClosingPeriod(null);
    } catch (error) {
      toast.error("Gagal menutup periode penggajian");
    }
  };

  const filteredPeriods = periods.filter((period) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return period.name.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const openPeriods = filteredPeriods.filter((p) => p.status === "OPEN").length;
  const closedPeriods = filteredPeriods.filter(
    (p) => p.status === "CLOSED",
  ).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/hr/payroll")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Periode Penggajian
              </h1>
              <p className="text-muted-foreground">
                Kelola periode penggajian bulanan
              </p>
            </div>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Buat Periode
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Periode Penggajian</DialogTitle>
                <DialogDescription>
                  Buat periode penggajian baru untuk bulan tertentu
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bulan</Label>
                    <Select value={formMonth} onValueChange={setFormMonth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m.value} value={m.value.toString()}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tahun</Label>
                    <Select value={formYear} onValueChange={setFormYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Nama Periode:</strong> Periode Gaji{" "}
                    {
                      months.find((m) => m.value.toString() === formMonth)
                        ?.label
                    }{" "}
                    {formYear}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tanggal: 1 -{" "}
                    {endOfMonth(
                      new Date(parseInt(formYear), parseInt(formMonth) - 1),
                    ).getDate()}{" "}
                    {
                      months.find((m) => m.value.toString() === formMonth)
                        ?.label
                    }{" "}
                    {formYear}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Batal
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createPeriod.isPending}
                >
                  {createPeriod.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Buat Periode
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Periode
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredPeriods.length}</div>
              <p className="text-xs text-muted-foreground">
                di tahun {yearFilter}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Periode Aktif
              </CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {openPeriods}
              </div>
              <p className="text-xs text-muted-foreground">masih terbuka</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Periode Selesai
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{closedPeriods}</div>
              <p className="text-xs text-muted-foreground">sudah ditutup</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari periode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as PayrollPeriodStatus | "ALL")
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="OPEN">Terbuka</SelectItem>
                  <SelectItem value="PROCESSING">Diproses</SelectItem>
                  <SelectItem value="CLOSED">Ditutup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead>Bulan/Tahun</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-center">Payroll</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ditutup</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredPeriods.length ? (
                filteredPeriods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">{period.name}</TableCell>
                    <TableCell>
                      {months.find((m) => m.value === period.month)?.label}{" "}
                      {period.year}
                    </TableCell>
                    <TableCell>
                      {format(new Date(period.startDate), "d MMM", {
                        locale: id,
                      })}{" "}
                      -{" "}
                      {format(new Date(period.endDate), "d MMM yyyy", {
                        locale: id,
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {period._count?.payrolls || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(period.status)}</TableCell>
                    <TableCell>
                      {period.closedAt
                        ? format(new Date(period.closedAt), "d MMM yyyy", {
                            locale: id,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/hr/payroll/periods/${period.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {period.status === "OPEN" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setClosingPeriod(period);
                              setIsCloseOpen(true);
                            }}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Belum ada periode penggajian untuk tahun ini
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Close Period Dialog */}
        <Dialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tutup Periode Penggajian</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menutup periode &quot;
                {closingPeriod?.name}&quot;? Setelah ditutup, payroll tidak
                dapat diubah.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Pastikan semua payroll sudah dibayar sebelum menutup periode.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCloseOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleClose} disabled={closePeriod.isPending}>
                {closePeriod.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Tutup Periode
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
