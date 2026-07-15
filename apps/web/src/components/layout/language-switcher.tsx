"use client";

import { useI18n } from "@/providers/i18n-provider";
import { Locale } from "@/locales";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const languages: { code: Locale; label: string; icon: string }[] = [
    { code: "id", label: "Bahasa Indonesia", icon: "🇮🇩" },
    { code: "en", label: "English", icon: "🇬🇧" },
    { code: "ar", label: "العربية", icon: "🇸🇦" },
  ];

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 h-9 px-3">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium hidden sm:inline">{currentLang.label}</span>
          <span className="text-sm sm:hidden">{currentLang.icon}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className="flex items-center justify-between cursor-pointer py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{lang.icon}</span>
              <span className="text-sm">{lang.label}</span>
            </div>
            {locale === lang.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
