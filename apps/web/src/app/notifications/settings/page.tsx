"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Banknote,
  UserCheck,
  GraduationCap,
  BookOpen,
  Megaphone,
  Calendar,
  FileText,
  Moon,
  RefreshCw,
  Save,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  paymentReminders: boolean;
  attendanceAlerts: boolean;
  academicUpdates: boolean;
  tahfidzProgress: boolean;
  announcements: boolean;
  eventReminders: boolean;
  monthlyReports: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  reminderFrequency: "DAILY" | "WEEKLY" | "NONE";
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  userId: "",
  emailEnabled: true,
  smsEnabled: false,
  whatsappEnabled: true,
  pushEnabled: true,
  inAppEnabled: true,
  paymentReminders: true,
  attendanceAlerts: true,
  academicUpdates: true,
  tahfidzProgress: true,
  announcements: true,
  eventReminders: true,
  monthlyReports: true,
  quietHoursStart: null,
  quietHoursEnd: null,
  reminderFrequency: "DAILY",
};

const CHANNEL_CONFIG = [
  {
    key: "emailEnabled",
    label: "Email",
    icon: Mail,
    description: "Terima notifikasi via email",
  },
  {
    key: "smsEnabled",
    label: "SMS",
    icon: Smartphone,
    description: "Terima notifikasi via SMS",
  },
  {
    key: "whatsappEnabled",
    label: "WhatsApp",
    icon: MessageSquare,
    description: "Terima notifikasi via WhatsApp",
  },
  {
    key: "pushEnabled",
    label: "Push",
    icon: Bell,
    description: "Notifikasi browser/mobile",
  },
  {
    key: "inAppEnabled",
    label: "In-App",
    icon: Bell,
    description: "Notifikasi dalam aplikasi",
  },
];

