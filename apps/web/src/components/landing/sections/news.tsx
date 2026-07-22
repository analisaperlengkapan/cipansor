import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { articles } from "@/config/content";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export function NewsSection() {
  // One source of truth with /berita. Newest first, three on the homepage.
  const latestNews = [...articles]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    <section id="news" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-primary bg-primary/10 border-primary/20">
            Berita &amp; Kegiatan
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground text-balance">
            Kabar Terbaru dari Pondok
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Catatan kegiatan dan capaian santri di berbagai unit pendidikan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {latestNews.map((item) => (
            <Card
              key={item.slug}
              className="flex flex-col overflow-hidden border-border bg-card pt-0"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <CardContent className="flex flex-1 flex-col gap-3 p-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                    {item.unit}
                  </span>
                  <time dateTime={item.date}>
                    {dateFormatter.format(new Date(item.date))}
                  </time>
                </div>
                <h3 className="font-semibold leading-snug text-foreground text-pretty">
                  <Link href={`/berita/${item.slug}`} className="hover:text-primary">
                    {item.title}
                  </Link>
                </h3>
                <p className="flex-1 text-sm text-muted-foreground leading-relaxed">
                  {item.excerpt}
                </p>
                {/* Without this the articles were unreachable from the
                    homepage — the cards showed an excerpt and stopped. */}
                <Link
                  href={`/berita/${item.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Baca selengkapnya
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/berita"
            className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
          >
            Lihat semua berita &amp; kegiatan
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
