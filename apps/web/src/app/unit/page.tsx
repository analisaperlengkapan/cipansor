import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { PublicPage } from "@/components/landing/public-page";
import { siteConfig, educationUnits } from "@/config/site";
import { pagesContentFor } from "@/config/pages.i18n";
import { siteTextFor } from "@/config/site.i18n";
import { getServerLocale } from "@/lib/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  // The tab title and the search snippet follow the reader's locale too — they
  // were the last Indonesian left on an otherwise translated page.
  const copy = pagesContentFor(await getServerLocale()).units;
  return {
    title: `${copy.title} — ${siteConfig.legalName}`,
    description: copy.metaDescription,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: "/unit" },
  };
}

export default async function UnitIndexPage() {
  const locale = await getServerLocale();
  const copy = pagesContentFor(locale).units;
  const unitText = siteTextFor(locale).units;

  return (
    <PublicPage
      title={copy.title}
      lead={copy.lead}
      breadcrumb={[{ label: copy.title, href: "/unit" }]}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {educationUnits.map((unit) => {
          const text = unitText[unit.slug];
          return (
            <Card key={unit.slug} className="h-full overflow-hidden">
              <CardContent className="flex h-full flex-col p-6">
                <Image
                  src={unit.logo}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain"
                />
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">
                  {text?.level}
                </p>
                <h2 className="mt-1 text-lg font-bold">{unit.name}</h2>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  {text?.tagline ?? unit.tagline}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {text?.description ?? unit.description}
                </p>
                <Link
                  href={`/unit/${unit.slug}`}
                  className="mt-4 text-sm font-medium text-primary underline underline-offset-4"
                >
                  {copy.moreLink(unit.shortName)}
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PublicPage>
  );
}
