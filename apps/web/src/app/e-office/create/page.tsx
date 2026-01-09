'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useCorrespondence } from '@/hooks/use-correspondence';
import { useTeachers } from '@/hooks/use-teachers';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
// import { MultiSelect } from '@/components/ui/multi-select';
import { LetterDirection, LetterUrgency, LetterNature, LetterStatus } from '@cipansor/shared';
import { toast } from 'sonner';

const letterSchema = z.object({
  direction: z.nativeEnum(LetterDirection),
  subject: z.string().min(1, 'Perihal wajib diisi'),
  date: z.string(),
  urgency: z.nativeEnum(LetterUrgency),
  nature: z.nativeEnum(LetterNature),
  senderName: z.string().optional(),
  senderInstance: z.string().optional(),
  recipientName: z.string().optional(),
  recipientInstance: z.string().optional(),
  content: z.string().optional(),
  reviewerIds: z.array(z.string()).optional(),
  recipientIds: z.array(z.string()).optional(),
});

export default function CreateLetterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createLetter } = useCorrespondence(user?.unitId);
  const { data: teachers } = useTeachers({
    page: 1,
    limit: 100,
    unitId: user?.unitId
  });

  const staffOptions = teachers?.data.map((t: any) => ({
    label: t.user?.name || t.nip,
    value: t.userId
  })) || [];

  const form = useForm<z.infer<typeof letterSchema>>({
    resolver: zodResolver(letterSchema),
    defaultValues: {
      direction: LetterDirection.OUTGOING,
      date: new Date().toISOString().split('T')[0],
      urgency: LetterUrgency.NORMAL,
      nature: LetterNature.PUBLIC,
      reviewerIds: [],
      recipientIds: [],
    },
  });

  const direction = form.watch('direction');

  async function onSubmit(values: z.infer<typeof letterSchema>) {
    if (!user?.unitId) {
      toast.error('Unit ID tidak ditemukan');
      return;
    }

    try {
      await createLetter.mutateAsync({
        ...values,
        unitId: user.unitId,
        status: LetterStatus.DRAFT,
      });
      toast.success('Surat berhasil dibuat');
      router.push('/e-office/inbox');
    } catch (error) {
      toast.error('Gagal membuat surat');
      console.error(error);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Buat Surat Baru</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Surat</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis surat" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LetterDirection.INCOMING}>Surat Masuk (Dari Luar)</SelectItem>
                        <SelectItem value={LetterDirection.OUTGOING}>Surat Keluar (Ke Luar)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perihal</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Undangan Rapat Wali Murid" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgensi</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={LetterUrgency.NORMAL}>Biasa</SelectItem>
                          <SelectItem value={LetterUrgency.IMMEDIATE}>Segera</SelectItem>
                          <SelectItem value={LetterUrgency.URGENT}>Amat Segera</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sifat</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={LetterNature.PUBLIC}>Biasa</SelectItem>
                          <SelectItem value={LetterNature.CONFIDENTIAL}>Rahasia</SelectItem>
                          <SelectItem value={LetterNature.STRICTLY_CONFIDENTIAL}>Sangat Rahasia</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Surat</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {direction === LetterDirection.OUTGOING && (
                <FormField
                  control={form.control}
                  name="reviewerIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pemeriksa & Penandatangan (Urut)</FormLabel>
                      <FormControl>
                        {/* Simple multiple select using standard Select for now as MultiSelect component is missing */}
                        <div className="space-y-2 border rounded-md p-4 max-h-48 overflow-y-auto">
                          {staffOptions.map((option: any) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                value={option.value}
                                checked={(field.value || []).includes(option.value)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, option.value]);
                                  } else {
                                    field.onChange(current.filter((val: string) => val !== option.value));
                                  }
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <label className="text-sm">{option.label}</label>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Pilih urutan pemeriksa (Paraf) hingga Penandatangan terakhir.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {direction === LetterDirection.INCOMING ? 'Asal & Tujuan' : 'Tujuan Surat'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {direction === LetterDirection.INCOMING && (
                <>
                  <FormField
                    control={form.control}
                    name="senderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Pengirim</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama Instansi / Perorangan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="senderInstance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instansi Pengirim</FormLabel>
                        <FormControl>
                          <Input placeholder="Dinas Pendidikan / Sekolah Lain" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Penerima</FormLabel>
                    <FormControl>
                      <Input placeholder="Kepada Yth..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientInstance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instansi Penerima</FormLabel>
                    <FormControl>
                      <Input placeholder="Alamat / Instansi Tujuan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Isi Surat</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ringkasan / Isi</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tuliskan isi ringkasan surat disini..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={createLetter.isPending}>
            {createLetter.isPending ? 'Menyimpan...' : 'Simpan Draft'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
