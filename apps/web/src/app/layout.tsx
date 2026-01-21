import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Force Global HMR Rebuild
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { SkipLink, OfflineBanner } from "@/components/shared";

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
  },
  manifest: "/manifest.json",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <SkipLink />
          <OfflineBanner />
          <main id="main-content">{children}</main>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
