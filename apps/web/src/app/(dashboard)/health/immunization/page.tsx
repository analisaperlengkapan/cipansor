'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ImmunizationRecord {
  id: string;
  student: { user: { name: string } };
  vaccineName: string;
  doseNumber: number;
  scheduledDate?: string;
  status: string;
}

export default function ImmunizationPage() {
  const [data, setData] = useState<ImmunizationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    vaccineName: '',
    doseNumber: 1,
    scheduledDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await apiClient.get('/health/immunization');
      setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/health/immunization', {
        studentId: formData.studentId,
        vaccineName: formData.vaccineName,
        doseNumber: formData.doseNumber,
        ...(formData.scheduledDate ? { scheduledDate: formData.scheduledDate } : {}),
        // In a real app, unitId would come from the user's session or context
        unitId: 'unit-uuid-placeholder',
      });
      toast.success('Data berhasil ditambahkan');
      setOpen(false);
      fetchData();
      // Reset form
      setFormData({
        studentId: '',
        vaccineName: '',
        doseNumber: 1,
        scheduledDate: '',
      });
    } catch (error) {
      console.error(error);
      toast.error('Gagal menambahkan data');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Data Imunisasi</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Tambah Data</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Imunisasi</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">ID Siswa (UUID)</Label>
                <Input
                  id="studentId"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="Masukkan ID Siswa"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vaccineName">Nama Vaksin</Label>
                <Input
                  id="vaccineName"
                  value={formData.vaccineName}
                  onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })}
                  placeholder="Contoh: Hepatitis B"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doseNumber">Dosis Ke</Label>
                <Input
                  id="doseNumber"
                  type="number"
                  min={1}
                  value={formData.doseNumber}
                  onChange={(e) => setFormData({ ...formData, doseNumber: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Tanggal Jadwal</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Imunisasi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Santri</TableHead>
                <TableHead>Nama Vaksin</TableHead>
                <TableHead>Dosis Ke</TableHead>
                <TableHead>Tanggal Jadwal</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.student?.user?.name || '-'}</TableCell>
                    <TableCell>{item.vaccineName}</TableCell>
                    <TableCell>{item.doseNumber}</TableCell>
                    <TableCell>
                      {item.scheduledDate
                        ? format(new Date(item.scheduledDate), 'dd MMM yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>{item.status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
