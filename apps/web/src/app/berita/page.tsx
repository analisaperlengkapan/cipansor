import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicPage } from "@/components/landing/public-page";
import { articles } from "@/config/content";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Berita & Kegiatan — ${siteConfig.legalName}`,
  description:
    "Kabar terbaru dari Pesantren Cipansor: prestasi santri, kegiatan pembinaan, dan agenda unit pendidikan.",
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: "/berita" },
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export default function BeritaPage() {
  // Newest first, so the page leads with the most recent activity.
  const sorted = [...articles].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <PublicPage
      title="Berita & Kegiatan"
      lead="Catatan kegiatan dan capaian santri di berbagai unit pendidikan Pesantren Cipansor."
      breadcrumb={[{ label: "Berita", href: "/berita" }]}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((article) => (
          <Card key={article.slug} className="h-full overflow-hidden">
            <Link href={`/berita/${article.slug}`} className="block">
              <div className="relative aspect-[16/10]">
                <Image
                  src={article.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
            </Link>
            <CardContent className="flex flex-col p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{article.unit}</Badge>
                <time dateTime={article.date}>
                  {dateFormatter.format(new Date(article.date))}
                </time>
              </div>
              <h2 className="mt-3 text-lg font-semibold leading-snug text-balance">
                <Link
                  href={`/berita/${article.slug}`}
                  className="hover:text-primary"
                >
                  {article.title}
                </Link>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {article.excerpt}
              </p>
              <Link
                href={`/berita/${article.slug}`}
                className="mt-4 text-sm font-medium text-primary underline underline-offset-4"
              >
                Baca selengkapnya
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </PublicPage>
  );
}
