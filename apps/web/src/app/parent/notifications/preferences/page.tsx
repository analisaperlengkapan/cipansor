"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  MessageSquare,
  Mail,
  Smartphone,
  Check,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  useWhatsAppStatus,
  useNotificationPreferences,
  useUpdateNotificationPreference,
} from "@/hooks/use-whatsapp";

// Notification categories for parent portal
const NOTIFICATION_CATEGORIES = [
  {
    id: "daily_report",
    label: "Laporan Harian",
    description: "Notifikasi aktivitas anak setiap hari",
    icon: "📋",
  },
  {
    id: "attendance",
    label: "Kehadiran",
    description: "Alert ketidakhadiran atau keterlambatan",
    icon: "📍",
  },
  {
    id: "payment",
    label: "Pembayaran",
    description: "Tagihan dan pengingat pembayaran",
    icon: "💰",
  },
  {
    id: "tahfidz",
    label: "Progress Tahfidz",
    description: "Update hafalan Al-Quran",
    icon: "📖",
  },
  {
    id: "violation",
    label: "Pelanggaran",
    description: "Notifikasi pelanggaran tata tertib",
    icon: "⚠️",
  },
  {
    id: "announcement",
    label: "Pengumuman",
    description: "Info penting dari sekolah",
    icon: "📢",
  },
  {
    id: "report_card",
    label: "Rapor",
    description: "Notifikasi rapor terbit",
    icon: "📄",
  },
  {
    id: "event",
    label: "Kegiatan",
    description: "Reminder acara dan kegiatan",
    icon: "📅",
  },
];

export default function NotificationPreferencesPage() {
  const {
    data: waStatus,
    isLoading: loadingStatus,
    refetch: refetchStatus,
  } = useWhatsAppStatus();
  const { data: preferences, isLoading: loadingPrefs } =
    useNotificationPreferences();
  const updatePreference = useUpdateNotificationPreference();

  const handleToggle = async (prefId: string, enabled: boolean) => {
    try {
      await updatePreference.mutateAsync({ id: prefId, enabled });
      toast.success("Preferensi berhasil diperbarui");
    } catch {
      toast.error("Gagal memperbarui preferensi");
    }
  };

  const getPreferenceForCategory = (category: string, channel: string) => {
    return preferences?.find(
      (p) => p.category === category && p.channel === channel,
    );
  };

  return (
    <MainLayout allowedRoles={["PARENT", "SUPER_ADMIN", "UNIT_ADMIN"]}>
      <div className="space-y-6">
        <PageHeader
          title="Pengaturan Notifikasi"
          description="Kelola preferensi notifikasi untuk berbagai kanal"
        />

        {/* WhatsApp Status Card */}
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">WhatsApp</CardTitle>
                  <CardDescription>Status integrasi WhatsApp</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {loadingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : waStatus?.configured ? (
                  <Badge className="bg-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    Aktif
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    Tidak Aktif
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchStatus()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {waStatus && (
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Provider:{" "}
                <span className="font-medium">{waStatus.provider}</span>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Notification Preferences */}
        <Tabs defaultValue="whatsapp" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger value="push" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Push</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">SMS</span>
            </TabsTrigger>
          </TabsList>

          {["whatsapp", "push", "email", "sms"].map((channel) => (
            <TabsContent key={channel} value={channel}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    Notifikasi{" "}
                    {channel === "whatsapp"
                      ? "WhatsApp"
                      : channel === "push"
                        ? "Push"
                        : channel === "email"
                          ? "Email"
                          : "SMS"}
                  </CardTitle>
                  <CardDescription>
                    Pilih jenis notifikasi yang ingin Anda terima
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPrefs ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {NOTIFICATION_CATEGORIES.map((cat) => {
                        const pref = getPreferenceForCategory(
                          cat.id,
                          channel.toUpperCase(),
                        );
                        return (
                          <div
                            key={cat.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{cat.icon}</span>
                              <div>
                                <p className="font-medium">{cat.label}</p>
                                <p className="text-sm text-muted-foreground">
                                  {cat.description}
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={pref?.enabled ?? true}
                              onCheckedChange={(checked) => {
                                if (pref) {
                                  handleToggle(pref.id, checked);
                                }
                              }}
                              disabled={!pref || updatePreference.isPending}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
}
