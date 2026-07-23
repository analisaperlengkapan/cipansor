import type { Locale } from "@/locales";

/**
 * BCP 47 tags for `Intl`. Arabic uses `ar-EG`, which renders Gregorian dates
 * with Arabic month names and Arabic-Indic digits (٢٠٢٦) — the shape the
 * Arabic prose on the site is already written in. `ar-SA` would switch to the
 * Hijri calendar and silently change the dates themselves.
 */
const INTL_TAG: Record<Locale, string> = {
  id: "id-ID",
  en: "en-GB",
  ar: "ar-EG",
};

export function intlTagFor(locale: Locale): string {
  return INTL_TAG[locale] ?? INTL_TAG.id;
}

/**
 * A figure for display inside running prose.
 *
 * Grouping is off: these are years and small counts ("1911", "5"), and
 * `1,911` — or `١٬٩١١` in Arabic — reads as a quantity rather than a year.
 */
export function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(intlTagFor(locale), {
    useGrouping: false,
  }).format(value);
}

/** Long-form date in the reader's locale, fixed to the pesantren's timezone. */
export function dateFormatterFor(locale: Locale): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(intlTagFor(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}
