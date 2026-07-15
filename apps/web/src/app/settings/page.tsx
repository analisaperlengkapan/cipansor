"use client";

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
  Globe,
  Palette,
  Volume2,
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
import { useI18n } from "@/providers/i18n-provider";
import { Locale } from "@/locales";

// Types
type Theme = "light" | "dark" | "system";

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
  language: Locale;
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

export default function SettingsPage() {
  const { t, locale: globalLocale, setLocale: setGlobalLocale } = useI18n();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get active tab from URL or default to 'appearance'
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "users" ? "account" : tabParam || "appearance";

  const onTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("app-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          language: globalLocale, // Override local setting language with global locale
        });
      } catch {
        // Use default if parsing fails
      }
    } else {
      setSettings((prev) => ({ ...prev, language: globalLocale }));
    }
  }, [globalLocale]);

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
      // Save global locale
      setGlobalLocale(settings.language);
      toast.success(t("settings.appearance.toast_success", "Pengaturan berhasil disimpan"));
    } catch {
      toast.error(t("settings.appearance.toast_error", "Gagal menyimpan pengaturan"));
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
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" /> {t("settings.tabs.appearance")}
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" /> {t("settings.tabs.notifications")}
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" /> {t("settings.tabs.profile")}
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> {t("settings.tabs.account")}
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center gap-2">
            <Info className="h-4 w-4" /> {t("settings.tabs.about")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {t("settings.appearance.title")}
              </CardTitle>
              <CardDescription>
                {t("settings.appearance.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-3">
                <Label>{t("settings.appearance.theme")}</Label>
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
                      {t("settings.appearance.light")}
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
                      {t("settings.appearance.dark")}
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
                      {t("settings.appearance.system")}
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
                    {t("settings.appearance.language")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.appearance.languageDescription")}
                  </p>
                </div>
                <Select
                  value={settings.language}
                  onValueChange={(value: Locale) =>
                    setSettings((prev) => ({ ...prev, language: value }))
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">🇮🇩 Bahasa Indonesia</SelectItem>
                    <SelectItem value="en">🇬🇧 English</SelectItem>
                    <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Compact Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.appearance.compactMode")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.appearance.compactDescription")}
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
                {t("settings.notifications.title")}
              </CardTitle>
              <CardDescription>
                {t("settings.notifications.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.notifications.email")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.notifications.emailDescription")}
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
                  <Label>{t("settings.notifications.push")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.notifications.pushDescription")}
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
                <Label className="text-base">{t("settings.notifications.categories")}</Label>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-normal">{t("settings.notifications.attendance")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.notifications.attendanceDescription")}
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
                    <Label className="font-normal">{t("settings.notifications.finance")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.notifications.financeDescription")}
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
                    <Label className="font-normal">{t("settings.notifications.announcements")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.notifications.announcementsDescription")}
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
                    <Label className="font-normal">{t("settings.notifications.tahfidz")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.notifications.tahfidzDescription")}
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
                    {t("settings.notifications.sound")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.notifications.soundDescription")}
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
                {t("settings.profile.title")}
              </CardTitle>
              <CardDescription>{t("settings.profile.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("settings.profile.fullName")}</Label>
                  <div className="p-3 rounded-md bg-muted/50 border">
                    Dr. Ahmad Fauzi, M.Pd.
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.profile.email")}</Label>
                  <div className="p-3 rounded-md bg-muted/50 border">
                    admin@cipansor.id
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.profile.role")}</Label>
                  <div className="p-3 rounded-md bg-muted/50 border">
                    Super Admin
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.profile.unit")}</Label>
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
                {t("settings.account.title")}
              </CardTitle>
              <CardDescription>
                {t("settings.account.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-950/20 dark:border-yellow-900/50 dark:text-yellow-200">
                {t("settings.account.alert")}
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
                {t("settings.about.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">{t("settings.about.appName")}</Label>
                  <p className="font-medium">Cipansor Management System</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("settings.about.version")}</Label>
                  <p className="font-medium">1.0.0</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("settings.about.developer")}</Label>
                  <p className="font-medium">Yayasan Pesantren Cipansor</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    {t("settings.about.lastUpdate")}
                  </Label>
                  <p className="font-medium">
                    {new Date().toLocaleDateString(globalLocale === "ar" ? "ar-SA" : globalLocale === "en" ? "en-US" : "id-ID")}
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
            <>{t("common.saving")}</>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              {t("common.saveSettings")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
