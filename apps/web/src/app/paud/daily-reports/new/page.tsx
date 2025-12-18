'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { useCreateDailyReport } from '@/hooks/use-daily-report';
import { useClasses } from '@/hooks/use-classes';
import { useStudents } from '@/hooks/use-students';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ArrowLeft, CalendarIcon, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const ATTENDANCE_OPTIONS = [
  { value: 'PRESENT', label: 'Hadir', color: 'text-green-600' },
  { value: 'LATE', label: 'Terlambat', color: 'text-yellow-600' },
  { value: 'SICK', label: 'Sakit', color: 'text-orange-600' },
  { value: 'EXCUSED', label: 'Izin', color: 'text-blue-600' },
  { value: 'ABSENT', label: 'Alpha', color: 'text-red-600' },
];

const MOOD_OPTIONS = [
  { value: 'HAPPY', label: '😊 Senang' },
  { value: 'EXCITED', label: '🤩 Antusias' },
  { value: 'NEUTRAL', label: '😐 Biasa' },
  { value: 'TIRED', label: '😴 Lelah' },
  { value: 'SAD', label: '😢 Sedih' },
];

const HEALTH_OPTIONS = [
  { value: 'HEALTHY', label: 'Sehat' },
  { value: 'SICK', label: 'Sakit' },
  { value: 'RECOVERING', label: 'Pemulihan' },
  { value: 'NEED_ATTENTION', label: 'Perlu Perhatian' },
];

const QUALITY_OPTIONS = [
  { value: 'GOOD', label: 'Baik' },
  { value: 'FAIR', label: 'Cukup' },
  { value: 'POOR', label: 'Kurang' },
];

const dailyReportSchema = z.object({
  studentId: z.string().min(1, 'Siswa wajib dipilih'),
  classId: z.string().min(1, 'Kelas wajib dipilih'),
  date: z.date({ required_error: 'Tanggal wajib diisi' }),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  attendanceStatus: z.string().min(1, 'Status kehadiran wajib dipilih'),
  moodStatus: z.string().optional(),
  healthStatus: z.string().optional(),
  sleepQuality: z.string().optional(),
  appetiteLevel: z.string().optional(),
  napTime: z.number().optional(),
  activities: z.string().optional(),
  achievements: z.string().optional(),
  concerns: z.string().optional(),
  teacherNotes: z.string().optional(),
});

type DailyReportFormData = z.infer<typeof dailyReportSchema>;

export default function CreateDailyReportPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const { data: classes } = useClasses({ unitId: user?.unitId });
  const { data: students } = useStudents({
    classId: selectedClassId || undefined,
    unitId: user?.unitId,
    limit: 100,
  });

  const createMutation = useCreateDailyReport();

  const form = useForm<DailyReportFormData>({
    resolver: zodResolver(dailyReportSchema),
    defaultValues: {
      studentId: '',
      classId: '',
      date: new Date(),
      checkInTime: '',
      checkOutTime: '',
      attendanceStatus: 'PRESENT',
      moodStatus: '',
      healthStatus: '',
      sleepQuality: '',
      appetiteLevel: '',
      napTime: undefined,
      activities: '',
      achievements: '',
      concerns: '',
      teacherNotes: '',
    },
  });

  const onSubmit = async (data: DailyReportFormData) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        date: format(data.date, 'yyyy-MM-dd'),
        napTime: data.napTime || undefined,
        moodStatus: data.moodStatus || undefined,
        healthStatus: data.healthStatus || undefined,
        sleepQuality: data.sleepQuality || undefined,
        appetiteLevel: data.appetiteLevel || undefined,
      });
      toast.success('Laporan harian berhasil dibuat');
      router.push('/paud/daily-reports');
    } catch {
      toast.error('Gagal membuat laporan harian');
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    form.setValue('classId', classId);
    form.setValue('studentId', '');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Buat Laporan Harian"
          description="Buat laporan harian aktivitas siswa PAUD"
          actions={
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          }
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dasar</CardTitle>
                <CardDescription>Data siswa dan tanggal laporan</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kelas *</FormLabel>
                      <Select value={field.value} onValueChange={handleClassChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kelas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes?.data?.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Siswa *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!selectedClassId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih siswa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students?.data?.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name} ({student.nis})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(field.value, 'dd MMMM yyyy', { locale: idLocale })
                                : 'Pilih tanggal'}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            locale={idLocale}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Attendance */}
            <Card>
              <CardHeader>
                <CardTitle>Kehadiran</CardTitle>
                <CardDescription>Status dan waktu kehadiran siswa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="attendanceStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Kehadiran *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex flex-wrap gap-4"
                        >
                          {ATTENDANCE_OPTIONS.map((opt) => (
                            <div key={opt.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={opt.value} id={`attendance-${opt.value}`} />
                              <Label
                                htmlFor={`attendance-${opt.value}`}
                                className={cn('cursor-pointer', opt.color)}
                              >
                                {opt.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="checkInTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jam Masuk</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="checkOutTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jam Pulang</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Condition */}
            <Card>
              <CardHeader>
                <CardTitle>Kondisi Anak</CardTitle>
                <CardDescription>Mood, kesehatan, dan kondisi fisik</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="moodStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mood</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih mood" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOOD_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="healthStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kesehatan</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status kesehatan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {HEALTH_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sleepQuality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kualitas Tidur</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kualitas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {QUALITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appetiteLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nafsu Makan</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {QUALITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="napTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waktu Tidur Siang (menit)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Contoh: 60"
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Activities & Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Kegiatan & Catatan</CardTitle>
                <CardDescription>Detail kegiatan dan catatan harian</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="activities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kegiatan Hari Ini</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Tuliskan kegiatan yang dilakukan anak hari ini..."
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="achievements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pencapaian</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Tuliskan pencapaian atau perkembangan positif anak..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="concerns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hal yang Perlu Diperhatikan</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Tuliskan hal-hal yang perlu mendapat perhatian khusus..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teacherNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan Guru</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Catatan tambahan dari guru..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Batal
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Laporan
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </MainLayout>
  );
}
