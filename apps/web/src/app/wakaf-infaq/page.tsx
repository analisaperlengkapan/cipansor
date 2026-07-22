import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { siteConfig, donationConfig } from "@/config/site";
import { DonationPortal } from "./donation-portal";

/**
 * Wakaf & Infaq — the single public donation page.
 *
 * This used to live at `/public/donation` while the navigation also spoke of
 * "Wakaf & Infaq", which is the term the pesantren itself uses. Two names for
 * one thing meant duplicate content and a menu that did not match the page it
 * opened. `/public/donation` now redirects here (see next.config.ts).
 *
 * The page body is a client component (it posts a donation form and reads live
 * campaigns), so this server wrapper exists to carry the metadata and the
 * structured data that a client component cannot export.
 */
export const metadata: Metadata = {
  title: `Wakaf & Infaq — ${siteConfig.legalName}`,
  description:
    "Salurkan wakaf dan infaq untuk pembangunan sarana pendidikan, beasiswa santri penghafal Al-Qur'an 30 juz, dan operasional harian Pesantren Cipansor. Dikelola transparan dengan laporan penyaluran berkala.",
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: "/wakaf-infaq" },
  openGraph: {
    title: `Wakaf & Infaq — ${siteConfig.legalName}`,
    description:
      "Dukung pendidikan santri Pesantren Cipansor melalui wakaf sarana pendidikan, beasiswa takhosus, dan infaq operasional.",
    url: `${siteConfig.url}/wakaf-infaq`,
    siteName: siteConfig.name,
    locale: "id_ID",
    type: "website",
  },
};

const donateJsonLd = {
  "@context": "https://schema.org",
  "@type": "DonateAction",
  name: "Wakaf & Infaq Pesantren Cipansor",
  recipient: {
    "@type": "NGO",
    name: siteConfig.legalName,
    url: siteConfig.url,
    email: siteConfig.contact.email,
    telephone: `+${siteConfig.contact.phoneE164}`,
  },
  potentialAction: donationConfig.programs.map((program) => ({
    "@type": "DonateAction",
    name: program.title,
    description: program.description,
  })),
};

export default function WakafInfaqPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donateJsonLd) }}
      />
      <LandingNavbar />
      <main id="main-content" className="flex-1 pt-16">
        <DonationPortal />
      </main>
      <LandingFooter />
    </div>
  );
}
