import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative pt-24 pb-12 md:pt-32 md:pb-24 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
            Penerimaan Peserta Didik Baru Telah Dibuka
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl text-foreground">
            Membangun Generasi <span className="text-primary">Qur'ani</span>{" "}
            <br className="hidden sm:inline" />
            Berakhlak Mulia & Berprestasi
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl">
            Lembaga pendidikan Islam terpadu yang memadukan kurikulum nasional
            dengan nilai-nilai pesantren untuk mencetak pemimpin masa depan yang
            hafal Al-Qur'an dan berwawasan global.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/public/ppdb" className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2 text-base h-12">
                Daftar Sekarang <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#about" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 text-base h-12"
              >
                <BookOpen className="h-4 w-4" />
                Pelajari Lebih Lanjut
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
