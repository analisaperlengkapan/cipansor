import type { Metadata } from "next";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { PublicPage } from "@/components/landing/public-page";
import { leadership } from "@/config/content";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Pimpinan Pesantren — ${siteConfig.legalName}`,
  description:
    "Jajaran pimpinan Yayasan Pesantren Cipansor: ketua yayasan, pimpinan pesantren, bendahara, serta kepala SD IT, SMP IT, dan SMA Qur'an.",
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: "/profil/pimpinan" },
};

export default function PimpinanPage() {
  return (
    <PublicPage
      title="Pimpinan Pesantren"
      lead="Para pengasuh dan kepala unit yang memimpin penyelenggaraan pendidikan di Pesantren Cipansor."
      breadcrumb={[
        { label: "Profil", href: "/profil" },
        { label: "Pimpinan", href: "/profil/pimpinan" },
      ]}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {leadership.map((leader) => (
          <Card key={leader.name} className="h-full overflow-hidden pt-0">
            {/* Portraits already existed in `public/images/people/` — they were
                only being used by the demo-account panel on /login. */}
            <div className="relative aspect-[4/3] bg-muted">
              <Image
                src={leader.photo}
                alt={`Foto ${leader.name}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-top"
              />
            </div>
            <CardContent className="flex h-full flex-col p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {leader.position}
              </p>
              <h2 className="mt-2 text-lg font-bold text-balance">{leader.name}</h2>
              <blockquote className="mt-4 border-l-2 border-primary/30 pl-4 text-sm italic leading-relaxed text-muted-foreground">
                &ldquo;{leader.motto}&rdquo;
              </blockquote>
            </CardContent>
          </Card>
        ))}
      </div>
    </PublicPage>
  );
}