const NOTIFICATION_TYPES = [
  {
    key: "paymentReminders",
    label: "Pengingat Pembayaran",
    icon: Banknote,
    description: "Tagihan dan jatuh tempo",
  },
  {
    key: "attendanceAlerts",
    label: "Alert Kehadiran",
    icon: UserCheck,
    description: "Status kehadiran santri",
  },
  {
    key: "academicUpdates",
    label: "Update Akademik",
    icon: GraduationCap,
    description: "Nilai dan progress pembelajaran",
  },
  {
    key: "tahfidzProgress",
    label: "Progress Tahfidz",
    icon: BookOpen,
    description: "Perkembangan hafalan Al-Quran",
  },
  {
    key: "announcements",
    label: "Pengumuman",
    icon: Megaphone,
    description: "Pengumuman dari sekolah",
  },
  {
    key: "eventReminders",
    label: "Pengingat Kegiatan",
    icon: Calendar,
    description: "Kegiatan dan acara mendatang",
  },
  {
    key: "monthlyReports",
    label: "Laporan Bulanan",
    icon: FileText,
    description: "Ringkasan bulanan santri",
  },
];

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current preferences
  const { isLoading, data: fetchedPreferences } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      // In production, this would fetch from API
      return DEFAULT_PREFERENCES;
    },
  });

  useEffect(() => {
    if (fetchedPreferences) {
      setPreferences(fetchedPreferences);
    }
  }, [fetchedPreferences]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      // In production, this would call the API
      await new Promise((resolve) => setTimeout(resolve, 500));
      return prefs;
    },
    onSuccess: () => {
      toast.success("Pengaturan notifikasi berhasil disimpan");
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
    onError: () => {
      toast.error("Gagal menyimpan pengaturan");
    },
  });

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
    setHasChanges(true);
  };

  const handleFrequencyChange = (value: string) => {
    setPreferences((prev) => ({
      ...prev,
      reminderFrequency: value as "DAILY" | "WEEKLY" | "NONE",
    }));
    setHasChanges(true);
  };

  const handleReset = () => {
    setPreferences(DEFAULT_PREFERENCES);
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(preferences);
  };

  const enabledChannelCount = CHANNEL_CONFIG.filter(
    (c) => preferences[c.key as keyof NotificationPreferences],
  ).length;

  const enabledTypeCount = NOTIFICATION_TYPES.filter(
    (t) => preferences[t.key as keyof NotificationPreferences],
  ).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/notifications">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <PageHeader
              title="Pengaturan Notifikasi"
              description="Kelola preferensi notifikasi Anda"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Channel Aktif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {enabledChannelCount} / {CHANNEL_CONFIG.length}
              </div>
              <p className="text-xs text-muted-foreground">
                metode pengiriman diaktifkan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Jenis Notifikasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {enabledTypeCount} / {NOTIFICATION_TYPES.length}
              </div>
              <p className="text-xs text-muted-foreground">
                jenis notifikasi diaktifkan
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Email Integration Status & Configuration Banner */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Mail className="h-5 w-5" />
              Integrasi Server Email Google Workspace (Cipansor SMTP)
            </CardTitle>
            <CardDescription>
              Informasi konfigurasi server email resmi Yayasan Pesantren Cipansor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-md border bg-background p-3">
                <span className="text-xs text-muted-foreground block">Email Server (From):</span>
                <strong className="font-medium text-foreground">noreply@cipansor.or.id</strong>
                <span className="text-xs text-muted-foreground block mt-1">Pengirim Otomatis Sistem</span>
              </div>
              <div className="rounded-md border bg-background p-3">
                <span className="text-xs text-muted-foreground block">Helpesk / Kanal Tanya Jawab (Reply-To):</span>
                <strong className="font-medium text-foreground">halo@cipansor.or.id</strong>
                <span className="text-xs text-muted-foreground block mt-1">Tujuan Balasan Email Otomatis</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-2 border-t">
              <span>Server Host: <code>smtp.gmail.com:587 (TLS/STARTTLS)</code></span>
              <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">
                Terintegrasi &amp; Terverifikasi
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Channel Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Channel Notifikasi
            </CardTitle>
            <CardDescription>
              Pilih metode pengiriman notifikasi yang Anda inginkan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {CHANNEL_CONFIG.map((channel) => {
              const Icon = channel.icon;
              const isEnabled =
                preferences[channel.key as keyof NotificationPreferences];

              return (
                <div
                  key={channel.key}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${isEnabled ? "bg-primary/10" : "bg-muted"}`}
                    >
                      <Icon
                        className={`h-5 w-5 ${isEnabled ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </div>
                    <div>
                      <Label className="font-medium">{channel.label}</Label>
                      <p className="text-sm text-muted-foreground">
                        {channel.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled as boolean}
                    onCheckedChange={() =>
                      handleToggle(channel.key as keyof NotificationPreferences)
                    }
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Notification Type Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Jenis Notifikasi
            </CardTitle>
            <CardDescription>
              Pilih jenis notifikasi yang ingin Anda terima
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {NOTIFICATION_TYPES.map((type) => {
              const Icon = type.icon;
              const isEnabled =
                preferences[type.key as keyof NotificationPreferences];

              return (
                <div
                  key={type.key}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${isEnabled ? "bg-primary/10" : "bg-muted"}`}
                    >
                      <Icon
                        className={`h-5 w-5 ${isEnabled ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </div>
                    <div>
                      <Label className="font-medium">{type.label}</Label>
                      <p className="text-sm text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled as boolean}
                    onCheckedChange={() =>
                      handleToggle(type.key as keyof NotificationPreferences)
                    }
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Frequency & Timing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Frekuensi & Waktu
            </CardTitle>
            <CardDescription>Atur frekuensi pengingat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Frekuensi Pengingat</Label>
                <p className="text-sm text-muted-foreground">
                  Seberapa sering menerima ringkasan
                </p>
              </div>
              <Select
                value={preferences.reminderFrequency}
                onValueChange={handleFrequencyChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Harian</SelectItem>
                  <SelectItem value="WEEKLY">Mingguan</SelectItem>
                  <SelectItem value="NONE">Tidak Ada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Unsaved Changes Banner */}
        {hasChanges && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <Badge variant="secondary" className="px-4 py-2 shadow-lg">
              Ada perubahan yang belum disimpan
            </Badge>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
