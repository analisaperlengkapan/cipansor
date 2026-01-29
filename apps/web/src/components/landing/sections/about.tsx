import { CheckCircle2 } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Text Content */}
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-primary bg-primary/10 border-primary/20">
              Tentang Kami
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Mewujudkan Pendidikan Islam yang Holistik dan Berkelanjutan
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Yayasan Pesantren Cipansor berkomitmen untuk menyelenggarakan
              pendidikan berkualitas yang menyeimbangkan kecerdasan intelektual,
              spiritual, dan emosional. Kami percaya bahwa setiap anak memiliki
              potensi untuk menjadi pemimpin masa depan yang amanah.
            </p>

            <div className="space-y-4 pt-4">
              {[
                "Kurikulum Terpadu (Nasional & Kepesantrenan)",
                "Program Tahfidz Al-Qur'an Intensif",
                "Pembiasaan Adab & Karakter Islami",
                "Fasilitas Pembelajaran Modern",
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual/Image Placeholder */}
          <div className="flex-1 w-full">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border shadow-xl">
              {/* In a real scenario, use Next.js Image component with a real src */}
              <div className="absolute inset-0 flex items-center justify-center bg-secondary/30">
                <p className="text-muted-foreground font-medium">
                  Foto Kegiatan Pesantren
                </p>
              </div>
              {/* Pattern overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black/20" />
            </div>

            {/* Decorative elements */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="h-32 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center p-4 text-center">
                <p className="text-sm font-medium text-primary">
                  Lingkungan Asri & Kondusif
                </p>
              </div>
              <div className="h-32 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center p-4 text-center">
                <p className="text-sm font-medium text-primary">
                  Ekstrakurikuler Beragam
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
