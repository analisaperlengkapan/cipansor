import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { siteConfig, galleryItems } from "@/config/site";

const commitments = [
  "Kurikulum terpadu: nasional, kepesantrenan, dan teknologi",
  "Tahfidz & tahsin Al-Qur'an bersanad setiap hari",
  "Kajian kitab kuning dan hafalan hadits pilihan",
  "Pembiasaan bahasa Arab dan bahasa Inggris",
];

export function AboutSection() {
  const [featured, ...rest] = galleryItems;

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Text Content */}
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-primary bg-primary/10 border-primary/20">
              Profil Pesantren
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-balance">
              Menyeimbangkan Ilmu Agama, Akademik, dan Teknologi
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
              {`${siteConfig.markaz} ${siteConfig.legalName} adalah lembaga pendidikan Islami yang berdiri sejak ${siteConfig.establishedYear} dengan visi “${siteConfig.visi}”. Santri dibina dalam lingkungan asrama yang menumbuhkan kemandirian, kedisiplinan, dan adab, sekaligus disiapkan untuk bersaing di era global.`}
            </p>

            <div className="space-y-4 pt-4">
              {commitments.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{item}</span>
                </div>
              ))}
            </div>

            <Link
              href="/profil"
              className="inline-flex items-center gap-1 pt-2 font-medium text-primary underline-offset-4 hover:underline"
            >
              Selengkapnya tentang profil pesantren
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Documentation gallery */}
          <div className="flex-1 w-full">
            <figure className="relative aspect-video rounded-xl overflow-hidden border border-border shadow-xl">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-sm font-medium text-white">
                {featured.title}
              </figcaption>
            </figure>

            <div className="grid grid-cols-2 gap-4 mt-4">
              {rest.map((item) => (
                <figure
                  key={item.title}
                  className="relative h-32 rounded-lg overflow-hidden border border-border"
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 text-xs font-medium text-white">
                    {item.title}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
