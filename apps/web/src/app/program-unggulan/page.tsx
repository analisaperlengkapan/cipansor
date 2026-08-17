import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PublicPage } from "@/components/landing/public-page";
import { siteConfig, featuredPrograms } from "@/config/site";
import { pagesContentFor } from "@/config/pages.i18n";
import { siteTextFor } from "@/config/site.i18n";
import { getServerLocale } from "@/lib/server-locale";
import { galleryPhoto } from "@/config/page-photo";
import { formatNumber } from "@/lib/locale-format";

export async function generateMetadata(): Promise<Metadata> {
  const copy = pagesContentFor(await getServerLocale()).programs;
  return {
    title: `${copy.title} — ${siteConfig.legalName}`,
    description: copy.metaDescription,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: "/program-unggulan" },
  };
}

export default async function ProgramUnggulanPage() {
  const locale = await getServerLocale();
  const copy = pagesContentFor(locale).programs;
  const site = siteTextFor(locale);

  return (
    <PublicPage
      title={copy.title}
      lead={copy.lead(site.visi)}
      breadcrumb={[{ label: copy.title, href: "/program-unggulan" }]}
      heroImage={galleryPhoto("karakter", 3, locale)}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {featuredPrograms.map((program, i) => {
          const text = site.programs[program.slug];
          return (
            <Card key={program.slug} className="h-full">
              <CardContent className="flex h-full flex-col p-6">
                <div className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                  >
                    {formatNumber(locale, i + 1)}
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {text?.title ?? program.title}
                    </h2>
                    <p className="mt-2 leading-relaxed text-muted-foreground">
                      {text?.description ?? program.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 rounded-lg border border-border bg-muted/30 p-8 text-center">
        <h2 className="text-2xl font-bold">{copy.ctaHeading}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          {copy.ctaBody(formatNumber(locale, new Date().getFullYear()))}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/public/spmb">{copy.ctaRegister}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/unit">{copy.ctaUnits}</Link>
          </Button>
        </div>
      </div>
    </PublicPage>
  );
}
