import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/locales";

/**
 * The active locale, for server components.
 *
 * The public pages (beranda, profil, kontak, berita, unit) are server
 * components, so they cannot call `useI18n` — that hook is client-only. They
 * read the same `app-locale` cookie the root layout already reads to stamp
 * `<html lang dir>`, which keeps one source of truth and means the first paint
 * is in the right language with no hydration flash.
 *
 * Falls back to Indonesian for an absent or unrecognised cookie.
 */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : "id";
}
