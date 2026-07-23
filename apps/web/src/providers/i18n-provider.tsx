"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  translations,
  resolvePath,
  dirFor,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
  type TranslationPath,
} from "@/locales";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Typed translate: `t("common.save")`. Falls back id → key path. */
  t: (path: TranslationPath, fallback?: string) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

/**
 * SSR-aware i18n provider.
 *
 * The root layout (a server component) reads the `app-locale` cookie and
 * passes it as `initialLocale`, and stamps `<html lang dir>` server-side —
 * so the first paint is already in the right language/direction (no
 * hydration flash, no RTL layout shift). This provider only handles
 * client-side switching afterwards.
 */
export function I18nProvider({
  children,
  initialLocale = "id",
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    isLocale(initialLocale) ? initialLocale : "id",
  );
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      if (!isLocale(next)) return;
      setLocaleState(next);
      // Persist for the server (root layout reads this cookie) — 1 year.
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      // Update the live document so the current page flips immediately.
      document.documentElement.lang = next;
      document.documentElement.dir = dirFor(next);
      // Re-render the server components with the new cookie.
      //
      // This state only reaches client components. The public pages (beranda,
      // profil, unit, ...) are server components that read the cookie through
      // lib/server-locale.ts, and a server component does not re-run because a
      // client one set state — so without this the chrome switched language
      // while the article underneath it stayed Indonesian until a manual
      // reload. `refresh()` refetches the RSC payload, now carrying the cookie
      // just written, and keeps client state and scroll position intact.
      router.refresh();
    },
    [router],
  );

  const t = useCallback(
    (path: TranslationPath, fallback?: string): string => {
      return (
        resolvePath(translations[locale], path) ??
        // Missing key in the active locale → fall back to Indonesian,
        // then to the explicit fallback, then to the path itself so the
        // gap is visible instead of rendering an empty string.
        resolvePath(translations.id, path) ??
        fallback ??
        path
      );
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, dir: dirFor(locale) }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside <I18nProvider>");
  }
  return ctx;
}
