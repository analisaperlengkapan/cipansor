'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useReceptionStats,
  useGuestBooks,
  useCreateGuestBook,
  useUpdateGuestBook,
  useStudentVisits,
  useCreateStudentVisit,
  useUpdateStudentVisit,
  useStudentPackages,
  useCreatePackage,
  useUpdatePackage,
  GuestBook,
  StudentVisit,
  StudentPackage,
} from '@/hooks/use-reception';
import { useStudents } from '@/hooks/use-students';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Package,
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Calendar,
  Loader2,
  User,
  MapPin,
  FileText,
  Timer,
  PackageOpen,
  PackageCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const GUEST_PURPOSE_OPTIONS = [
  { value: 'MEETING', label: 'Meeting/Rapat' },
  { value: 'VISIT_STUDENT', label: 'Kunjungi Santri' },
  { value: 'DELIVERY', label: 'Antar Barang' },
  { value: 'INTERVIEW', label: 'Wawancara/Interview' },
  { value: 'TOUR', label: 'Tour/Kunjungan' },
  { value: 'OTHER', label: 'Lainnya' },
];

const PACKAGE_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Menunggu', color: 'bg-yellow-500' },
  { value: 'NOTIFIED', label: 'Sudah Diberitahu', color: 'bg-blue-500' },
  { value: 'COLLECTED', label: 'Sudah Diambil', color: 'bg-green-500' },
  { value: 'RETURNED', label: 'Dikembalikan', color: 'bg-red-500' },
];

