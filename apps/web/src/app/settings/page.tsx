"use client";
import { MainLayout } from "@/components/layout";

/**
 * Settings Page
 * Application settings - appearance, notifications, preferences
 */

import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Bell,
  BellOff,
  Globe,
  Palette,
  Volume2,
  Shield,
  Info,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Types
type Theme = "light" | "dark" | "system";
type Language = "id" | "en" | "ar";

interface NotificationSettings {
  email: boolean;
  push: boolean;
  attendance: boolean;
  finance: boolean;
  announcements: boolean;
  tahfidz: boolean;
}

interface AppSettings {
  theme: Theme;
  language: Language;
  notifications: NotificationSettings;
  soundEnabled: boolean;
  compactMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  language: "id",
  notifications: {
    email: true,
    push: true,
    attendance: true,
    finance: true,
    announcements: true,
    tahfidz: true,
  },
  soundEnabled: true,
  compactMode: false,
};

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock } from "lucide-react";
import { useI18n } from "@/providers/i18n-provider";

function SettingsPageContent() {
  const { locale, setLocale } = useI18n();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get active tab from URL or default to 'appearance'
  // Map 'users' to 'account' if needed, or just keep 'account'
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "users" ? "account" : tabParam || "appearance";

  const onTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Load settings from localStorage. The language field is owned by the
  // i18n provider (app-locale cookie) — it wins over any stale saved value.
  useEffect(() => {
    const savedSettings = localStorage.getItem("app-settings");
    if (savedSettings) {
      try {
        setSettings({ ...JSON.parse(savedSettings), language: locale });
      } catch {
        // Use default if parsing fails
      }
    } else {
      setSettings((prev) => ({ ...prev, language: locale }));
    }
  }, [locale]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;

    if (settings.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.remove("light", "dark");
      root.classList.add(systemTheme);
    } else {
      root.classList.remove("light", "dark");
      root.classList.add(settings.theme);
    }
  }, [settings.theme]);

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("app-settings", JSON.stringify(settings));
      toast.success("Pengaturan berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

  // Update nested settings
  const updateNotificationSetting = (
    key: keyof NotificationSettings,
    value: boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola preferensi dan pengaturan aplikasi
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" /> Tampilan
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" /> Notifikasi
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Profil
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> Akun
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center gap-2">
            <Info className="h-4 w-4" /> Tentang
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Tampilan
              </CardTitle>
              <CardDescription>
                Sesuaikan tampilan aplikasi sesuai preferensi Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-3">
                <Label>Tema</Label>
                <RadioGroup
                  value={settings.theme}
                  onValueChange={(value: Theme) =>
                    setSettings((prev) => ({ ...prev, theme: value }))
                  }
                  className="grid grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="light"
                      id="light"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="light"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Sun className="mb-3 h-6 w-6" />
                      Terang
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="dark"
                      id="dark"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="dark"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Moon className="mb-3 h-6 w-6" />
                      Gelap
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="system"
                      id="system"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="system"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Monitor className="mb-3 h-6 w-6" />
                      Sistem
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Language Selection */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Bahasa
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Pilih bahasa untuk antarmuka aplikasi
                  </p>
                </div>
                <Select
                  value={settings.language}
                  onValueChange={(value: Language) => {
                    setSettings((prev) => ({ ...prev, language: value }));
                    // Apply immediately app-wide (cookie + <html lang/dir>).
                    setLocale(value);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">Bahasa Indonesia</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Compact Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mode Compact</Label>
                  <p className="text-sm text-muted-foreground">
                    Tampilkan lebih banyak konten dengan ukuran lebih kecil
                  </p>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, compactMode: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifikasi
              </CardTitle>
              <CardDescription>
                Kelola preferensi notifikasi yang ingin Anda terima
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifikasi Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Terima notifikasi melalui email
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) =>
                    updateNotificationSetting("email", checked)
                  }
                />
              </div>

              <Separator />

              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifikasi Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Terima notifikasi push di browser
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) =>
                    updateNotificationSetting("push", checked)
                  }
                />
              </div>

              <Separator />

              {/* Notification Categories */}
              <div className="space-y-4">
                <Label className="text-base">Kategori Notifikasi</Label>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-normal">Kehadiran</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifikasi kehadiran santri
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.attendance}
                    onCheckedChange={(checked) =>
                      updateNotificationSetting("attendance", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-normal">Keuangan</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifikasi tagihan dan pembayaran
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.finance}
                    onCheckedChange={(checked) =>
                      updateNotificationSetting("finance", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-normal">Pengumuman</Label>
                    <p className="text-sm text-muted-foreground">
                      Pengumuman dari pesantren
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.announcements}
                    onCheckedChange={(checked) =>
                      updateNotificationSetting("announcements", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-normal">Tahfidz</Label>
                    <p className="text-sm text-muted-foreground">
                      Progress hafalan santri
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.tahfidz}
                    onCheckedChange={(checked) =>
                      updateNotificationSetting("tahfidz", checked)
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Sound */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Suara Notifikasi
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mainkan suara saat menerima notifikasi
                  </p>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, soundEnabled: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profil Pengguna
              </CardTitle>
              <CardDescription>Kelola informasi profil Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <div className="p-3 rounded-md bg-muted/50 border">
                    Dr. Ahmad Fauzi, M.Pd.
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="p-3 rounded-md bg-muted/50 border">
                    admin@cipansor.or.id
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Peran</Label>
                  <div className="p-3 rounded-md bg-muted/50 border">
                    Super Admin
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <div className="p-3 rounded-md bg-muted/50 border">
                    SMA Al-Qur'an Cipansor
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Keamanan Akun
              </CardTitle>
              <CardDescription>
                Update password dan keamanan akun
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">
                Fitur keamanan akun dikelola oleh administrator pusat. Hubungi
                IT Support untuk reset password.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Tentang Aplikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Nama Aplikasi</Label>
                  <p className="font-medium">Cipansor Management System</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Versi</Label>
                  <p className="font-medium">1.0.0</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Developer</Label>
                  <p className="font-medium">Yayasan Pesantren Cipansor</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Terakhir Update
                  </Label>
                  <p className="font-medium">
                    {new Date().toLocaleDateString("id-ID")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? (
            <>Menyimpan...</>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Simpan Pengaturan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPageWithShell() {
  return (
    <MainLayout>
      <SettingsPageContent />
    </MainLayout>
  );
}
