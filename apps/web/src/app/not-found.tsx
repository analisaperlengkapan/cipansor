/**
 * 404 Not Found Page
 * Displays when a route doesn't exist
 *
 * WHY THERE IS NO `app/loading.tsx`
 *
 * There used to be one: a single global skeleton, shaped like the dashboard —
 * sidebar, four stat cards, a table — rendered as the loading state of every
 * route in the app, the public marketing site included. It also stopped this
 * page from ever setting a status.
 *
 * A `loading.tsx` is a Suspense boundary, and Next flushes the shell through
 * it before the page resolves. By the time a page called `notFound()`, the
 * response was already committed as 200. Measured on the built app, before
 * and after removing the file:
 *
 *   /unit/zzz-bogus    200, 48 KB of skeleton   ->  404, this page
 *   /berita/tidak-ada  200, 48 KB of skeleton   ->  404, this page
 *   /unit/sdit         200, 81 KB               ->  200, 60 KB
 *   /profil            200, 88 KB               ->  200, 71 KB
 *
 * So every wrong URL under /unit or /berita answered 200 with an admin-shaped
 * skeleton titled "Sistem Informasi Cipansor" — a soft 404 to Googlebot on
 * the one site that must survive a nonprofit review, and a page that never
 * arrives for a visitor following a stale link. The skeleton markup was also
 * inlined into every HTML response, landing page included, at ~20 KB a time.
 *
 * Restoring a root `loading.tsx` restores all of that silently. A guard in
 * `src/config/gallery.test.ts` fails if the file comes back. If the app shell
 * wants a skeleton again, it belongs in the authenticated segments, not above
 * the public site.
 */

import Link from "next/link";
import { headers } from "next/headers";
import { isPublicSiteHost } from "@/lib/host-split";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default async function NotFound() {
  /*
   * Where "home" is depends on which site the visitor is on.
   *
   * This page is what cipansor.or.id now answers for every application path,
   * so on the public site a "Ke Dashboard" button would point straight back
   * into the 404 the visitor just hit — and would put a link to the system on
   * the one site that deliberately does not advertise one. On the portal, and
   * in development, the dashboard is the right place to offer.
   */
  const onPublicSite = isPublicSiteHost((await headers()).get("host"));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">
            404 - Halaman Tidak Ditemukan
          </CardTitle>
          <CardDescription>
            Maaf, halaman yang Anda cari tidak dapat ditemukan. Mungkin telah
            dipindahkan atau tidak ada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href={onPublicSite ? "/" : "/dashboard"}>
                <Home className="mr-2 h-4 w-4" />
                {onPublicSite ? "Ke Beranda" : "Ke Dashboard"}
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="javascript:history.back()">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Link>
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Jika Anda merasa ini adalah kesalahan, silakan hubungi
            administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
