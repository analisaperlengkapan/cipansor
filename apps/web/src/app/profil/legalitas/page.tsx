import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Globe, Landmark, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PublicPage } from "@/components/landing/public-page";
import { LegalIdentity } from "@/components/landing/legal-identity";
import { legalIdentity } from "@/config/content";
import { publicContentFor } from "@/config/content.i18n";
import { pagesContentFor } from "@/config/pages.i18n";
import { siteConfig, addressLines } from "@/config/site";
import { getServerLocale } from "@/lib/server-locale";
import { galleryPhoto } from "@/config/page-photo";

/**
 * /profil/legalitas — one URL that answers "is this organisation real, and does
 * it operate this domain?".
 *
 * WHY IT EXISTS. Google for Nonprofits declined cipansor.or.id twice. The
 * second refusal was not about content quality: *"we couldn't confirm its
 * relationship with your registered nonprofit organization... we need
 * confirmation that Yayasan Pesantren Cipansor truly owns and operates this
 * domain."* Every fact needed to confirm it was already published, but spread
 * across four pages — the decree number in a strip on the homepage, the
 * address in the footer, the governance sentence at the foot of /profil, the
 * officers on /profil/pimpinan — and the one fact that mattered most, that the
 * yayasan also runs pesantrencipansor.com, appeared nowhere at all. Two sites
 * carrying the same leadership, address, articles and photographs, with neither
 * acknowledging the other, is what a copied site looks like.
 *
 * So this page is deliberately a single scrollable answer rather than a hub of
 * links: it is the URL to hand a reviewer.
 *
 * IT SITS UNDER /profil ON PURPOSE. `/profil` is already in
 * `PUBLIC_PATH_PREFIXES` (lib/host-split.ts) and `publicPrefixes`
 * (middleware.ts), and both match on segment boundaries, so a child route is
 * public on the apex without editing either list. A top-level `/legalitas`
 * would have needed adding in two places — and the page that gets missed in one
 * of them is the page that redirects a reviewer to a staff login screen.
 */
export async function generateMetadata(): Promise<Metadata> {
  const copy = publicContentFor(await getServerLocale()).transparencyPage;
  return {
    title: `${copy.title} — ${siteConfig.legalName}`,
    description: copy.metaDescription,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: "/profil/legalitas" },
  };
}

/** A labelled fact. The value is never translated — see the note below. */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-3 last:border-b-0 sm:grid sm:grid-cols-[14rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium sm:mt-0">{children}</dd>
    </div>
  );
}

