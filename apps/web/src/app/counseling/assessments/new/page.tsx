'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  useCreatePsychologyRecord,
  usePsychologyTests,
} from '@/hooks/use-psychology';
import { useStudentSearch } from '@/hooks/use-students';
import { useDebounce } from '@/hooks/use-debounce';

const assessmentSchema = z.object({
  studentId: z.string({ required_error: 'Siswa wajib dipilih' }),
  testId: z.string({ required_error: 'Jenis tes wajib dipilih' }),
  testDate: z.date({ required_error: 'Tanggal tes wajib diisi' }),
  score: z.coerce.number().optional(),
  classification: z.string().optional(),
  analysis: z.string().optional(),
  details: z.string().optional(),
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

export default function NewAssessmentPage() {
  const router = useRouter();
  const createMutation = useCreatePsychologyRecord();
  const { data: tests } = usePsychologyTests();

  const [studentSearch, setStudentSearch] = useState('');
  const debouncedStudentSearch = useDebounce(studentSearch, 300);
  const { data: students, isLoading: isLoadingStudents } = useStudentSearch(debouncedStudentSearch);
  const [openStudent, setOpenStudent] = useState(false);

  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      details: '',
    },
  });

  const onSubmit = async (data: AssessmentFormValues) => {
    try {
      let detailsJson = undefined;
      if (data.details) {
          try {
              // Attempt to parse if it looks like JSON
              detailsJson = JSON.parse(data.details);
          } catch {
              // If not JSON, just wrap it in an object
              detailsJson = { notes: data.details };
          }
      }

      await createMutation.mutateAsync({
        ...data,
        testDate: data.testDate.toISOString(),
        details: detailsJson,
      });
      router.push('/counseling/assessments');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Input Hasil Asesmen Psikologi</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Student Search */}
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Siswa</FormLabel>
                    <Popover open={openStudent} onOpenChange={setOpenStudent}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openStudent}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? students?.find((student) => student.id === field.value)?.name || "Siswa terpilih"
                              : "Cari siswa..."}
                            <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Cari nama atau NIS..."
                            value={studentSearch}
                            onValueChange={setStudentSearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                                {isLoadingStudents ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Siswa tidak ditemukan."}
                            </CommandEmpty>
                            <CommandGroup>
                              {students?.map((student) => (
                                <CommandItem
                                  value={student.id}
                                  key={student.id}
                                  onSelect={() => {
                                    form.setValue("studentId", student.id);
                                    setOpenStudent(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      student.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                      <span>{student.name}</span>
                                      <span className="text-xs text-muted-foreground">{student.nis} - {student.currentClass?.name}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Test Type */}
              <FormField
                control={form.control}
                name="testId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Tes</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih alat tes" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tests?.map((test) => (
                          <SelectItem key={test.id} value={test.id}>
                            {test.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="testDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Tes</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pilih tanggal</span>
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
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Score & Classification */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skor Total</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="classification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Klasifikasi</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Superior, Rata-rata" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Analysis */}
              <FormField
                control={form.control}
                name="analysis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Analisis & Kesimpulan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tuliskan hasil analisis psikologis..."
                        className="h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Details (JSON/Text) */}
              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detail Skor / Aspek (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Contoh: Verbal=110, Performance=105... atau format JSON valid"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Masukkan rincian skor per aspek jika ada.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => router.back()}>
                  Batal
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Data'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    )
  }
