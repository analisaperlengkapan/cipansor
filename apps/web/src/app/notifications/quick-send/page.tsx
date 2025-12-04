'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useCreateNotification,
  useSendNotification,
  useNotificationTemplates,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_PRIORITY_LABELS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_LABELS,
  RECIPIENT_TYPES,
  RECIPIENT_TYPE_LABELS,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  RecipientType,
} from '@/hooks/use-notifications';
import { useClasses } from '@/hooks/use-classes';
import { useUnits } from '@/hooks/use-units';
import { 
  Send, 
  MessageSquare,
  Mail,
  Phone,
  Bell,
  Users,
  Building2,
  GraduationCap,
  UserCheck,
  FileText,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle2,
  Loader2,
  History,
  FileCode
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const quickSendSchema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter'),
  message: z.string().min(10, 'Pesan minimal 10 karakter'),
  type: z.enum(['ANNOUNCEMENT', 'ATTENDANCE', 'FINANCE', 'ACADEMIC', 'PERMIT', 'HEALTH', 'VIOLATION', 'REWARD', 'SYSTEM']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  recipientType: z.enum(['ALL', 'UNIT', 'CLASS', 'ROLE', 'INDIVIDUAL']),
  unitId: z.string().optional(),
  classId: z.string().optional(),
  role: z.string().optional(),
});

type QuickSendForm = z.infer<typeof quickSendSchema>;

// Message templates for quick selection
const MESSAGE_TEMPLATES = [
  {
    id: 'payment-reminder',
    title: 'Pengingat Pembayaran SPP',
    message: 'Yth. Orang Tua/Wali,\n\nMohon untuk segera melakukan pembayaran SPP bulan ini sebelum tanggal jatuh tempo. Terima kasih.',
    type: 'FINANCE' as NotificationType,
  },
  {
    id: 'schedule-change',
    title: 'Perubahan Jadwal Pembelajaran',
    message: 'Diberitahukan bahwa terdapat perubahan jadwal pembelajaran. Silakan cek jadwal terbaru di aplikasi.',
    type: 'ACADEMIC' as NotificationType,
  },
  {
    id: 'holiday-notice',
    title: 'Pemberitahuan Libur',
    message: 'Diberitahukan kepada seluruh siswa dan orang tua bahwa sekolah akan libur pada [tanggal]. Kegiatan belajar mengajar akan kembali normal pada [tanggal].',
    type: 'ANNOUNCEMENT' as NotificationType,
  },
  {
    id: 'exam-schedule',
    title: 'Jadwal Ujian',
    message: 'Ujian akan dilaksanakan mulai tanggal [tanggal]. Mohon persiapkan diri dengan baik.',
    type: 'ACADEMIC' as NotificationType,
  },
  {
    id: 'meeting-invitation',
    title: 'Undangan Pertemuan Wali Murid',
    message: 'Mengundang Bapak/Ibu Wali Murid untuk hadir dalam pertemuan yang akan dilaksanakan pada [tanggal] pukul [waktu] di [tempat].',
    type: 'ANNOUNCEMENT' as NotificationType,
  },
  {
    id: 'health-notice',
    title: 'Pemberitahuan Kesehatan',
    message: 'Diberitahukan kepada seluruh wali murid untuk memperhatikan kondisi kesehatan anak. Mohon tidak mengirim anak jika sedang sakit.',
    type: 'HEALTH' as NotificationType,
  },
];

const CHANNEL_ICONS: Record<NotificationChannel, React.ReactNode> = {
  IN_APP: <Bell className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  SMS: <Phone className="h-4 w-4" />,
  PUSH: <Zap className="h-4 w-4" />,
  WHATSAPP: <MessageSquare className="h-4 w-4" />,
};

const RECIPIENT_ICONS: Record<RecipientType, React.ReactNode> = {
  ALL: <Users className="h-4 w-4" />,
  UNIT: <Building2 className="h-4 w-4" />,
  CLASS: <GraduationCap className="h-4 w-4" />,
  ROLE: <UserCheck className="h-4 w-4" />,
  INDIVIDUAL: <UserCheck className="h-4 w-4" />,
};