export default function ReceptionDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState('');
  
  // Guest dialog
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestBook | null>(null);
  const [guestForm, setGuestForm] = useState({
    name: '',
    phone: '',
    organization: '',
    purpose: 'MEETING',
    personToMeet: '',
    notes: '',
  });
  
  // Visit dialog
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [editingVisit, setEditingVisit] = useState<StudentVisit | null>(null);
  const [visitForm, setVisitForm] = useState({
    studentId: '',
    visitorName: '',
    visitorPhone: '',
    relationship: 'PARENT',
    purpose: '',
  });

  // Package dialog
  const [showPackageDialog, setShowPackageDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<StudentPackage | null>(null);
  const [packageForm, setPackageForm] = useState({
    studentId: '',
    senderName: '',
    senderPhone: '',
    trackingNumber: '',
    courier: '',
    description: '',
  });

  const { data: stats, isLoading } = useReceptionStats();
  const { data: guests } = useGuestBooks({ date: selectedDate });
  const { data: visits } = useStudentVisits({ date: selectedDate });
  const { data: packages } = useStudentPackages({ status: 'PENDING' });
  const { data: students } = useStudents({ unitId: user?.unitId });

  const createGuest = useCreateGuestBook();
  const updateGuest = useUpdateGuestBook();
  const createVisit = useCreateStudentVisit();
  const updateVisit = useUpdateStudentVisit();
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();

  const resetGuestForm = () => {
    setGuestForm({
      name: '',
      phone: '',
      organization: '',
      purpose: 'MEETING',
      personToMeet: '',
      notes: '',
    });
    setEditingGuest(null);
  };

  const resetVisitForm = () => {
    setVisitForm({
      studentId: '',
      visitorName: '',
      visitorPhone: '',
      relationship: 'PARENT',
      purpose: '',
    });
    setEditingVisit(null);
  };

  const resetPackageForm = () => {
    setPackageForm({
      studentId: '',
      senderName: '',
      senderPhone: '',
      trackingNumber: '',
      courier: '',
      description: '',
    });
    setEditingPackage(null);
  };

  // Guest handlers
  const handleSaveGuest = async () => {
    if (!guestForm.name || !guestForm.phone) {
      toast.error('Nama dan nomor telepon wajib diisi');
      return;
    }

    try {
      if (editingGuest) {
        await updateGuest.mutateAsync({
          id: editingGuest.id,
          data: guestForm,
        });
        toast.success('Data tamu berhasil diperbarui');
      } else {
        await createGuest.mutateAsync({
          ...guestForm,
          unitId: user?.unitId || '',
        });
        toast.success('Tamu berhasil didaftarkan');
      }
      setShowGuestDialog(false);
      resetGuestForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan data tamu');
    }
  };

  const handleGuestCheckout = async (guest: GuestBook) => {
    try {
      await updateGuest.mutateAsync({
        id: guest.id,
        data: { checkOutTime: new Date().toISOString() },
      });
      toast.success('Tamu berhasil checkout');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal checkout tamu');
    }
  };

  // Visit handlers
  const handleSaveVisit = async () => {
    if (!visitForm.studentId || !visitForm.visitorName) {
      toast.error('Santri dan nama pengunjung wajib diisi');
      return;
    }

    try {
      if (editingVisit) {
        await updateVisit.mutateAsync({
          id: editingVisit.id,
          data: visitForm,
        });
        toast.success('Data kunjungan berhasil diperbarui');
      } else {
        await createVisit.mutateAsync({
          ...visitForm,
          unitId: user?.unitId || '',
        });
        toast.success('Kunjungan berhasil didaftarkan');
      }
      setShowVisitDialog(false);
      resetVisitForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan kunjungan');
    }
  };

  const handleVisitCheckout = async (visit: StudentVisit) => {
    try {
      await updateVisit.mutateAsync({
        id: visit.id,
        data: { checkOutTime: new Date().toISOString() },
      });
      toast.success('Kunjungan berhasil selesai');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyelesaikan kunjungan');
    }
  };

  // Package handlers
  const handleSavePackage = async () => {
    if (!packageForm.studentId || !packageForm.senderName) {
      toast.error('Santri dan nama pengirim wajib diisi');
      return;
    }

    try {
      if (editingPackage) {
        await updatePackage.mutateAsync({
          id: editingPackage.id,
          data: packageForm,
        });
        toast.success('Data paket berhasil diperbarui');
      } else {
        await createPackage.mutateAsync({
          ...packageForm,
          unitId: user?.unitId || '',
        });
        toast.success('Paket berhasil didaftarkan');
      }
      setShowPackageDialog(false);
      resetPackageForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan paket');
    }
  };

  const handleUpdatePackageStatus = async (pkg: StudentPackage, status: string) => {
    try {
      await updatePackage.mutateAsync({
        id: pkg.id,
        data: { 
          status,
          collectedAt: status === 'COLLECTED' ? new Date().toISOString() : undefined,
        },
      });
      toast.success('Status paket berhasil diperbarui');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal update status');
    }
  };

  const getStatusBadge = (status: string) => {
    const option = PACKAGE_STATUS_OPTIONS.find(o => o.value === status);
    return (
      <Badge className={option?.color || 'bg-gray-500'}>
        {option?.label || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Resepsionis</h1>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reception & Front Office</h1>
          <p className="text-muted-foreground">
            Kelola tamu, kunjungan wali santri, dan penerimaan paket
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('guests')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamu Hari Ini</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.guestsToday || 0}</div>
            <p className="text-xs text-muted-foreground">Tamu terdaftar</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('visits')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kunjungan Aktif</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeVisits || 0}</div>
            <p className="text-xs text-muted-foreground">Wali santri berkunjung</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('packages')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paket Pending</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingPackages || 0}</div>
            <p className="text-xs text-muted-foreground">Belum diambil</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paket Bulan Ini</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.packagesThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Paket diterima</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="guests">
            <Users className="mr-2 h-4 w-4" />
            Buku Tamu
          </TabsTrigger>
          <TabsTrigger value="visits">
            <BookOpen className="mr-2 h-4 w-4" />
            Kunjungan
          </TabsTrigger>
          <TabsTrigger value="packages">
            <Package className="mr-2 h-4 w-4" />
            Paket
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Guests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tamu Terbaru</CardTitle>
                  <CardDescription>Hari ini</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowGuestDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah
                </Button>
              </CardHeader>
              <CardContent>
                {guests?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Belum ada tamu</p>
                ) : (
                  <div className="space-y-3">
                    {guests?.slice(0, 5).map((guest: GuestBook) => (
                      <div key={guest.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{guest.name}</p>
                            <p className="text-xs text-muted-foreground">{guest.organization}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{format(new Date(guest.checkInTime), 'HH:mm')}</p>
                          {guest.checkOutTime ? (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Keluar
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-blue-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Di dalam
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Visits */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Kunjungan Aktif</CardTitle>
                  <CardDescription>Wali santri sedang berkunjung</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowVisitDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah
                </Button>
              </CardHeader>
              <CardContent>
                {visits?.filter((v: StudentVisit) => !v.checkOutTime).length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Tidak ada kunjungan aktif</p>
                ) : (
                  <div className="space-y-3">
                    {visits?.filter((v: StudentVisit) => !v.checkOutTime).slice(0, 5).map((visit: StudentVisit) => (
                      <div key={visit.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{visit.visitorName}</p>
                          <p className="text-xs text-muted-foreground">
                            Mengunjungi: {(visit as any).student?.name || 'N/A'}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleVisitCheckout(visit)}>
                          <LogOut className="h-4 w-4 mr-2" />
                          Selesai
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending Packages */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Paket Menunggu Pengambilan</CardTitle>
                <CardDescription>Paket santri yang belum diambil</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowPackageDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Terima Paket
              </Button>
            </CardHeader>
            <CardContent>
              {packages?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Tidak ada paket pending</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {packages?.slice(0, 6).map((pkg: StudentPackage) => (
                    <Card key={pkg.id} className="relative">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{(pkg as any).student?.name || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{pkg.senderName}</p>
                          </div>
                          <PackageOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-xs mt-2">{pkg.courier} - {pkg.trackingNumber}</p>
                        <div className="mt-3 flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleUpdatePackageStatus(pkg, 'NOTIFIED')}
                          >
                            Beritahu
                          </Button>
                          <Button 
                            size="sm"
                            className="flex-1"
                            onClick={() => handleUpdatePackageStatus(pkg, 'COLLECTED')}
                          >
                            Diambil
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guests Tab */}
        <TabsContent value="guests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Buku Tamu</CardTitle>
                  <CardDescription>
                    {format(new Date(selectedDate), 'EEEE, dd MMMM yyyy', { locale: localeId })}
                  </CardDescription>
                </div>
                <Button onClick={() => setShowGuestDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Daftarkan Tamu
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Instansi</TableHead>
                    <TableHead>Tujuan</TableHead>
                    <TableHead>Menemui</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests?.map((guest: GuestBook) => (
                    <TableRow key={guest.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{guest.name}</p>
                          <p className="text-xs text-muted-foreground">{guest.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{guest.organization || '-'}</TableCell>
                      <TableCell>
                        {GUEST_PURPOSE_OPTIONS.find(o => o.value === guest.purpose)?.label || guest.purpose}
                      </TableCell>
                      <TableCell>{guest.personToMeet || '-'}</TableCell>
                      <TableCell>{format(new Date(guest.checkInTime), 'HH:mm')}</TableCell>
                      <TableCell>
                        {guest.checkOutTime ? format(new Date(guest.checkOutTime), 'HH:mm') : '-'}
                      </TableCell>
                      <TableCell>
                        {guest.checkOutTime ? (
                          <Badge variant="outline" className="text-green-600">Selesai</Badge>
                        ) : (
                          <Badge variant="outline" className="text-blue-600">Di dalam</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!guest.checkOutTime && (
                          <Button size="sm" variant="outline" onClick={() => handleGuestCheckout(guest)}>
                            <LogOut className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visits Tab */}
        <TabsContent value="visits" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kunjungan Wali Santri</CardTitle>
                  <CardDescription>
                    {format(new Date(selectedDate), 'EEEE, dd MMMM yyyy', { locale: localeId })}
                  </CardDescription>
                </div>
                <Button onClick={() => setShowVisitDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Daftarkan Kunjungan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pengunjung</TableHead>
                    <TableHead>Santri</TableHead>
                    <TableHead>Hubungan</TableHead>
                    <TableHead>Tujuan</TableHead>
                    <TableHead>Masuk</TableHead>
                    <TableHead>Keluar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits?.map((visit: StudentVisit) => (
                    <TableRow key={visit.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{visit.visitorName}</p>
                          <p className="text-xs text-muted-foreground">{visit.visitorPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{(visit as any).student?.name || 'N/A'}</TableCell>
                      <TableCell>{visit.relationship}</TableCell>
                      <TableCell>{visit.purpose || '-'}</TableCell>
                      <TableCell>{format(new Date(visit.checkInTime), 'HH:mm')}</TableCell>
                      <TableCell>
                        {visit.checkOutTime ? format(new Date(visit.checkOutTime), 'HH:mm') : '-'}
                      </TableCell>
                      <TableCell>
                        {visit.checkOutTime ? (
                          <Badge variant="outline" className="text-green-600">Selesai</Badge>
                        ) : (
                          <Badge variant="outline" className="text-blue-600">Berlangsung</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!visit.checkOutTime && (
                          <Button size="sm" variant="outline" onClick={() => handleVisitCheckout(visit)}>
                            <LogOut className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Penerimaan Paket</CardTitle>
                  <CardDescription>Daftar paket santri</CardDescription>
                </div>
                <Button onClick={() => setShowPackageDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Terima Paket Baru
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Santri</TableHead>
                    <TableHead>Pengirim</TableHead>
                    <TableHead>Kurir</TableHead>
                    <TableHead>No. Resi</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Diterima</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages?.map((pkg: StudentPackage) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">
                        {(pkg as any).student?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{pkg.senderName}</p>
                          <p className="text-xs text-muted-foreground">{pkg.senderPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{pkg.courier}</TableCell>
                      <TableCell className="font-mono text-sm">{pkg.trackingNumber}</TableCell>
                      <TableCell>{pkg.description || '-'}</TableCell>
                      <TableCell>
                        {format(new Date(pkg.receivedAt), 'dd/MM HH:mm')}
                      </TableCell>
                      <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUpdatePackageStatus(pkg, 'NOTIFIED')}>
                              Tandai Diberitahu
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdatePackageStatus(pkg, 'COLLECTED')}>
                              Tandai Diambil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdatePackageStatus(pkg, 'RETURNED')}>
                              Tandai Dikembalikan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Guest Dialog */}
      <Dialog open={showGuestDialog} onOpenChange={(open) => {
        if (!open) resetGuestForm();
        setShowGuestDialog(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daftarkan Tamu</DialogTitle>
            <DialogDescription>Catat kedatangan tamu baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Lengkap*</Label>
                <Input
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  placeholder="Nama tamu"
                />
              </div>
              <div className="space-y-2">
                <Label>No. Telepon*</Label>
                <Input
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Instansi/Organisasi</Label>
              <Input
                value={guestForm.organization}
                onChange={(e) => setGuestForm({ ...guestForm, organization: e.target.value })}
                placeholder="Nama instansi (opsional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tujuan*</Label>
                <Select
                  value={guestForm.purpose}
                  onValueChange={(v) => setGuestForm({ ...guestForm, purpose: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GUEST_PURPOSE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Menemui</Label>
                <Input
                  value={guestForm.personToMeet}
                  onChange={(e) => setGuestForm({ ...guestForm, personToMeet: e.target.value })}
                  placeholder="Nama yang ditemui"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                value={guestForm.notes}
                onChange={(e) => setGuestForm({ ...guestForm, notes: e.target.value })}
                placeholder="Catatan tambahan"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGuestDialog(false)}>Batal</Button>
            <Button onClick={handleSaveGuest} disabled={createGuest.isPending}>
              {createGuest.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visit Dialog */}
      <Dialog open={showVisitDialog} onOpenChange={(open) => {
        if (!open) resetVisitForm();
        setShowVisitDialog(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daftarkan Kunjungan</DialogTitle>
            <DialogDescription>Catat kunjungan wali santri</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Santri yang Dikunjungi*</Label>
              <Select
                value={visitForm.studentId}
                onValueChange={(v) => setVisitForm({ ...visitForm, studentId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih santri" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} - {student.nisn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Pengunjung*</Label>
                <Input
                  value={visitForm.visitorName}
                  onChange={(e) => setVisitForm({ ...visitForm, visitorName: e.target.value })}
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="space-y-2">
                <Label>No. Telepon</Label>
                <Input
                  value={visitForm.visitorPhone}
                  onChange={(e) => setVisitForm({ ...visitForm, visitorPhone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hubungan*</Label>
                <Select
                  value={visitForm.relationship}
                  onValueChange={(v) => setVisitForm({ ...visitForm, relationship: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PARENT">Orang Tua</SelectItem>
                    <SelectItem value="GUARDIAN">Wali</SelectItem>
                    <SelectItem value="SIBLING">Saudara</SelectItem>
                    <SelectItem value="RELATIVE">Kerabat</SelectItem>
                    <SelectItem value="OTHER">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tujuan</Label>
                <Input
                  value={visitForm.purpose}
                  onChange={(e) => setVisitForm({ ...visitForm, purpose: e.target.value })}
                  placeholder="Tujuan kunjungan"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVisitDialog(false)}>Batal</Button>
            <Button onClick={handleSaveVisit} disabled={createVisit.isPending}>
              {createVisit.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Package Dialog */}
      <Dialog open={showPackageDialog} onOpenChange={(open) => {
        if (!open) resetPackageForm();
        setShowPackageDialog(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terima Paket</DialogTitle>
            <DialogDescription>Catat penerimaan paket santri</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Santri Penerima*</Label>
              <Select
                value={packageForm.studentId}
                onValueChange={(v) => setPackageForm({ ...packageForm, studentId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih santri" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} - {student.nisn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Pengirim*</Label>
                <Input
                  value={packageForm.senderName}
                  onChange={(e) => setPackageForm({ ...packageForm, senderName: e.target.value })}
                  placeholder="Nama pengirim"
                />
              </div>
              <div className="space-y-2">
                <Label>No. Telepon Pengirim</Label>
                <Input
                  value={packageForm.senderPhone}
                  onChange={(e) => setPackageForm({ ...packageForm, senderPhone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kurir</Label>
                <Select
                  value={packageForm.courier}
                  onValueChange={(v) => setPackageForm({ ...packageForm, courier: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kurir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JNE">JNE</SelectItem>
                    <SelectItem value="J&T">J&T</SelectItem>
                    <SelectItem value="SiCepat">SiCepat</SelectItem>
                    <SelectItem value="AnterAja">AnterAja</SelectItem>
                    <SelectItem value="POS">POS Indonesia</SelectItem>
                    <SelectItem value="Grab">Grab/Gojek</SelectItem>
                    <SelectItem value="OTHER">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>No. Resi</Label>
                <Input
                  value={packageForm.trackingNumber}
                  onChange={(e) => setPackageForm({ ...packageForm, trackingNumber: e.target.value })}
                  placeholder="Nomor resi"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={packageForm.description}
                onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                placeholder="Deskripsi paket"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPackageDialog(false)}>Batal</Button>
            <Button onClick={handleSavePackage} disabled={createPackage.isPending}>
              {createPackage.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
