import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
// Force Global HMR Rebuild
import { QueryProvider } from "@/components/providers/query-provider";
import { I18nProvider } from "@/providers/i18n-provider";
import { dirFor, isLocale, LOCALE_COOKIE, type Locale } from "@/locales";
import { Toaster } from "@/components/ui/sonner";
import { SkipLink, OfflineBanner } from "@/components/shared";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Product name. `publisher` below stays the legal entity.
  title: "Sistem Informasi Cipansor",
  description:
    "Sistem Informasi Cipansor — layanan digital Yayasan Pesantren Cipansor.",
  applicationName: "Sistem Informasi Cipansor",
  keywords: [
    "pesantren",
    "management",
    "system",
    "education",
    "islamic school",
  ],
  authors: [{ name: "Cipansor Team" }],
  creator: "Cipansor Team",
  publisher: "Yayasan Pesantren Cipansor",
  robots: "index, follow",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-180.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cipansor",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Sistem Informasi Cipansor",
    title: "Sistem Informasi Cipansor",
    description:
      "Sistem Informasi Cipansor — layanan digital Yayasan Pesantren Cipansor.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16a34a",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the persisted locale server-side so the first paint already has the
  // right lang/dir (no hydration flash, no RTL layout shift for Arabic).
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : "id";

  return (
    <html lang={locale} dir={dirFor(locale)} suppressHydrationWarning>
      <head>
        {/*
          Capture `beforeinstallprompt` before React exists.

          Chrome fires it as soon as it has decided the app is installable,
          which is routinely earlier than hydration — and the event fires
          exactly once. InstallPrompt attaches its listener in a useEffect, so
          on any load where hydration lost that race the event was simply
          dropped and the install banner never appeared again for that visit.
          It looked intermittent, and got steadily worse as the bundle grew.

          This runs before the body parses, stashes the event, and lets the
          React component pick it up whenever it mounts.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){window.__installPromptEvent=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__installPromptEvent=e;window.dispatchEvent(new Event('installpromptready'));});})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider initialLocale={locale}>
          <QueryProvider>
            <SkipLink />
            <OfflineBanner />
            <main id="main-content">{children}</main>
            <Toaster />
            <ServiceWorkerRegister />
            <InstallPrompt />
          </QueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
