import type { Metadata } from "next";
import { MapPin, Phone, Mail, MessageCircle, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PublicPage } from "@/components/landing/public-page";
import { siteConfig, addressLines } from "@/config/site";

export const metadata: Metadata = {
  title: `Kontak — ${siteConfig.legalName}`,
  description:
    "Alamat, telepon, email, dan WhatsApp Yayasan Pesantren Cipansor di Kecamatan Kadipaten, Kabupaten Tasikmalaya, Jawa Barat.",
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: "/kontak" },
};

export default function KontakPage() {
  const waHref = `${siteConfig.contact.whatsapp}?text=${encodeURIComponent(
    "Assalamualaikum, saya ingin bertanya tentang Pesantren Cipansor.",
  )}`;

  return (
    <PublicPage
      title="Hubungi Kami"
      lead="Silakan menghubungi kami untuk pertanyaan seputar pendaftaran, program pendidikan, maupun kunjungan ke pesantren."
      breadcrumb={[{ label: "Kontak", href: "/kontak" }]}
    >
      <div className="grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">Alamat</h2>
                <address className="mt-2 not-italic leading-relaxed text-muted-foreground">
                  {addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
                <Button asChild variant="outline" className="mt-4">
                  <a
                    href={siteConfig.contact.maps.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                    Buka di Google Maps
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start gap-3">
              <Phone className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">Telepon</h2>
                <a
                  href={`tel:+${siteConfig.contact.phoneE164}`}
                  className="mt-1 block text-muted-foreground hover:text-primary"
                >
                  {siteConfig.contact.phone}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">Email</h2>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="mt-1 block break-all text-muted-foreground hover:text-primary"
                >
                  {siteConfig.contact.email}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageCircle
                className="mt-1 h-5 w-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div className="w-full">
                <h2 className="font-semibold">WhatsApp</h2>
                <Button asChild className="mt-2 w-full sm:w-auto">
                  <a href={waHref} target="_blank" rel="noopener noreferrer">
                    Chat via WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicPage>
  );
}
