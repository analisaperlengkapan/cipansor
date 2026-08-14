/**
 * 404 Not Found Page
 * Displays when a route doesn't exist
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