export default async function LegalitasPage() {
  const locale = await getServerLocale();
  const content = publicContentFor(locale);
  const copy = content.transparencyPage;
  const contactCopy = pagesContentFor(locale).contact;

  /**
   * Both hosts in one list, the official domain first, so the page states the
   * whole picture rather than describing "the other one" relative to wherever
   * the reader happens to be. Roles are copy; hostnames come from
   * `siteConfig.domains`, which also feeds `sameAs` in the structured data and
   * the line in the footer — one edit moves all three.
   */
  const domains = [
    {
      host: siteConfig.domains.canonical,
      url: siteConfig.url,
      role: copy.domains.canonicalRole,
      isCanonical: true,
    },
    ...siteConfig.domains.previous.map((d) => ({
      host: d.host,
      url: d.url,
      role: copy.domains.previousRole,
      isCanonical: false,
    })),
  ];

  return (
    <PublicPage
      title={copy.title}
      lead={copy.lead}
      breadcrumb={[
        { label: content.profilePage.title, href: "/profil" },
        { label: copy.title, href: "/profil/legalitas" },
      ]}
      heroImage={galleryPhoto("fasilitas", 3, locale)}
    >
      {/* ---------------------------------------------------------------
          Legal identity. Labels are translated; the values below are not.
          A decree number, an NPWP, a registered name and a street address
          are what is written on the documents, and a reviewer comparing
          this page against the yayasan's akta is comparing strings.
         --------------------------------------------------------------- */}
      <section aria-labelledby="identitas" className="max-w-4xl">
        <h2 id="identitas" className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Landmark className="h-5 w-5 text-primary" aria-hidden="true" />
          {copy.identity.heading}
        </h2>
        <dl className="mt-6 rounded-lg border border-border px-5">
          <Fact label={copy.identity.legalNameLabel}>{siteConfig.legalName}</Fact>
          <Fact label={copy.identity.legalFormLabel}>
            {copy.identity.legalFormValue}
          </Fact>
          <Fact label={copy.identity.decreeLabel}>
            <span className="font-mono">{legalIdentity.decree.number}</span>
          </Fact>
          <Fact label={copy.identity.issuedByLabel}>
            {content.legalIdentity.decree.authority}
          </Fact>
          <Fact label={legalIdentity.verification.registeredIdLabel}>
            <span className="font-mono">
              {legalIdentity.verification.registeredId}
            </span>
          </Fact>
          <Fact label={copy.identity.establishedLabel}>
            {siteConfig.establishedYear}
          </Fact>
          <Fact label={copy.identity.markazLabel}>{siteConfig.markaz}</Fact>
          <Fact label={copy.identity.addressLabel}>
            <address className="not-italic font-normal leading-relaxed">
              {addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </Fact>
        </dl>
      </section>

      {/* ---------------------------------------------------------------
          The section this page was built for.
         --------------------------------------------------------------- */}
      <section aria-labelledby="domain" className="mt-14 max-w-4xl">
        <h2 id="domain" className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Globe className="h-5 w-5 text-primary" aria-hidden="true" />
          {copy.domains.heading}
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {copy.domains.intro}
        </p>

        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {domains.map((domain) => (
            <li key={domain.host}>
              <Card className="h-full">
                <CardContent className="p-6">
                  {/* An external link even for the canonical host: this list is
                      read as evidence, and a reader checking it should be able
                      to open either address from here. The former site is
                      marked as such rather than left to be inferred from the
                      order the cards happen to render in. */}
                  <a
                    href={domain.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 font-mono text-base font-semibold text-primary underline-offset-4 group-hover:underline"
                  >
                    {domain.host}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {domain.role}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        {/*
          The strongest sentence on the page, and the reason it is set apart
          rather than folded into the paragraph above: everything else here is
          the yayasan describing itself, which is exactly the kind of claim a
          reviewer cannot take at face value. The .or.id registration is not —
          it was granted only after the registry checked incorporation documents
          in the organisation's name.
        */}
        <p className="mt-6 rounded-lg border border-border bg-muted/30 p-5 text-sm leading-relaxed">
          {copy.domains.registryNote}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {copy.domains.migrationNote}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {copy.domains.emailNote(siteConfig.contact.email)}
        </p>
      </section>

      {/* The full two-card block — decree, independent verification, verifier
          wordmarks — reused rather than restated, so the numbers here and on
          /profil and /wakaf-infaq cannot drift apart. */}
      <div className="max-w-4xl">
        <LegalIdentity variant="profile" copy={content.legalIdentity} />
      </div>

      <section aria-labelledby="tata-kelola" className="mt-14 max-w-4xl">
        <h2
          id="tata-kelola"
          className="flex items-center gap-2 text-2xl font-semibold tracking-tight"
        >
          <Users className="h-5 w-5 text-primary" aria-hidden="true" />
          {copy.governance.heading}
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {content.legalIdentity.governance}
        </p>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {copy.governance.officersIntro}{" "}
          <Link
            href="/profil/pimpinan"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {copy.governance.leadershipLink}
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="kontak-resmi" className="mt-14 max-w-4xl">
        <h2
          id="kontak-resmi"
          className="flex items-center gap-2 text-2xl font-semibold tracking-tight"
        >
          <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
          {copy.contact.heading}
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {copy.contact.body}
        </p>
        {/* Headings borrowed from /kontak's dictionary rather than duplicated
            into this page's block: they are the same three labels, already
            written in all three locales, and a second copy is a second thing to
            keep in step. The address itself is not repeated here — it is in the
            identity table above, and printing it twice on one page invites the
            two copies to disagree. */}
        <dl className="mt-6 rounded-lg border border-border px-5">
          <Fact label={contactCopy.phoneHeading}>
            <a
              href={`tel:+${siteConfig.contact.phoneE164}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {siteConfig.contact.phone}
            </a>
          </Fact>
          <Fact label={contactCopy.emailHeading}>
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="break-all text-primary underline-offset-4 hover:underline"
            >
              {siteConfig.contact.email}
            </a>
          </Fact>
          <Fact label={contactCopy.addressHeading}>
            <a
              href={siteConfig.contact.maps.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
            >
              {contactCopy.openInMaps}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </Fact>
        </dl>
      </section>
    </PublicPage>
  );
}
