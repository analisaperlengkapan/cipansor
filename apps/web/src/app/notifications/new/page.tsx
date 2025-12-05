'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  useCreateNotification,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_PRIORITY_LABELS,
  RECIPIENT_TYPES,
  RECIPIENT_TYPE_LABELS,
  NOTIFICATION_CHANNELS,
  type NotificationType,
  type NotificationPriority,
  type RecipientType,
  type NotificationChannel,
} from '@/hooks';
import { useClasses } from '@/hooks/use-classes';
import { useUnits } from '@/hooks/use-units';
import { useState } from 'react';

const priorities: NotificationPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  message: z.string().min(1, 'Pesan wajib diisi'),
  type: z.string().min(1, 'Tipe wajib dipilih'),
  priority: z.string().min(1, 'Prioritas wajib dipilih'),
  recipientType: z.string().min(1, 'Tipe penerima wajib dipilih'),
  recipientIds: z.array(z.string()).optional(),
  channels: z.array(z.string()).min(1, 'Minimal pilih 1 channel'),
  scheduledAt: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewNotificationPage() {
  const router = useRouter();
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  const createNotification = useCreateNotification();
  const { data: classes } = useClasses({ limit: 100 });
  const { data: units } = useUnits();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      message: '',
      type: '',
      priority: 'NORMAL',
      recipientType: '',
      recipientIds: [],
      channels: ['IN_APP'],
      scheduledAt: '',
    },
  });

  const recipientType = form.watch('recipientType');

  const onSubmit = async (data: FormData) => {
    let recipientIds: string[] = [];
    
    if (data.recipientType === 'CLASS') {
      recipientIds = selectedClasses;
    } else if (data.recipientType === 'UNIT') {
      recipientIds = selectedUnits;
    }

    try {
      await createNotification.mutateAsync({
        ...data,
        type: data.type as NotificationType,
        priority: data.priority as NotificationPriority,
        recipientType: data.recipientType as RecipientType,
        recipientIds: recipientIds.length > 0 ? recipientIds : undefined,
        channels: data.channels as NotificationChannel[],
        scheduledAt: data.scheduledAt || undefined,
      });
      toast.success('Notifikasi berhasil dibuat');
      router.push('/notifications');
    } catch {
      toast.error('Gagal membuat notifikasi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/notifications">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buat Notifikasi</h1>
          <p className="text-muted-foreground">Kirim notifikasi ke pengguna</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Notification Content */}
            <Card>
              <CardHeader>
                <CardTitle>Konten Notifikasi</CardTitle>
                <CardDescription>Isi pesan notifikasi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul</FormLabel>
                      <FormControl>
                        <Input placeholder="Pengumuman Penting" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pesan</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Isi pesan notifikasi..."
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipe</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tipe" />
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
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioritas</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih prioritas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {priorities.map((priority) => (
                              <SelectItem key={priority} value={priority}>
                                {NOTIFICATION_PRIORITY_LABELS[priority]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recipients & Channels */}
            <Card>
              <CardHeader>
                <CardTitle>Penerima & Channel</CardTitle>
                <CardDescription>Tentukan target penerima notifikasi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="recipientType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Penerima</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe penerima" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RECIPIENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {RECIPIENT_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {recipientType === 'CLASS' && (
                  <div className="space-y-2">
                    <FormLabel>Pilih Kelas</FormLabel>
                    <div className="max-h-[200px] overflow-auto space-y-2 border rounded-md p-3">
                      {classes?.data.map((cls) => (
                        <label key={cls.id} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedClasses.includes(cls.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedClasses([...selectedClasses, cls.id]);
                              } else {
                                setSelectedClasses(selectedClasses.filter((id) => id !== cls.id));
                              }
                            }}
                          />
                          <span className="text-sm">{cls.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {recipientType === 'UNIT' && (
                  <div className="space-y-2">
                    <FormLabel>Pilih Unit</FormLabel>
                    <div className="max-h-[200px] overflow-auto space-y-2 border rounded-md p-3">
                      {units?.map((unit) => (
                        <label key={unit.id} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedUnits.includes(unit.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUnits([...selectedUnits, unit.id]);
                              } else {
                                setSelectedUnits(selectedUnits.filter((id) => id !== unit.id));
                              }
                            }}
                          />
                          <span className="text-sm">{unit.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="channels"
                  render={() => (
                    <FormItem>
                      <FormLabel>Channel</FormLabel>
                      <div className="space-y-2">
                        {NOTIFICATION_CHANNELS.map((channel) => (
                          <FormField
                            key={channel}
                            control={form.control}
                            name="channels"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(channel)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, channel]);
                                      } else {
                                        field.onChange(current.filter((c) => c !== channel));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="mt-0! font-normal">
                                  {channel === 'IN_APP' && 'Notifikasi Aplikasi'}
                                  {channel === 'EMAIL' && 'Email'}
                                  {channel === 'WHATSAPP' && 'WhatsApp'}
                                  {channel === 'SMS' && 'SMS'}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jadwalkan (Opsional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormDescription>
                        Kosongkan untuk kirim sekarang
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/notifications">Batal</Link>
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={createNotification.isPending}
              onClick={() => {
                // Save as draft
              }}
            >
              Simpan Draft
            </Button>
            <Button type="submit" disabled={createNotification.isPending}>
              {createNotification.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kirim Notifikasi
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