export default function QuickSendPage() {
  const [selectedChannels, setSelectedChannels] = useState<NotificationChannel[]>(['IN_APP']);
  const [isLoading, setIsLoading] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: units = [] } = useUnits();
  const { data: classesData } = useClasses({});
  const classes = classesData?.data || [];

  const createNotification = useCreateNotification();
  const sendNotification = useSendNotification();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<QuickSendForm>({
    resolver: zodResolver(quickSendSchema),
    defaultValues: {
      type: 'ANNOUNCEMENT',
      priority: 'NORMAL',
      recipientType: 'ALL',
    },
  });

  const recipientType = watch('recipientType');
  const selectedUnitId = watch('unitId');

  const filteredClasses = selectedUnitId 
    ? classes.filter((c: { unitId: string }) => c.unitId === selectedUnitId)
    : classes;

  const handleChannelToggle = (channel: NotificationChannel) => {
    setSelectedChannels(prev => 
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleTemplateSelect = (template: typeof MESSAGE_TEMPLATES[0]) => {
    setValue('title', template.title);
    setValue('message', template.message);
    setValue('type', template.type);
    toast.success('Template diterapkan');
  };

  const onSubmit = async (data: QuickSendForm) => {
    if (selectedChannels.length === 0) {
      toast.error('Pilih minimal satu channel pengiriman');
      return;
    }

    setIsLoading(true);
    setSendResult(null);

    try {
      // Create the notification
      const notification = await createNotification.mutateAsync({
        ...data,
        channels: selectedChannels,
        recipientIds: undefined, // Will be resolved by backend based on recipientType
      });

      // Send immediately
      await sendNotification.mutateAsync(notification.id);

      setSendResult({
        success: true,
        message: `Pesan berhasil dikirim ke ${RECIPIENT_TYPE_LABELS[data.recipientType]}`,
      });
      
      toast.success('Pesan berhasil dikirim!');
      
      // Reset form
      reset();
      setSelectedChannels(['IN_APP']);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal mengirim pesan';
      setSendResult({
        success: false,
        message,
      });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Send className="h-6 w-6 text-primary" />
              Kirim Pesan Cepat
            </h1>
            <p className="text-muted-foreground">
              Kirim pengumuman dan notifikasi ke siswa, orang tua, atau staff
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/notifications">
                <History className="h-4 w-4 mr-2" />
                Riwayat
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/notifications/templates">
                <FileCode className="h-4 w-4 mr-2" />
                Template
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Tulis Pesan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul Pesan *</Label>
                    <Input
                      id="title"
                      placeholder="Masukkan judul pesan..."
                      {...register('title')}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Isi Pesan *</Label>
                    <Textarea
                      id="message"
                      placeholder="Tulis pesan Anda di sini..."
                      rows={6}
                      {...register('message')}
                    />
                    {errors.message && (
                      <p className="text-sm text-red-500">{errors.message.message}</p>
                    )}
                  </div>

                  {/* Type & Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipe Notifikasi</Label>
                      <Select 
                        value={watch('type')} 
                        onValueChange={(value) => setValue('type', value as NotificationType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NOTIFICATION_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {NOTIFICATION_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Prioritas</Label>
                      <Select 
                        value={watch('priority')} 
                        onValueChange={(value) => setValue('priority', value as NotificationPriority)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NOTIFICATION_PRIORITIES.map(priority => (
                            <SelectItem key={priority} value={priority}>
                              {NOTIFICATION_PRIORITY_LABELS[priority]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Recipient Type */}
                  <div className="space-y-2">
                    <Label>Penerima</Label>
                    <RadioGroup
                      value={recipientType}
                      onValueChange={(value) => setValue('recipientType', value as RecipientType)}
                      className="grid grid-cols-2 md:grid-cols-5 gap-2"
                    >
                      {(['ALL', 'UNIT', 'CLASS'] as RecipientType[]).map(type => (
                        <Label
                          key={type}
                          htmlFor={`recipient-${type}`}
                          className={`
                            flex items-center gap-2 p-3 border rounded-lg cursor-pointer
                            ${recipientType === type ? 'border-primary bg-primary/5' : 'hover:bg-muted'}
                          `}
                        >
                          <RadioGroupItem value={type} id={`recipient-${type}`} />
                          {RECIPIENT_ICONS[type]}
                          <span className="text-sm">{RECIPIENT_TYPE_LABELS[type]}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Conditional: Unit Selection */}
                  {(recipientType === 'UNIT' || recipientType === 'CLASS') && (
                    <div className="space-y-2">
                      <Label>Pilih Unit</Label>
                      <Select 
                        value={selectedUnitId} 
                        onValueChange={(value) => setValue('unitId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih unit..." />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(unit => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Conditional: Class Selection */}
                  {recipientType === 'CLASS' && (
                    <div className="space-y-2">
                      <Label>Pilih Kelas</Label>
                      <Select 
                        value={watch('classId')} 
                        onValueChange={(value) => setValue('classId', value)}
                        disabled={!selectedUnitId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kelas..." />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredClasses.map(cls => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Channels */}
                  <div className="space-y-2">
                    <Label>Channel Pengiriman</Label>
                    <div className="flex flex-wrap gap-2">
                      {NOTIFICATION_CHANNELS.map(channel => (
                        <Button
                          key={channel}
                          type="button"
                          variant={selectedChannels.includes(channel) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleChannelToggle(channel)}
                          className="gap-2"
                        >
                          {CHANNEL_ICONS[channel]}
                          {NOTIFICATION_CHANNEL_LABELS[channel]}
                        </Button>
                      ))}
                    </div>
                    {selectedChannels.length === 0 && (
                      <p className="text-sm text-red-500">Pilih minimal satu channel</p>
                    )}
                  </div>

                  {/* Result Message */}
                  {sendResult && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 ${
                      sendResult.success 
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {sendResult.success ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                      {sendResult.message}
                    </div>
                  )}

                  {/* Submit */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        reset();
                        setSelectedChannels(['IN_APP']);
                        setSendResult(null);
                      }}
                    >
                      Reset
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Kirim Sekarang
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Right: Templates */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Template Cepat
                </CardTitle>
                <CardDescription>
                  Pilih template untuk mengisi pesan otomatis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {MESSAGE_TEMPLATES.map(template => (
                    <Button
                      key={template.id}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{template.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {template.message}
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        {NOTIFICATION_TYPE_LABELS[template.type]}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Info Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span>In-App: Langsung terkirim</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>Email: 1-5 menit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>SMS: 1-3 menit</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>WhatsApp: 1-2 menit</span>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  * Waktu pengiriman dapat bervariasi tergantung jumlah penerima
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
