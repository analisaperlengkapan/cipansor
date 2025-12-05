'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  usePayrolls,
  usePayrollSummary,
  useGeneratePayroll,
  useProcessPayroll,
  PAYROLL_STATUS_LABELS,
  type PayrollStatus,
} from '@/hooks';
import { useUnits } from '@/hooks';
import {
  ArrowLeft,
  DollarSign,
  Users,
  Search,
  Plus,
  Eye,
  Download,
  Send,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Calculator,
  Calendar,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';

const months = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export default function PayrollPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('payrolls');
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(currentYear.toString());
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | 'ALL'>('ALL');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateMonth, setGenerateMonth] = useState((new Date().getMonth() + 1).toString());
  const [generateYear, setGenerateYear] = useState(currentYear.toString());

  const { data: payrollsData, isLoading } = usePayrolls({
    month: parseInt(month),
    year: parseInt(year),
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    unitId: unitFilter || undefined,
  });
  const { data: summary } = usePayrollSummary({
    month: parseInt(month),
    year: parseInt(year),
  });
  const { data: units } = useUnits();
  const generatePayroll = useGeneratePayroll();
  const processPayroll = useProcessPayroll();

  const payrolls = payrollsData?.data || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: PayrollStatus) => {
    const colors: Record<PayrollStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      CALCULATED: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-indigo-100 text-indigo-800',
      PROCESSED: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return <Badge className={colors[status]}>{PAYROLL_STATUS_LABELS[status]}</Badge>;
  };

  const handleGenerate = async () => {
    try {
      await generatePayroll.mutateAsync({
        month: parseInt(generateMonth),
        year: parseInt(generateYear),
      });
      toast.success('Payroll berhasil di-generate');
      setIsGenerateOpen(false);
    } catch (error) {
      toast.error('Gagal generate payroll');
    }
  };

  const handleProcessAll = async () => {
    const draftPayrolls = payrolls.filter((p) => p.status === 'DRAFT').map((p) => p.id);
    if (draftPayrolls.length === 0) {
      toast.info('Tidak ada payroll draft untuk diproses');
      return;
    }
    try {
      await processPayroll.mutateAsync(draftPayrolls);
      toast.success(`${draftPayrolls.length} payroll berhasil diproses`);
    } catch (error) {
      toast.error('Gagal memproses payroll');
    }
  };

  const filteredPayrolls = payrolls.filter((payroll) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        payroll.employee?.fullName?.toLowerCase().includes(searchLower) ||
        payroll.employee?.nip?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const draftCount = payrolls.filter((p) => p.status === 'DRAFT').length;
  const processedCount = payrolls.filter((p) => p.status === 'PROCESSED').length;
  const paidCount = payrolls.filter((p) => p.status === 'PAID').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Penggajian</h1>
              <p className="text-muted-foreground">
                Kelola gaji dan tunjangan karyawan
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {draftCount > 0 && (
              <Button variant="outline" onClick={handleProcessAll} disabled={processPayroll.isPending}>
                {processPayroll.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Proses Semua ({draftCount})
              </Button>
            )}
            <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Calculator className="mr-2 h-4 w-4" />
                  Generate Payroll
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Payroll</DialogTitle>
                  <DialogDescription>
                    Generate payroll untuk semua karyawan aktif
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bulan</label>
                      <Select value={generateMonth} onValueChange={setGenerateMonth}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tahun</label>
                      <Select value={generateYear} onValueChange={setGenerateYear}>
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
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleGenerate} disabled={generatePayroll.isPending}>
                    {generatePayroll.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Generate
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Gaji</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary?.totalGross ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {months.find((m) => m.value === month)?.label} {year}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Potongan</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary?.totalDeductions ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">Pajak & potongan lain</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Bersih</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary?.totalNet ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">Dibayarkan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Karyawan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.employeeCount ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {paidCount} sudah dibayar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/hr/payroll/periods">
              <Calendar className="mr-2 h-4 w-4" />
              Periode Penggajian
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/hr/payroll/components">
              <FileText className="mr-2 h-4 w-4" />
              Komponen Gaji
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/hr/payroll/staff-salary">
              <Users className="mr-2 h-4 w-4" />
              Konfigurasi Gaji Karyawan
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau NIP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[100px]">
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
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PayrollStatus | 'ALL')}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSED">Diproses</SelectItem>
                  <SelectItem value="PAID">Dibayar</SelectItem>
                </SelectContent>
              </Select>
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Semua Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Unit</SelectItem>
                  {units?.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIP</TableHead>
                <TableHead>Nama Karyawan</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Gaji Pokok</TableHead>
                <TableHead className="text-right">Tunjangan</TableHead>
                <TableHead className="text-right">Potongan</TableHead>
                <TableHead className="text-right">Gaji Bersih</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredPayrolls.length ? (
                filteredPayrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell className="font-mono text-sm">
                      {payroll.employee?.nip}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payroll.employee?.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {payroll.employee?.position}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{payroll.employee?.unit?.name ?? '-'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payroll.baseSalary)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      +{formatCurrency(payroll.totalAllowances)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      -{formatCurrency(payroll.totalDeductions)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(payroll.netSalary)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/hr/payroll/${payroll.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Belum ada data payroll untuk periode ini
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </MainLayout>
  );
}
