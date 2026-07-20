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
  title: "Cipansor - Pesantren Management System",
  description: "Yayasan Pesantren Cipansor Management System",
  applicationName: "Cipansor",
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
    siteName: "Cipansor",
    title: "Cipansor - Pesantren Management System",
    description: "Yayasan Pesantren Cipansor Management System",
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
