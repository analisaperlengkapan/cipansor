import Link from "next/link";
import { BadgeCheck, Landmark, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { legalIdentity } from "@/config/content";

/**
 * The wordmarks of every body that has verified the yayasan's nonprofit status.
 *
 * Shared by both blocks below so a new verifier is added in config alone. Uses
 * plain <img> rather than next/image: one badge is an SVG, and next/image
 * refuses SVG unless `dangerouslyAllowSVG` is enabled globally — which would
 * push *every* SVG through the optimiser for the sake of one logo. Both files
 * are self-hosted (checked for scripts and external references first) rather
 * than hotlinked, so a badge cannot break on the page Google reviews, and they
 * cost no third-party request.
 */
function VerifierMarks() {
  return (
    <>
      {legalIdentity.verification.verifiers.map((v) => (
        <span
          key={v.name}
          className={
            v.onDark
              ? "inline-flex items-center rounded-md bg-neutral-900 px-2 py-1"
              : "inline-flex items-center"
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={v.logo}
            alt={`Terverifikasi oleh ${v.name}`}
            width={v.width}
            height={22}
            loading="lazy"
            decoding="async"
            className="h-[22px] w-auto"
          />
        </span>
      ))}
    </>
  );
}

/**
 * Legal standing and independent verification.
 *
 * Shown on the profile and donation pages: the two places where a visitor asks
 * "is this organisation real, and can I trust it with money?". Google Ad Grants
 * asks for exactly this — registration details a reviewer can check.
 */
/**
 * `variant` decides the closing paragraph, because the two pages are answering
 * different questions. On the profile page the reader wants to know how the
 * institution is governed; on the donation page they want to know what happens
 * to their money. Showing the donation pledge under "Legalitas" on /profil read
 * as a non sequitur.
 */
/**
 * Condensed legal identity for the homepage, sitting between the call to
 * action and the footer — where a first-time visitor's "is this organisation
 * real?" question actually lands, and the last thing read before deciding to
 * give.
 *
 * It exists because the full two-card block is too heavy for the homepage, and
 * because both Google programmes check the site's *landing* page: Ad Grants
 * asks for transparency about nonprofit status, and Google for Nonprofits
 * rejected the domain for not displaying the registered ID at all. Burying
 * those details one click deep on /profil satisfied neither.
 *
 * Reads the same `legalIdentity` config as the full block, so the numbers
 * cannot drift between the two places they appear.
 */
export function LegalIdentityStrip() {
  const { decree, verification } = legalIdentity;

  return (
    <section
      aria-labelledby="legalitas-ringkas"
      className="border-t border-border bg-muted/30 py-10"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="legalitas-ringkas" className="sr-only">
          Legalitas dan akuntabilitas
        </h2>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <dl className="grid flex-1 grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Badan hukum &mdash; {decree.authority.replace("Republik Indonesia", "RI")}
              </dt>
              <dd className="mt-1 font-mono text-sm font-medium">
                {decree.number}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {verification.registeredIdLabel}
              </dt>
              <dd className="mt-1 font-mono text-sm font-medium">
                {verification.registeredId}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <span className="inline-flex flex-wrap items-center gap-3">
              <VerifierMarks />
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Status nirlaba terverifikasi
              </span>
            </span>
            <Link
              href="/profil#legalitas"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Selengkapnya tentang legalitas &amp; akuntabilitas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LegalIdentity({
  variant = "profile",
}: {
  variant?: "profile" | "donation";
}) {
  const { decree, verification, governance, transparency } = legalIdentity;
  const compact = variant === "donation";

  return (
    <section aria-labelledby="legalitas" className={compact ? "" : "mt-14"}>
      <h2
        id="legalitas"
        className={compact ? "text-xl font-semibold" : "text-2xl font-semibold tracking-tight"}
      >
        Legalitas &amp; Akuntabilitas
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Landmark
                className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div>
                <h3 className="font-semibold">{decree.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {decree.description}
                </p>
                <dl className="mt-4 space-y-1 text-sm">
                  <dt className="text-muted-foreground">Nomor keputusan</dt>
                  <dd className="font-mono font-medium">{decree.number}</dd>
                  <dt className="pt-2 text-muted-foreground">Diterbitkan oleh</dt>
                  <dd className="font-medium">{decree.authority}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <BadgeCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div className="w-full">
                <h3 className="font-semibold">{verification.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {verification.description}
                </p>
                {/*
                  The registered identifier, shown with the same weight as the
                  decree number opposite. Google for Nonprofits rejected the
                  domain because the site never displayed it.
                */}
                <dl className="mt-4 space-y-1 text-sm">
                  <dt className="text-muted-foreground">
                    {verification.registeredIdLabel}
                  </dt>
                  <dd className="font-mono font-medium">
                    {verification.registeredId}
                  </dd>
                </dl>
                <span className="mt-4 flex flex-wrap items-center gap-3">
                  <VerifierMarks />
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Status nirlaba terverifikasi
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {compact ? transparency : governance}
      </p>
    </section>
  );
}
