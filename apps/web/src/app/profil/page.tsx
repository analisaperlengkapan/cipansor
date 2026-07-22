import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PublicPage, ContentBlocks } from "@/components/landing/public-page";
import { LegalIdentity } from "@/components/landing/legal-identity";
import { profileSections, profileStats } from "@/config/content";
import { siteConfig, educationUnits } from "@/config/site";

export const metadata: Metadata = {
  title: `Profil Pesantren — ${siteConfig.legalName}`,
  description:
    "Sejarah, visi, dan struktur Yayasan Pesantren Cipansor: lembaga pendidikan Islam terpadu di Kabupaten Tasikmalaya yang berdiri sejak 1911 dan menaungi lima unit pendidikan.",
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: "/profil" },
};

export default function ProfilPage() {
  return (
    <PublicPage
      title="Profil Pesantren Cipansor"
      lead={`${siteConfig.markaz} — lembaga pendidikan Islam terpadu di Kabupaten Tasikmalaya, berdiri sejak ${siteConfig.establishedYear}.`}
      breadcrumb={[{ label: "Profil", href: "/profil" }]}
    >
      <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {profileStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ContentBlocks blocks={profileSections} />

      <div className="mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {educationUnits.map((unit) => (
          <Link
            key={unit.slug}
            href={`/unit/${unit.slug}`}
            className="rounded-lg border border-border p-5 transition-colors hover:border-primary hover:bg-muted/40"
          >
            <p className="font-semibold">{unit.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{unit.tagline}</p>
          </Link>
        ))}
      </div>

      <LegalIdentity />

      <p className="mt-10 max-w-3xl text-muted-foreground">
        Ingin mengenal para pengasuh dan kepala unit?{" "}
        <Link href="/profil/pimpinan" className="font-medium text-primary underline">
          Lihat jajaran pimpinan
        </Link>
        .
      </p>
    </PublicPage>
  );
}
