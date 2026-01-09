'use client';

import { useState } from 'react';
import { useStudentVisits, useCreateStudentVisit, useUpdateStudentVisit } from '@/hooks/use-reception';
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
import { CreateStudentVisitInput, VisitStatus } from '@cipansor/shared';
import { Loader2, Plus, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StudentVisitPage() {
  const [date, setDate] = useState<Date>(new Date());
  const { data: visits, isLoading } = useStudentVisits({ date: date.toISOString() });
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Kunjungan Wali Santri</h1>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={format(date, 'yyyy-MM-dd')}
            onChange={(e) => setDate(new Date(e.target.value))}
            className="w-auto"
          />
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Catat Kunjungan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Catat Kunjungan Baru</DialogTitle>
              </DialogHeader>
              <VisitForm onSuccess={() => setIsOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Nama Santri</TableHead>
              <TableHead>Pengunjung</TableHead>
              <TableHead>Hubungan</TableHead>
              <TableHead>Keperluan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : visits?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  Belum ada kunjungan hari ini
                </TableCell>
              </TableRow>
            ) : (
              visits?.map((visit) => (
                <VisitRow key={visit.id} visit={visit} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function VisitForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<CreateStudentVisitInput>();
  const createVisit = useCreateStudentVisit();
  const { data: studentsResponse } = useStudents({ page: 1, limit: 100 }); // In real app, implement search
  const students = studentsResponse?.data || [];

  const onSubmit = async (data: CreateStudentVisitInput) => {
    try {
      await createVisit.mutateAsync(data);
      toast.success('Data kunjungan berhasil disimpan');
      onSuccess();
    } catch (error) {
      toast.error('Gagal menyimpan data kunjungan');
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
        <Label htmlFor="visitorName">Nama Pengunjung</Label>
        <Input id="visitorName" {...register('visitorName', { required: true })} />
        {errors.visitorName && <span className="text-xs text-red-500">Wajib diisi</span>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="relation">Hubungan</Label>
        <Controller
          name="relation"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Hubungan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AYAH">Ayah</SelectItem>
                <SelectItem value="IBU">Ibu</SelectItem>
                <SelectItem value="WALI">Wali</SelectItem>
                <SelectItem value="SAUDARA">Saudara</SelectItem>
                <SelectItem value="LAINNYA">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.relation && <span className="text-xs text-red-500">Wajib diisi</span>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="purpose">Keperluan (Opsional)</Label>
        <Textarea id="purpose" {...register('purpose')} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Catatan (Opsional)</Label>
        <Textarea id="notes" {...register('notes')} />
      </div>
      <Button type="submit" className="w-full" disabled={createVisit.isPending}>
        {createVisit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Simpan
      </Button>
    </form>
  );
}

function VisitRow({ visit }: { visit: any }) {
  const updateVisit = useUpdateStudentVisit();

  const handleCheckout = async () => {
    try {
      await updateVisit.mutateAsync({
        id: visit.id,
        data: {
          checkOut: new Date(),
          status: VisitStatus.CHECKED_OUT
        }
      });
      toast.success('Kunjungan selesai');
    } catch (error) {
      toast.error('Gagal update status kunjungan');
    }
  };

  return (
    <TableRow>
      <TableCell>{format(new Date(visit.checkIn), 'HH:mm')}</TableCell>
      <TableCell>
        <div className="font-medium">{visit.student?.name}</div>
        <div className="text-xs text-muted-foreground">{visit.student?.enrollments?.[0]?.class?.name || '-'}</div>
      </TableCell>
      <TableCell>{visit.visitorName}</TableCell>
      <TableCell>{visit.relation}</TableCell>
      <TableCell>{visit.purpose || '-'}</TableCell>
      <TableCell>
        {visit.status === VisitStatus.CHECKED_OUT ? (
          <Badge variant="outline">Selesai</Badge>
        ) : visit.status === VisitStatus.CANCELLED ? (
          <Badge variant="destructive">Dibatalkan</Badge>
        ) : (
          <Badge variant="default" className="bg-green-600">Berkunjung</Badge>
        )}
      </TableCell>
      <TableCell>
        {visit.status === VisitStatus.CHECKED_IN && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCheckout}
            disabled={updateVisit.isPending}
            title="Check Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
