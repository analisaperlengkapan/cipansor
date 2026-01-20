'use client';

import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
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
import { useSubjects } from '@/hooks';
import { useCreateQuestionBank } from '@/hooks/use-cbt';
import { useAuthStore } from '@/stores/auth';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const bankSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().optional(),
  subjectId: z.string().optional(),
});

type BankFormData = z.infer<typeof bankSchema>;

export default function NewQuestionBankPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const createBank = useCreateQuestionBank();
  const { data: subjects } = useSubjects();

  const form = useForm<BankFormData>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      title: '',
      description: '',
      subjectId: undefined,
    },
  });

  const onSubmit = async (data: BankFormData) => {
    if (!user) return;

    try {
      await createBank.mutateAsync({
        ...data,
        unitId: user.unitId || '',
        teacherId: user.id,
      });
      toast.success('Bank soal berhasil dibuat');
      router.push('/cbt/banks');
    } catch (error) {
      toast.error('Gagal membuat bank soal');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Buat Bank Soal Baru</h1>
            <p className="text-muted-foreground">
              Buat kumpulan soal baru untuk digunakan dalam ujian
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Bank Soal</CardTitle>
            <CardDescription>Isi detail bank soal</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul Bank Soal</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Bank Soal Matematika Kelas 7 - Bilangan Bulat" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mata Pelajaran (Opsional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih mata pelajaran" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects?.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Deskripsi singkat tentang bank soal ini"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={createBank.isPending}>
                    {createBank.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Simpan
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
