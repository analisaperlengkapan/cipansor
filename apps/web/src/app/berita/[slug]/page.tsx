import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PublicPage, ContentBlocks } from "@/components/landing/public-page";
import { articles, getArticle } from "@/config/content";
import { siteConfig } from "@/config/site";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} — ${siteConfig.name}`,
    description: article.excerpt,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: `/berita/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.date,
      images: [{ url: article.image }],
    },
  };
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const others = articles.filter((a) => a.slug !== article.slug).slice(0, 2);

  /** NewsArticle markup so the article is eligible for rich results. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    datePublished: article.date,
    description: article.excerpt,
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
      title={article.title}
      breadcrumb={[
        { label: "Berita", href: "/berita" },
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

        <ContentBlocks blocks={article.body} />

        {others.length > 0 && (
          <nav aria-label="Berita lainnya" className="mt-14 border-t border-border pt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Berita lainnya
            </h2>
            <ul className="mt-4 space-y-3">
              {others.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/berita/${other.slug}`}
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    {other.title}
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
