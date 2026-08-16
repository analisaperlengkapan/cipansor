import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { RegistrationTracker } from "@/components/admissions/registration-tracker";
import { siteConfig } from "@/config/site";

/**
 * Standalone tracker page. The lookup itself lives in
 * `components/admissions/registration-tracker.tsx`, shared with the "Cek
 * Status" tab on /public/spmb.
 *
 * The page previously rendered a bare container with no navbar or footer — a
 * visitor who landed here from search had no way back into the site.
 */
export const metadata: Metadata = {
  title: `Lacak Pendaftaran SPMB — ${siteConfig.legalName}`,
  description:
    "Lacak status pendaftaran SPMB Pesantren Cipansor menggunakan nomor pendaftaran dan tanggal lahir calon santri.",
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: "/public/spmb/track" },
};

export default function TrackSpmbPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <LandingNavbar />
      <main id="main-content" className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-12 pt-28">
          <div className="mb-10 text-center">
            <h1 className="mb-2 text-4xl font-black tracking-tight">
              Lacak Pendaftaran
            </h1>
            <p className="text-muted-foreground">
              Masukkan nomor pendaftaran dan tanggal lahir calon santri
            </p>
          </div>
          {/*
            The lookup form is this page's only section, and the <h1> above is
            the page title — without a heading here the outline went straight
            from h1 to the footer's h3s. Visually hidden because the title and
            subtitle already say it on screen.
          */}
          <h2 className="sr-only">Formulir pencarian pendaftaran</h2>
          <RegistrationTracker />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
