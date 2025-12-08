'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import {
  useCreatePAUDAssessment,
  usePAUDIndicators,
  PAUDAspect,
  PAUDAchievementLevel,
  ASPECT_LABELS,
  ACHIEVEMENT_LABELS,
} from '@/hooks/use-paud-assessment';
import { useStudents } from '@/hooks/use-students';
import { useAcademicYears } from '@/hooks/use-academic-years';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  studentId: z.string().min(1, 'Pilih siswa'),
  academicYearId: z.string().min(1, 'Pilih tahun ajaran'),
  aspect: z.enum(['NAM', 'FM', 'KOG', 'BHS', 'SE', 'SNI'], {
    required_error: 'Pilih aspek perkembangan',
  }),
  indicatorId: z.string().optional(),
  periodType: z.enum(['HARIAN', 'MINGGUAN', 'BULANAN', 'SEMESTER'], {
    required_error: 'Pilih tipe periode',
  }),
  periodDate: z.date({ required_error: 'Pilih tanggal penilaian' }),
  achievementLevel: z.enum(['BB', 'MB', 'BSH', 'BSB'], {
    required_error: 'Pilih tingkat capaian',
  }),
  narrativeText: z.string().max(2000).optional(),
  teacherNotes: z.string().max(1000).optional(),
  recommendations: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const PERIOD_TYPES = [
  { value: 'HARIAN', label: 'Harian', description: 'Penilaian harian' },
  { value: 'MINGGUAN', label: 'Mingguan', description: 'Penilaian mingguan' },
  { value: 'BULANAN', label: 'Bulanan', description: 'Penilaian bulanan' },
  { value: 'SEMESTER', label: 'Semester', description: 'Penilaian semester' },
];

const ACHIEVEMENT_OPTIONS = [
  { value: 'BB', label: 'BB', description: 'Belum Berkembang', color: 'border-red-500' },
  { value: 'MB', label: 'MB', description: 'Mulai Berkembang', color: 'border-yellow-500' },
  { value: 'BSH', label: 'BSH', description: 'Berkembang Sesuai Harapan', color: 'border-blue-500' },
  { value: 'BSB', label: 'BSB', description: 'Berkembang Sangat Baik', color: 'border-green-500' },
];

export default function CreatePAUDAssessmentPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: students, isLoading: loadingStudents } = useStudents({
    unitId: user?.unitId,
    status: 'ACTIVE',
    limit: 100,
  });

  const { data: academicYears, isLoading: loadingYears } = useAcademicYears();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      periodType: 'HARIAN',
      periodDate: new Date(),
    },
  });

  const selectedAspect = form.watch('aspect') as PAUDAspect | undefined;
  const { data: indicators } = usePAUDIndicators({
    aspect: selectedAspect,
    isActive: true,
  });

  const createMutation = useCreatePAUDAssessment();

  const onSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync({
        ...values,
        periodDate: format(values.periodDate, 'yyyy-MM-dd'),
      });
      toast.success('Penilaian berhasil disimpan');
      router.push('/paud/assessment');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan penilaian';
      toast.error(message);
    }
  };

  // Get active academic year as default
  const activeYear = academicYears?.data?.find((y) => y.isActive);
  if (activeYear && !form.getValues('academicYearId')) {
    form.setValue('academicYearId', activeYear.id);
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Tambah Penilaian TK Qur'an"
          description="Catat perkembangan anak berdasarkan 6 aspek perkembangan"
          actions={
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          }
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Column - Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Dasar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Siswa *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih siswa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loadingStudents ? (
                              <div className="p-2 text-center text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                Memuat...
                              </div>
                            ) : (
                              students?.data?.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.name} ({student.nis})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="academicYearId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tahun Ajaran *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tahun ajaran" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {academicYears?.data?.map((year) => (
                              <SelectItem key={year.id} value={year.id}>
                                {year.name} {year.isActive && '(Aktif)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="periodType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipe Periode *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih tipe" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PERIOD_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
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
                      name="periodDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tanggal *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, 'dd/MM/yyyy', { locale: idLocale })
                                  ) : (
                                    'Pilih tanggal'
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Right Column - Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle>Penilaian Perkembangan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="aspect"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aspek Perkembangan *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih aspek" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(ASPECT_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {value} - {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          6 aspek perkembangan sesuai Permendikbud 137/2014
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedAspect && indicators && indicators.length > 0 && (
                    <FormField
                      control={form.control}
                      name="indicatorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Indikator (Opsional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih indikator" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {indicators.map((indicator) => (
                                <SelectItem key={indicator.id} value={indicator.id}>
                                  {indicator.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="achievementLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tingkat Capaian *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-2 gap-4"
                          >
                            {ACHIEVEMENT_OPTIONS.map((option) => (
                              <div key={option.value}>
                                <RadioGroupItem
                                  value={option.value}
                                  id={option.value}
                                  className="peer sr-only"
                                />
                                <label
                                  htmlFor={option.value}
                                  className={cn(
                                    'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer',
                                    option.color
                                  )}
                                >
                                  <span className="text-2xl font-bold">{option.value}</span>
                                  <span className="text-xs text-center text-muted-foreground">
                                    {option.description}
                                  </span>
                                </label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Narratives */}
            <Card>
              <CardHeader>
                <CardTitle>Catatan & Narasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="narrativeText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi Perkembangan</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Jelaskan perkembangan anak pada aspek ini..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Maksimal 2000 karakter. Saat ini: {field.value?.length || 0} karakter
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="teacherNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan Guru</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Catatan khusus dari guru..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recommendations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rekomendasi untuk Orang Tua</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Saran aktivitas di rumah..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                    Simpan Penilaian
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
