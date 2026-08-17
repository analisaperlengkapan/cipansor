import type { Metadata } from "next";
import Image from "next/image";
import { PublicPage } from "@/components/landing/public-page";
import { siteConfig, galleryItems, galleryThumb } from "@/config/site";
import { pagesContentFor } from "@/config/pages.i18n";
import { siteTextFor } from "@/config/site.i18n";
import { getServerLocale } from "@/lib/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  const copy = pagesContentFor(await getServerLocale()).gallery;
  return {
    title: `${copy.title} — ${siteConfig.legalName}`,
    description: copy.metaDescription,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: "/galeri" },
    openGraph: {
      title: copy.title,
      description: copy.metaDescription,
      images: [{ url: galleryItems[0].image }],
    },
  };
}

/**
 * The pesantren's photographic record, all three albums on one page.
 *
 * Deliberately no lightbox. Each thumbnail is an ordinary link to the
 * full-size file, so the page needs no client JavaScript, works with keyboard
 * and screen reader for free, and lets a visitor open a photograph in a new
 * tab — which is what someone verifying that these are real photographs of a
 * real place will want to do.
 */
export default async function GaleriPage() {
  const locale = await getServerLocale();
  const copy = pagesContentFor(locale).gallery;
  const site = siteTextFor(locale);

  return (
    <PublicPage
      title={copy.title}
      lead={copy.lead}
      breadcrumb={[{ label: copy.title, href: "/galeri" }]}
    >
      <div className="space-y-16">
        {galleryItems.map((album) => {
          const alts = site.galleryAlts[album.slug] ?? [];
          return (
            <section key={album.slug} aria-labelledby={`album-${album.slug}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-3">
                <h2
                  id={`album-${album.slug}`}
                  className="text-2xl font-semibold tracking-tight text-balance"
                >
                  {site.gallery[album.slug] ?? album.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {copy.photoCount(album.photos.length)}
                </p>
              </div>

              <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {album.photos.map((photo, i) => {
                  // The Indonesian alt in the data is the fallback: it
                  // describes the photograph correctly even if a locale's
                  // array is ever short.
                  const alt = alts[i] ?? photo.alt;
                  return (
                    <li key={photo.src}>
                      <figure className="h-full overflow-hidden rounded-lg border border-border bg-card">
                        <a
                          href={photo.src}
                          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="relative block aspect-[3/2]">
                            <Image
                              src={galleryThumb(photo.src)}
                              alt={alt}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover transition-transform duration-300 hover:scale-105"
                            />
                          </span>
                        </a>
                        <figcaption className="p-4 text-sm leading-relaxed text-muted-foreground">
                          {alt}
                        </figcaption>
                      </figure>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </PublicPage>
  );
}
