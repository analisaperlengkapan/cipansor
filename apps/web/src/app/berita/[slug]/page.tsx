import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PublicPage, ContentBlocks } from "@/components/landing/public-page";
import { articles, getArticle } from "@/config/content";
import { siteConfig } from "@/config/site";
import { pagesContentFor } from "@/config/pages.i18n";
import { newsTextFor } from "@/config/news.i18n";
import { getServerLocale } from "@/lib/server-locale";
import { dateFormatterFor } from "@/lib/locale-format";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

/**
 * Articles are a closed set in `content.ts`. As in `unit/[slug]/page.tsx`,
 * this documents the intent rather than enforcing it — the route renders on
 * demand, so what actually decides the status is described in
 * `app/not-found.tsx`.
 */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  const text = newsTextFor(await getServerLocale(), slug) ?? article;
  return {
    title: `${text.title} — ${siteConfig.name}`,
    description: text.excerpt,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: `/berita/${article.slug}` },
    openGraph: {
      title: text.title,
      description: text.excerpt,
      type: "article",
      publishedTime: article.date,
      images: [{ url: article.image }],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const locale = await getServerLocale();
  const pages = pagesContentFor(locale);
  const copy = pages.article;
  const text = newsTextFor(locale, article.slug) ?? article;
  const dateFormatter = dateFormatterFor(locale);

  const others = articles.filter((a) => a.slug !== article.slug).slice(0, 2);

  /** NewsArticle markup so the article is eligible for rich results. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: text.title,
    datePublished: article.date,
    description: text.excerpt,
    image: `${siteConfig.url}${article.image}`,
    publisher: {
      "@type": "Organization",
      name: siteConfig.legalName,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/images/cipansor/logo-cipansor.webp`,
      },
    },
    mainEntityOfPage: `${siteConfig.url}/berita/${article.slug}`,
  };

  return (
    <PublicPage
      title={text.title}
      breadcrumb={[
        { label: pages.news.title, href: "/berita" },
        { label: article.unit, href: `/berita/${article.slug}` },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl">
        <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="secondary">{article.unit}</Badge>
          <time dateTime={article.date}>
            {dateFormatter.format(new Date(article.date))}
          </time>
        </div>

        <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-lg">
          <Image
            src={article.image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>

        {copy.bodyNotTranslated && (
          <p
            lang="id"
            className="mb-8 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
          >
            {copy.bodyNotTranslated}
          </p>
        )}
        {/* The body is Indonesian in every locale, so mark it as such for
            screen readers and for translation tooling. */}
        <div lang="id">
          <ContentBlocks blocks={article.body} />
        </div>

        {others.length > 0 && (
          <nav
            aria-label={copy.otherNewsHeading}
            className="mt-14 border-t border-border pt-8"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.otherNewsHeading}
            </h2>
            <ul className="mt-4 space-y-3">
              {others.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/berita/${other.slug}`}
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    {(newsTextFor(locale, other.slug) ?? other).title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </PublicPage>
  );
}
