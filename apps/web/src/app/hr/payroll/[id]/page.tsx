'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  usePayroll,
  useProcessPayroll,
  usePayPayroll,
  useCancelPayroll,
  PAYROLL_STATUS_LABELS,
  type PayrollStatus,
} from '@/hooks';
import {
  ArrowLeft,
  Download,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Printer,
  User,
  Building,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { useState } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PayrollDetailPage({ params }: PageProps) {
  const { id: payrollId } = use(params);
  const router = useRouter();
  const [isProcessOpen, setIsProcessOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const { data: payroll, isLoading } = usePayroll(payrollId);
  const processPayroll = useProcessPayroll();
  const payPayroll = usePayPayroll();
  const cancelPayroll = useCancelPayroll();

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

  const handleProcess = async () => {
    try {
      await processPayroll.mutateAsync([payrollId]);
      toast.success('Payroll berhasil diproses');
      setIsProcessOpen(false);
    } catch (error) {
      toast.error('Gagal memproses payroll');
    }
  };

  const handlePay = async () => {
    try {
      await payPayroll.mutateAsync([payrollId]);
      toast.success('Payroll berhasil dibayar');
      setIsPayOpen(false);
    } catch (error) {
      toast.error('Gagal membayar payroll');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelPayroll.mutateAsync(payrollId);
      toast.success('Payroll berhasil dibatalkan');
      setIsCancelOpen(false);
    } catch (error) {
      toast.error('Gagal membatalkan payroll');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!payroll) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-lg font-medium">Payroll tidak ditemukan</h2>
          <Button className="mt-4" onClick={() => router.back()}>
            Kembali
          </Button>
        </div>
      </MainLayout>
    );
  }

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const periodLabel = `${months[payroll.month - 1]} ${payroll.year}`;

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
              <h1 className="text-3xl font-bold tracking-tight">Detail Slip Gaji</h1>
              <p className="text-muted-foreground">Periode {periodLabel}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {payroll.status === 'DRAFT' && (
              <>
                <Dialog open={isProcessOpen} onOpenChange={setIsProcessOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Send className="mr-2 h-4 w-4" />
                      Proses
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Proses Payroll</DialogTitle>
                      <DialogDescription>
                        Apakah Anda yakin ingin memproses payroll ini? Status akan berubah menjadi &quot;Diproses&quot;.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsProcessOpen(false)}>
                        Batal
                      </Button>
                      <Button onClick={handleProcess} disabled={processPayroll.isPending}>
                        {processPayroll.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Proses
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <XCircle className="mr-2 h-4 w-4" />
                      Batalkan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Batalkan Payroll</DialogTitle>
                      <DialogDescription>
                        Apakah Anda yakin ingin membatalkan payroll ini? Tindakan ini tidak dapat dibatalkan.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
                        Tidak
                      </Button>
                      <Button variant="destructive" onClick={handleCancel} disabled={cancelPayroll.isPending}>
                        {cancelPayroll.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Ya, Batalkan
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
            {payroll.status === 'PROCESSED' && (
              <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Bayar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bayar Gaji</DialogTitle>
                    <DialogDescription>
                      Apakah Anda yakin ingin menandai payroll ini sebagai sudah dibayar?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span>Karyawan</span>
                        <span className="font-medium">{payroll.employee?.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Jumlah</span>
                        <span className="font-bold text-green-600">{formatCurrency(payroll.netSalary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rekening</span>
                        <span className="font-mono">{payroll.employee?.bankAccount ?? '-'}</span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPayOpen(false)}>
                      Batal
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handlePay} disabled={payPayroll.isPending}>
                      {payPayroll.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Konfirmasi Bayar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Cetak
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Employee Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Karyawan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{payroll.employee?.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{payroll.employee?.nip}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Posisi</span>
                  <span>{payroll.employee?.position}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unit</span>
                  <span>{payroll.employee?.unit?.name ?? '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Departemen</span>
                  <span>{payroll.employee?.department?.name ?? '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status Karyawan</span>
                  <span>{payroll.employee?.employeeType}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Summary */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Ringkasan Gaji
                  </CardTitle>
                  <CardDescription>Periode {periodLabel}</CardDescription>
                </div>
                {getStatusBadge(payroll.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Gaji Pokok</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(payroll.baseSalary)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Tunjangan</p>
                  <p className="text-xl font-bold text-green-600">
                    +{formatCurrency(payroll.totalAllowances)}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Potongan</p>
                  <p className="text-xl font-bold text-red-600">
                    -{formatCurrency(payroll.totalDeductions)}
                  </p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Gaji Bersih</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(payroll.netSalary)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Allowances */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">Tunjangan</CardTitle>
              <CardDescription>Daftar tunjangan yang diterima</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Komponen</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payroll.allowances?.length ? (
                    payroll.allowances.map((allowance, index) => (
                      <TableRow key={index}>
                        <TableCell>{allowance.name}</TableCell>
                        <TableCell className="text-right text-green-600">
                          +{formatCurrency(allowance.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        Tidak ada tunjangan
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="bg-green-50">
                    <TableCell className="font-semibold">Total Tunjangan</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      +{formatCurrency(payroll.totalAllowances)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Deductions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-700">Potongan</CardTitle>
              <CardDescription>Daftar potongan gaji</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Komponen</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payroll.deductions?.length ? (
                    payroll.deductions.map((deduction, index) => (
                      <TableRow key={index}>
                        <TableCell>{deduction.name}</TableCell>
                        <TableCell className="text-right text-red-600">
                          -{formatCurrency(deduction.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        Tidak ada potongan
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="bg-red-50">
                    <TableCell className="font-semibold">Total Potongan</TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      -{formatCurrency(payroll.totalDeductions)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Payment Info */}
        {payroll.status === 'PAID' && payroll.paidAt && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                Informasi Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Pembayaran</p>
                  <p className="font-medium">
                    {format(new Date(payroll.paidAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bank Tujuan</p>
                  <p className="font-medium">{payroll.employee?.bankName ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Rekening</p>
                  <p className="font-mono">{payroll.employee?.bankAccount ?? '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
