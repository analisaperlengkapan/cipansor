import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { PublicPage } from "@/components/landing/public-page";
import { siteConfig, educationUnits } from "@/config/site";
import { unitDetails } from "@/config/content";

export const metadata: Metadata = {
  title: `Unit Pendidikan — ${siteConfig.legalName}`,
  description:
    "Lima unit pendidikan Pesantren Cipansor: TK Qur'an, SD IT, SMP IT, SMA Qur'an, dan program Takhosus tahfidz intensif.",
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: "/unit" },
};

export default function UnitIndexPage() {
  return (
    <PublicPage
      title="Unit Pendidikan"
      lead="Lima jenjang yang saling menyambung, sehingga santri dapat menempuh seluruh masa belajarnya dalam satu lingkungan pembinaan."
      breadcrumb={[{ label: "Unit Pendidikan", href: "/unit" }]}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {educationUnits.map((unit) => (
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
                {unitDetails[unit.slug]?.jenjang}
              </p>
              <h2 className="mt-1 text-lg font-bold">{unit.name}</h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {unit.tagline}
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {unit.description}
              </p>
              <Link
                href={`/unit/${unit.slug}`}
                className="mt-4 text-sm font-medium text-primary underline underline-offset-4"
              >
                Selengkapnya tentang {unit.shortName}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </PublicPage>
  );
}
