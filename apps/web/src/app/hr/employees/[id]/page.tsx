'use client';

import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useEmployee,
  useDeleteEmployee,
  useLeaveRequests,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
  type EmployeeStatus,
  type LeaveStatus,
} from '@/hooks';
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Calendar,
  CreditCard,
  FileText,
  Loader2,
  AlertCircle,
  GraduationCap,
  Heart,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;
  const [activeTab, setActiveTab] = useState('info');

  const { data: employee, isLoading } = useEmployee(employeeId);
  const { data: leaveRequestsData } = useLeaveRequests({ employeeId });
  const deleteEmployee = useDeleteEmployee();

  const leaveRequests = leaveRequestsData?.data || [];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!employee) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Karyawan tidak ditemukan</p>
          <Button onClick={() => router.push('/hr')}>
            Kembali ke Daftar
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteEmployee.mutateAsync(employeeId);
      toast.success('Karyawan berhasil dihapus');
      router.push('/hr');
    } catch (error) {
      toast.error('Gagal menghapus karyawan');
    }
  };

  const getStatusBadge = (status: EmployeeStatus) => {
    const colors: Record<EmployeeStatus, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      ON_LEAVE: 'bg-yellow-100 text-yellow-800',
      RESIGNED: 'bg-red-100 text-red-800',
      RETIRED: 'bg-blue-100 text-blue-800',
    };
    return <Badge className={colors[status]}>{EMPLOYEE_STATUS_LABELS[status]}</Badge>;
  };

  const getLeaveStatusBadge = (status: LeaveStatus) => {
    const colors: Record<LeaveStatus, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return <Badge className={colors[status]}>{LEAVE_STATUS_LABELS[status]}</Badge>;
  };

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
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{employee.fullName}</h1>
                {getStatusBadge(employee.status)}
              </div>
              <p className="text-muted-foreground">
                {employee.position} • {employee.unit?.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/hr/employees/${employeeId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Karyawan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini tidak dapat dibatalkan. Semua data karyawan termasuk riwayat cuti
                    akan dihapus permanen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Profile Overview */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">NIP</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold font-mono">{employee.nip}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tipe Karyawan</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{EMPLOYEE_TYPE_LABELS[employee.employeeType]}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tanggal Bergabung</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">
                {format(new Date(employee.joinDate), 'd MMM yyyy', { locale: idLocale })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sisa Cuti</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{employee.leaveBalance ?? 12} hari</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="info">
              <User className="mr-2 h-4 w-4" />
              Informasi
            </TabsTrigger>
            <TabsTrigger value="education">
              <GraduationCap className="mr-2 h-4 w-4" />
              Pendidikan
            </TabsTrigger>
            <TabsTrigger value="leaves">
              <Calendar className="mr-2 h-4 w-4" />
              Riwayat Cuti
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="mr-2 h-4 w-4" />
              Dokumen
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Data Pribadi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Nama Lengkap</dt>
                      <dd className="font-medium">{employee.fullName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Jenis Kelamin</dt>
                      <dd>{employee.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Tempat Lahir</dt>
                      <dd>{employee.birthPlace ?? '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Tanggal Lahir</dt>
                      <dd>
                        {employee.birthDate
                          ? format(new Date(employee.birthDate), 'd MMMM yyyy', { locale: idLocale })
                          : '-'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Agama</dt>
                      <dd>{employee.religion ?? 'Islam'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Status Pernikahan</dt>
                      <dd>{employee.maritalStatus ?? '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">NIK</dt>
                      <dd className="font-mono">{employee.nik ?? '-'}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Kontak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <dd>{employee.email ?? '-'}</dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <dd>{employee.phone ?? '-'}</dd>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <dd>{employee.address ?? '-'}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Employment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Data Kepegawaian
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Unit</dt>
                      <dd className="font-medium">{employee.unit?.name ?? '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Departemen</dt>
                      <dd>{employee.department?.name ?? '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Jabatan</dt>
                      <dd>{employee.position}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Tipe</dt>
                      <dd>
                        <Badge variant="outline">{EMPLOYEE_TYPE_LABELS[employee.employeeType]}</Badge>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Tanggal Bergabung</dt>
                      <dd>
                        {format(new Date(employee.joinDate), 'd MMMM yyyy', { locale: idLocale })}
                      </dd>
                    </div>
                    {employee.resignDate && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Tanggal Resign</dt>
                        <dd className="text-red-600">
                          {format(new Date(employee.resignDate), 'd MMMM yyyy', { locale: idLocale })}
                        </dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>

              {/* Bank Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Informasi Bank
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Nama Bank</dt>
                      <dd>{employee.bankName ?? '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">No. Rekening</dt>
                      <dd className="font-mono">{employee.bankAccountNumber ?? '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Atas Nama</dt>
                      <dd>{employee.bankAccountName ?? '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">NPWP</dt>
                      <dd className="font-mono">{employee.npwp ?? '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">No. BPJS Kesehatan</dt>
                      <dd className="font-mono">{employee.bpjsKesehatan ?? '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">No. BPJS Ketenagakerjaan</dt>
                      <dd className="font-mono">{employee.bpjsKetenagakerjaan ?? '-'}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Pendidikan</CardTitle>
                <CardDescription>Informasi pendidikan terakhir karyawan</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Pendidikan Terakhir</dt>
                    <dd className="font-medium">{employee.lastEducation ?? '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Institusi</dt>
                    <dd>{employee.educationInstitution ?? '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Jurusan</dt>
                    <dd>{employee.educationMajor ?? '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Tahun Lulus</dt>
                    <dd>{employee.graduationYear ?? '-'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave History Tab */}
          <TabsContent value="leaves" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Cuti</CardTitle>
                <CardDescription>Daftar pengajuan cuti karyawan</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jenis Cuti</TableHead>
                      <TableHead>Tanggal Mulai</TableHead>
                      <TableHead>Tanggal Selesai</TableHead>
                      <TableHead>Durasi</TableHead>
                      <TableHead>Alasan</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.length ? (
                      leaveRequests.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell>{LEAVE_TYPE_LABELS[leave.leaveType]}</TableCell>
                          <TableCell>
                            {format(new Date(leave.startDate), 'd MMM yyyy', { locale: idLocale })}
                          </TableCell>
                          <TableCell>
                            {format(new Date(leave.endDate), 'd MMM yyyy', { locale: idLocale })}
                          </TableCell>
                          <TableCell>{leave.totalDays} hari</TableCell>
                          <TableCell className="max-w-[200px] truncate">{leave.reason}</TableCell>
                          <TableCell>{getLeaveStatusBadge(leave.status)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Belum ada riwayat cuti
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dokumen Karyawan</CardTitle>
                <CardDescription>Berkas dan dokumen terkait</CardDescription>
              </CardHeader>
              <CardContent>
                {employee.documents?.length ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    {employee.documents.map((doc, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">{doc.type}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada dokumen yang diunggah
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
