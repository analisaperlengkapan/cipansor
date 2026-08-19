import { siteConfig, addressLines } from "@/config/site";
import { legalIdentity } from "@/config/content";

/**
 * Schema.org markup so search engines and the Ad Grants review can identify
 * the organisation, its address, and how to contact it without parsing prose.
 *
 * IT USED TO LIVE IN app/page.tsx, and therefore appeared on exactly one page.
 * Every other public URL — /profil, /wakaf-infaq, each unit, each article —
 * described the pesantren in prose and identified it to a machine not at all.
 * A reviewer or a crawler landing anywhere but the homepage had nothing to
 * read. It is now emitted by `LandingFooter`, which every public surface
 * renders, so the identity travels with the page rather than with the route.
 */
export const organizationJsonLd = {
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
  sameAs: [siteConfig.contact.maps.url],
  // Deliberately no `nonprofitStatus`: schema.org's NonprofitType values are
  // US/NL specific (Nonprofit501c3 and friends). This is an Indonesian
  // yayasan, and asserting a US tax classification it does not hold would be
  // a false legal claim. The decree above is the accurate identifier.
};
