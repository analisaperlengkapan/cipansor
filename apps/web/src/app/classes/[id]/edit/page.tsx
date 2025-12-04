'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUnits } from '@/hooks/use-units';
import { useTeachers } from '@/hooks/use-teachers';
import { useAcademicYears } from '@/hooks/use-academic-years';
import { useClass, useUpdateClass } from '@/hooks/use-classes';

const classSchema = z.object({
  name: z.string().min(1, 'Nama kelas wajib diisi'),
  grade: z.coerce.number().min(1, 'Tingkat minimal 1').max(12, 'Tingkat maksimal 12'),
  section: z.string().optional(),
  unitId: z.string().min(1, 'Unit wajib dipilih'),
  academicYearId: z.string().min(1, 'Tahun ajaran wajib dipilih'),
  homeroomTeacherId: z.string().optional(),
  schedule: z.string().optional(),
  maxStudents: z.coerce.number().min(1, 'Kapasitas minimal 1').optional(),
});

type ClassFormData = z.infer<typeof classSchema>;

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;

  const { data: classData, isLoading: classLoading } = useClass(classId);
  const updateClass = useUpdateClass();

  const { data: units, isLoading: unitsLoading } = useUnits();
  const { data: teachers, isLoading: teachersLoading } = useTeachers();
  const { data: academicYearsData, isLoading: academicYearsLoading } = useAcademicYears();
  const academicYears = academicYearsData?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
  });

  const selectedUnitId = watch('unitId');

  // Populate form with existing data
  useEffect(() => {
    if (classData) {
      reset({
        name: classData.name,
        grade: classData.grade,
        section: classData.section || '',
        unitId: classData.unitId,
        academicYearId: classData.academicYearId,
        homeroomTeacherId: classData.homeroomTeacherId || '',
        schedule: classData.schedule || '',
        maxStudents: classData.maxStudents || undefined,
      });
    }
  }, [classData, reset]);

  const onSubmit = async (data: ClassFormData) => {
    try {
      await updateClass.mutateAsync({
        id: classId,
        data: {
          ...data,
          section: data.section || undefined,
          homeroomTeacherId: data.homeroomTeacherId || undefined,
          schedule: data.schedule || undefined,
          maxStudents: data.maxStudents || undefined,
        },
      });
      toast.success('Kelas berhasil diperbarui');
      router.push(`/classes/${classId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui kelas';
      toast.error(errorMessage);
    }
  };

  // Filter academic years by selected unit
  const filteredAcademicYears = selectedUnitId
    ? academicYears?.filter((ay) => ay.unitId === selectedUnitId)
    : academicYears;

  // Filter teachers by selected unit
  const filteredTeachers = selectedUnitId
    ? teachers?.filter((t) => t.unitId === selectedUnitId)
    : teachers;

  if (classLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!classData) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <p className="text-muted-foreground">Kelas tidak ditemukan</p>
          <Button asChild>
            <Link href="/classes">Kembali ke Daftar Kelas</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/classes/${classId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Kelas</h1>
            <p className="text-muted-foreground">Perbarui data kelas {classData.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Kelas</CardTitle>
                <CardDescription>Data dasar kelas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Kelas *</Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Kelas 7A, X IPA 1"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Tingkat *</Label>
                    <Input
                      id="grade"
                      type="number"
                      min={1}
                      max={12}
                      placeholder="7"
                      {...register('grade')}
                    />
                    {errors.grade && (
                      <p className="text-sm text-destructive">{errors.grade.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="section">Bagian/Rombel</Label>
                    <Input
                      id="section"
                      placeholder="A, B, IPA 1"
                      {...register('section')}
                    />
                    {errors.section && (
                      <p className="text-sm text-destructive">{errors.section.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxStudents">Kapasitas Maksimal</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    min={1}
                    placeholder="30"
                    {...register('maxStudents')}
                  />
                  {errors.maxStudents && (
                    <p className="text-sm text-destructive">{errors.maxStudents.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule">Jadwal</Label>
                  <Textarea
                    id="schedule"
                    placeholder="Senin-Jumat, 07:00-14:00"
                    rows={3}
                    {...register('schedule')}
                  />
                  {errors.schedule && (
                    <p className="text-sm text-destructive">{errors.schedule.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unit & Tahun Ajaran</CardTitle>
                <CardDescription>Penempatan kelas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unitId">Unit Pendidikan *</Label>
                  <Select
                    value={selectedUnitId}
                    onValueChange={(value) => {
                      setValue('unitId', value);
                      setValue('academicYearId', '');
                      setValue('homeroomTeacherId', '');
                    }}
                    disabled={unitsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units?.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.unitId && (
                    <p className="text-sm text-destructive">{errors.unitId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicYearId">Tahun Ajaran *</Label>
                  <Select
                    value={watch('academicYearId')}
                    onValueChange={(value) => setValue('academicYearId', value)}
                    disabled={academicYearsLoading || !selectedUnitId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedUnitId ? 'Pilih unit terlebih dahulu' : 'Pilih tahun ajaran'} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAcademicYears?.map((ay) => (
                        <SelectItem key={ay.id} value={ay.id}>
                          {ay.name} {ay.isActive && '(Aktif)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.academicYearId && (
                    <p className="text-sm text-destructive">{errors.academicYearId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="homeroomTeacherId">Wali Kelas</Label>
                  <Select
                    value={watch('homeroomTeacherId') || ''}
                    onValueChange={(value) => setValue('homeroomTeacherId', value)}
                    disabled={teachersLoading || !selectedUnitId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedUnitId ? 'Pilih unit terlebih dahulu' : 'Pilih wali kelas'} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTeachers?.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.homeroomTeacherId && (
                    <p className="text-sm text-destructive">{errors.homeroomTeacherId.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" asChild>
              <Link href={`/classes/${classId}`}>Batal</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting || updateClass.isPending}>
              {isSubmitting || updateClass.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
