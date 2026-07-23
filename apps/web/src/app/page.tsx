import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { HeroSection } from "@/components/landing/sections/hero";
import { StatsSection } from "@/components/landing/sections/stats";
import { AboutSection } from "@/components/landing/sections/about";
import { ProgramSection } from "@/components/landing/sections/programs";
import { UnitsSection } from "@/components/landing/sections/units";
import { NewsSection } from "@/components/landing/sections/news";
import { CtaSection } from "@/components/landing/sections/cta";
import { LegalIdentityStrip } from "@/components/landing/legal-identity";
import { siteConfig, addressLines } from "@/config/site";
import { legalIdentity } from "@/config/content";
import { publicContentFor } from "@/config/content.i18n";
import { getServerLocale } from "@/lib/server-locale";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `${siteConfig.legalName} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: "/" },
  openGraph: {
    title: `${siteConfig.legalName} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "id_ID",
    type: "website",
    images: [{ url: "/images/cipansor/hero.webp", width: 1536, height: 672 }],
  },
};

/**
 * Schema.org markup so search engines and the Ad Grants review can identify
 * the organisation, its address, and how to contact it without parsing prose.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: siteConfig.legalName,
  alternateName: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/images/cipansor/logo-cipansor.webp`,
  foundingDate: String(siteConfig.establishedYear),
  description: siteConfig.description,
  email: siteConfig.contact.email,
  telephone: `+${siteConfig.contact.phoneE164}`,
  address: {
    "@type": "PostalAddress",
    streetAddress: addressLines.slice(0, 2).join(", "),
    addressLocality: siteConfig.contact.address.district,
    addressRegion: siteConfig.contact.address.province,
    postalCode: siteConfig.contact.address.postalCode,
    addressCountry: "ID",
  },
  // Coordinates + the Maps listing, so local search can place the pesantren
  // rather than guess from the address string.
  geo: {
    "@type": "GeoCoordinates",
    latitude: siteConfig.contact.maps.latitude,
    longitude: siteConfig.contact.maps.longitude,
  },
  hasMap: siteConfig.contact.maps.url,
  // The ministerial decree that establishes the foundation as a legal entity.
  // `identifier` is how schema.org expresses a registration number, and Ad
  // Grants asks nonprofits to publish theirs.
  // Both identifiers: the ministerial decree that creates the legal entity,
  // and the registered/tax ID that Goodstack and Google matched the nonprofit
  // application against. `taxID` is the schema.org property for the latter.
  identifier: [
    {
      "@type": "PropertyValue",
      name: legalIdentity.decree.authority,
      value: legalIdentity.decree.number,
    },
    {
      "@type": "PropertyValue",
      name: legalIdentity.verification.registeredIdLabel,
      value: legalIdentity.verification.registeredId,
    },
  ],
  taxID: legalIdentity.verification.registeredId,
  // Deliberately no `nonprofitStatus`: schema.org's NonprofitType values are
  // US/NL specific (Nonprofit501c3 and friends). This is an Indonesian
  // yayasan, and asserting a US tax classification it does not hold would be
  // a false legal claim. The decree above is the accurate identifier.
};

export default async function Home() {
  // Server component: the locale comes from the cookie, not from useI18n.
  const content = publicContentFor(await getServerLocale());

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <AboutSection />
        <ProgramSection />
        <UnitsSection />
        <NewsSection />
        <CtaSection />
        <LegalIdentityStrip copy={content.legalIdentity} />
      </main>
      <LandingFooter />
    </div>
  );
}
