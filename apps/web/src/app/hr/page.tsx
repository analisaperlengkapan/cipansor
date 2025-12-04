'use client';

import { useState } from 'react';
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
  useEmployees,
  useLeaveRequests,
  useDepartments,
  EMPLOYEE_STATUSES,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
  type EmployeeStatus,
  type LeaveStatus,
} from '@/hooks';
import { useUnits } from '@/hooks';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Calendar,
  DollarSign,
  Building2,
  UserCheck,
  UserX,
  Clock,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';

export default function HRPage() {
  const [activeTab, setActiveTab] = useState('employees');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'ALL'>('ALL');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<LeaveStatus | 'ALL'>('ALL');

  const { data: employeesData, isLoading: loadingEmployees } = useEmployees({
    search: search || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    unitId: unitFilter || undefined,
  });
  const { data: leaveRequestsData, isLoading: loadingLeaves } = useLeaveRequests({
    status: leaveStatusFilter !== 'ALL' ? leaveStatusFilter : undefined,
  });
  const { data: departments } = useDepartments();
  const { data: units } = useUnits();

  const employees = employeesData?.data || [];
  const leaveRequests = leaveRequestsData?.data || [];

  const activeEmployees = employees.filter(e => e.status === 'ACTIVE').length;
  const onLeaveEmployees = employees.filter(e => e.status === 'ON_LEAVE').length;
  const pendingLeaves = leaveRequests.filter(l => l.status === 'PENDING').length;

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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SDM & Kepegawaian</h1>
            <p className="text-muted-foreground">
              Kelola data karyawan, cuti, dan penggajian
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/hr/departments">
                <Building2 className="mr-2 h-4 w-4" />
                Departemen
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/hr/payroll">
                <DollarSign className="mr-2 h-4 w-4" />
                Penggajian
              </Link>
            </Button>
            <Button asChild>
              <Link href="/hr/employees/new">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Karyawan
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Karyawan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
              <p className="text-xs text-muted-foreground">
                {departments?.length ?? 0} departemen
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Karyawan Aktif</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeEmployees}</div>
              <p className="text-xs text-muted-foreground">Bekerja saat ini</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sedang Cuti</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{onLeaveEmployees}</div>
              <p className="text-xs text-muted-foreground">Karyawan cuti</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pengajuan Cuti</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{pendingLeaves}</div>
              <p className="text-xs text-muted-foreground">Menunggu persetujuan</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="employees">
              <Users className="mr-2 h-4 w-4" />
              Karyawan
            </TabsTrigger>
            <TabsTrigger value="leaves">
              <Calendar className="mr-2 h-4 w-4" />
              Cuti
            </TabsTrigger>
          </TabsList>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-4">
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
                  <Select value={unitFilter} onValueChange={setUnitFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
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
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as EmployeeStatus | 'ALL')}
                  >
                    <SelectTrigger className="w-full md:w-[150px]">
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Status</SelectItem>
                      {EMPLOYEE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {EMPLOYEE_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIP</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingEmployees ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : employees.length ? (
                    employees.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-mono text-sm">{emp.nip}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{emp.fullName}</p>
                            <p className="text-sm text-muted-foreground">{emp.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{emp.unit?.name ?? '-'}</TableCell>
                        <TableCell>{emp.position}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {EMPLOYEE_TYPE_LABELS[emp.employeeType]}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(emp.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/hr/employees/${emp.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/hr/employees/${emp.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Belum ada data karyawan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Leave Requests Tab */}
          <TabsContent value="leaves" className="space-y-4">
            <div className="flex justify-between items-center">
              <Select
                value={leaveStatusFilter}
                onValueChange={(v) => setLeaveStatusFilter(v as LeaveStatus | 'ALL')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                  <SelectItem value="APPROVED">Disetujui</SelectItem>
                  <SelectItem value="REJECTED">Ditolak</SelectItem>
                </SelectContent>
              </Select>
              <Button asChild>
                <Link href="/hr/leaves/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajukan Cuti
                </Link>
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Jenis Cuti</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLeaves ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : leaveRequests.length ? (
                    leaveRequests.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{leave.employee?.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              {leave.employee?.position}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{LEAVE_TYPE_LABELS[leave.leaveType]}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{format(new Date(leave.startDate), 'd MMM', { locale: id })}</p>
                            <p className="text-muted-foreground">
                              - {format(new Date(leave.endDate), 'd MMM yyyy', { locale: id })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{leave.totalDays} hari</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {leave.reason}
                        </TableCell>
                        <TableCell>{getLeaveStatusBadge(leave.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/hr/leaves/${leave.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Belum ada pengajuan cuti
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
