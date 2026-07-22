import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PublicPage } from "@/components/landing/public-page";
import { siteConfig, featuredPrograms } from "@/config/site";

export const metadata: Metadata = {
  title: `Program Unggulan — ${siteConfig.legalName}`,
  description:
    "Sepuluh program unggulan Pesantren Cipansor: tahfidz bersanad, kajian kitab kuning, kepemimpinan, bahasa Arab dan Inggris, hafalan hadits, praktik ibadah, public speaking, kewirausahaan, dan bimbingan masuk perguruan tinggi.",
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: "/program-unggulan" },
};

export default function ProgramUnggulanPage() {
  return (
    <PublicPage
      title="Program Unggulan"
      lead={`Program pembinaan yang menopang visi "${siteConfig.visi}" — dijalankan berdampingan dengan kurikulum nasional di seluruh unit pendidikan.`}
      breadcrumb={[{ label: "Program Unggulan", href: "/program-unggulan" }]}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {featuredPrograms.map((program, i) => (
          <Card key={program.title} className="h-full">
            <CardContent className="flex h-full flex-col p-6">
              <div className="flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                >
                  {i + 1}
                </span>
                <div>
                  <h2 className="text-lg font-semibold">{program.title}</h2>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {program.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-border bg-muted/30 p-8 text-center">
        <h2 className="text-2xl font-bold">Tertarik menyekolahkan putra-putri Anda?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Pendaftaran Sistem Penerimaan Murid Baru (SPMB) {new Date().getFullYear()} telah
          dibuka untuk seluruh unit pendidikan.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/public/spmb">Daftar SPMB</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/unit">Lihat Unit Pendidikan</Link>
          </Button>
        </div>
      </div>
    </PublicPage>
  );
}
