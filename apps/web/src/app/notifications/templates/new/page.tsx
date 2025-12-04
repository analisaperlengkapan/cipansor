'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  useCreateNotificationTemplate,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_LABELS,
  type NotificationType,
  type NotificationChannel,
} from '@/hooks';
import { ArrowLeft, Loader2, Plus, X, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const formSchema = z.object({
  name: z.string().min(1, 'Nama template wajib diisi'),
  type: z.string().min(1, 'Tipe notifikasi wajib dipilih'),
  titleTemplate: z.string().min(1, 'Template judul wajib diisi'),
  messageTemplate: z.string().min(1, 'Template pesan wajib diisi'),
  channels: z.array(z.string()).min(1, 'Minimal pilih satu channel'),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

// Common variables for each notification type
const COMMON_VARIABLES: Record<string, string[]> = {
  ANNOUNCEMENT: ['{{nama_santri}}', '{{nama_kelas}}', '{{tanggal}}'],
  PAYMENT_REMINDER: ['{{nama_santri}}', '{{nama_tagihan}}', '{{jumlah}}', '{{jatuh_tempo}}'],
  ATTENDANCE: ['{{nama_santri}}', '{{tanggal}}', '{{status}}', '{{waktu}}'],
  ACADEMIC: ['{{nama_santri}}', '{{mata_pelajaran}}', '{{nilai}}', '{{semester}}'],
  HEALTH: ['{{nama_santri}}', '{{keluhan}}', '{{diagnosis}}', '{{tanggal_pemeriksaan}}'],
  PERMIT: ['{{nama_santri}}', '{{jenis_izin}}', '{{tanggal_mulai}}', '{{tanggal_selesai}}'],
  VIOLATION: ['{{nama_santri}}', '{{jenis_pelanggaran}}', '{{poin}}', '{{tanggal}}'],
  REWARD: ['{{nama_santri}}', '{{jenis_penghargaan}}', '{{poin}}', '{{tanggal}}'],
  OTHER: ['{{nama_santri}}', '{{pesan}}'],
};

export default function NewTemplatePage() {
  const router = useRouter();
  const createTemplate = useCreateNotificationTemplate();
  const [customVariable, setCustomVariable] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      titleTemplate: '',
      messageTemplate: '',
      channels: ['IN_APP'],
      isActive: true,
    },
  });

  const [variables, setVariables] = useState<string[]>([]);
  const selectedType = form.watch('type');

  const onSubmit = async (values: FormValues) => {
    try {
      await createTemplate.mutateAsync({
        ...values,
        type: values.type as NotificationType,
        channels: values.channels as NotificationChannel[],
        variables,
      });
      toast.success('Template berhasil dibuat');
      router.push('/notifications/templates');
    } catch {
      toast.error('Gagal membuat template');
    }
  };

  const addVariable = (variable: string) => {
    if (!variables.includes(variable)) {
      setVariables([...variables, variable]);
    }
  };

  const removeVariable = (variable: string) => {
    setVariables(variables.filter((v) => v !== variable));
  };

  const addCustomVariable = () => {
    if (customVariable && !variables.includes(`{{${customVariable}}}`)) {
      setVariables([...variables, `{{${customVariable}}}`]);
      setCustomVariable('');
    }
  };

  const insertVariableToMessage = (variable: string) => {
    const currentMessage = form.getValues('messageTemplate');
    form.setValue('messageTemplate', currentMessage + variable);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/notifications/templates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buat Template Baru</h1>
          <p className="text-muted-foreground">Buat template notifikasi otomatis</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Template</CardTitle>
                  <CardDescription>Detail dasar template notifikasi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Template</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Pengingat Pembayaran SPP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipe Notifikasi</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tipe notifikasi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {NOTIFICATION_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {NOTIFICATION_TYPE_LABELS[type]}
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
                    name="titleTemplate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Judul</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: Pengingat Pembayaran {{nama_tagihan}}"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Gunakan variabel dengan format {'{{nama_variabel}}'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="messageTemplate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Pesan</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Contoh: Assalamu'alaikum, Bapak/Ibu {{nama_santri}}. Kami ingatkan bahwa tagihan {{nama_tagihan}} sebesar {{jumlah}} jatuh tempo pada {{jatuh_tempo}}."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Klik variabel di panel kanan untuk menyisipkan
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="channels"
                    render={() => (
                      <FormItem>
                        <FormLabel>Channel Pengiriman</FormLabel>
                        <div className="space-y-2">
                          {NOTIFICATION_CHANNELS.map((channel) => (
                            <FormField
                              key={channel}
                              control={form.control}
                              name="channels"
                              render={({ field }) => {
                                const currentValue = Array.isArray(field.value) ? field.value : [];
                                return (
                                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={currentValue.includes(channel)}
                                        onCheckedChange={(checked) => {
                                          const newValue = checked
                                            ? [...currentValue, channel]
                                            : currentValue.filter((v: string) => v !== channel);
                                          field.onChange(newValue);
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {NOTIFICATION_CHANNEL_LABELS[channel]}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Status Aktif</FormLabel>
                          <FormDescription>
                            Template aktif dapat digunakan untuk notifikasi otomatis
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Variables Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Variabel Template
                  </CardTitle>
                  <CardDescription>
                    Klik untuk menyisipkan ke pesan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedType && COMMON_VARIABLES[selectedType] && (
                    <div>
                      <p className="text-sm font-medium mb-2">Variabel Umum:</p>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_VARIABLES[selectedType].map((variable) => (
                          <Badge
                            key={variable}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => {
                              insertVariableToMessage(variable);
                              addVariable(variable);
                            }}
                          >
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium mb-2">Variabel Digunakan:</p>
                    {variables.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {variables.map((variable) => (
                          <Badge
                            key={variable}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeVariable(variable)}
                          >
                            {variable}
                            <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Belum ada variabel</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Tambah Variabel Kustom:</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="nama_variabel"
                        value={customVariable}
                        onChange={(e) => setCustomVariable(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomVariable();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={addCustomVariable}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
                    <p className="font-semibold text-sm">
                      {form.watch('titleTemplate') || 'Judul notifikasi...'}
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {form.watch('messageTemplate') || 'Isi pesan notifikasi...'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/notifications/templates">Batal</Link>
            </Button>
            <Button type="submit" disabled={createTemplate.isPending}>
              {createTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Template
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
