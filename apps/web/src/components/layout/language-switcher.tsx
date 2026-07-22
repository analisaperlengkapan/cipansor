"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/providers/i18n-provider";
import { LOCALES, LOCALE_LABELS } from "@/locales";
import { Check, Languages } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Header dropdown for switching the UI language (id / en / ar + RTL).
 *
 * `compact` shrinks the trigger from 40px to 32px for the public landing
 * header, whose row has only ~36px of slack between 1024px and 1279px — see
 * the measurement note in components/landing/navbar.tsx. The hit area stays
 * above the 24px minimum target size, and the app header keeps the full size.
 */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(compact && "h-8 w-8")}
          aria-label={t("common.language")}
          title={t("common.language")}
        >
          <Languages className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLocale(code)}
            className="flex items-center justify-between gap-4"
          >
            <span>{LOCALE_LABELS[code]}</span>
            {locale === code && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
