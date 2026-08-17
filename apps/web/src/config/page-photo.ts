import { galleryItems } from "./site";
import { siteTextFor } from "./site.i18n";
import type { Locale } from "@/locales";

/**
 * Pick one photograph out of the gallery for a page to lead with.
 *
 * Pages name their own photograph rather than reading it from a central
 * route→image table: which picture belongs at the top of /wakaf-infaq is a
 * judgement about that page, and it should be readable in that page's source
 * instead of in a lookup two directories away.
 *
 * The alt text follows the visitor's locale, so a photograph carries the same
 * description on the gallery page and wherever else it appears.
 */
export function galleryPhoto(
  albumSlug: string,
  index: number,
  locale: Locale,
): { src: string; alt: string } {
  const album = galleryItems.find((a) => a.slug === albumSlug);
  const photo = album?.photos[index];
  if (!album || !photo) {
    throw new Error(
      `No gallery photo at ${albumSlug}[${index}]. Albums: ${galleryItems
        .map((a) => `${a.slug}(${a.photos.length})`)
        .join(", ")}`,
    );
  }
  const alt = siteTextFor(locale).galleryAlts[albumSlug]?.[index] ?? photo.alt;
  return { src: photo.src, alt };
}
