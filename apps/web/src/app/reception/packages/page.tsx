'use client';

import { useState } from 'react';
import { useStudentPackages, useCreateStudentPackage, useUpdateStudentPackage } from '@/hooks/use-reception';
import { useStudents } from '@/hooks/use-students';
import { Button } from '@/components/ui/button';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CreateStudentPackageInput, PackageStatus } from '@cipansor/shared';
import { Loader2, Plus, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StudentPackagePage() {
  const [status, setStatus] = useState<string>('RECEIVED');
  const { data: packages, isLoading } = useStudentPackages({ status });
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Paket Santri</h1>
        <div className="flex items-center gap-2">
           <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RECEIVED">Belum Diambil</SelectItem>
              <SelectItem value="DELIVERED">Sudah Diambil</SelectItem>
              <SelectItem value="RETURNED">Dikembalikan</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Terima Paket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Catat Penerimaan Paket</DialogTitle>
              </DialogHeader>
              <PackageForm onSuccess={() => setIsOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu Terima</TableHead>
              <TableHead>Nama Santri</TableHead>
              <TableHead>Pengirim</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : packages?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Tidak ada data paket
                </TableCell>
              </TableRow>
            ) : (
              packages?.map((pkg) => (
                <PackageRow key={pkg.id} pkg={pkg} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PackageForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<CreateStudentPackageInput>();
  const createPackage = useCreateStudentPackage();
  const { data: studentsResponse } = useStudents({ page: 1, limit: 100 });
  const students = studentsResponse?.data || [];

  const onSubmit = async (data: CreateStudentPackageInput) => {
    try {
      await createPackage.mutateAsync(data);
      toast.success('Paket berhasil dicatat');
      onSuccess();
    } catch (error) {
      toast.error('Gagal mencatat paket');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="studentId">Nama Santri</Label>
        <Controller
          name="studentId"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Santri" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} ({student.nis})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.studentId && <span className="text-xs text-red-500">Wajib diisi</span>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="senderName">Nama Pengirim</Label>
        <Input id="senderName" {...register('senderName', { required: true })} />
        {errors.senderName && <span className="text-xs text-red-500">Wajib diisi</span>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="senderPhone">No. HP Pengirim (Opsional)</Label>
        <Input id="senderPhone" {...register('senderPhone')} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Deskripsi Isi Paket (Opsional)</Label>
        <Textarea id="description" {...register('description')} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Catatan (Opsional)</Label>
        <Textarea id="notes" {...register('notes')} />
      </div>
      <Button type="submit" className="w-full" disabled={createPackage.isPending}>
        {createPackage.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Simpan
      </Button>
    </form>
  );
}

function PackageRow({ pkg }: { pkg: any }) {
  const updatePackage = useUpdateStudentPackage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [recipient, setRecipient] = useState('');

  const handleDeliver = async () => {
    try {
      await updatePackage.mutateAsync({
        id: pkg.id,
        data: {
          status: PackageStatus.DELIVERED,
          deliveredTo: recipient || pkg.student?.name
        }
      });
      toast.success('Paket berhasil diambil');
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Gagal update status paket');
    }
  };

  return (
    <TableRow>
      <TableCell>{format(new Date(pkg.receivedAt), 'dd/MM/yyyy HH:mm')}</TableCell>
      <TableCell>
        <div className="font-medium">{pkg.student?.name}</div>
        <div className="text-xs text-muted-foreground">{pkg.student?.enrollments?.[0]?.class?.name || '-'}</div>
      </TableCell>
      <TableCell>{pkg.senderName}</TableCell>
      <TableCell>{pkg.description || '-'}</TableCell>
      <TableCell>
        {pkg.status === PackageStatus.DELIVERED ? (
          <Badge variant="outline">Diambil</Badge>
        ) : pkg.status === PackageStatus.RETURNED ? (
          <Badge variant="destructive">Dikembalikan</Badge>
        ) : (
          <Badge variant="default" className="bg-blue-600">Menunggu</Badge>
        )}
      </TableCell>
      <TableCell>
        {pkg.status === PackageStatus.RECEIVED && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                title="Mark as Delivered"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Konfirmasi Pengambilan Paket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>Diambil Oleh</Label>
                  <Input
                    placeholder={`Default: ${pkg.student?.name}`}
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Kosongkan jika diambil sendiri oleh santri.</p>
                </div>
                <Button onClick={handleDeliver} className="w-full" disabled={updatePackage.isPending}>
                   {updatePackage.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   Konfirmasi Pengambilan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </TableCell>
    </TableRow>
  );
}
