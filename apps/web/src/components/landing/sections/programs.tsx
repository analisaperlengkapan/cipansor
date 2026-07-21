import Link from "next/link";
import {
  BookOpen,
  BookMarked,
  Compass,
  HandHeart,
  Languages,
  ScrollText,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { featuredPrograms } from "@/config/site";

const programIcons: Record<
  string,
  { icon: LucideIcon; color: string; bg: string }
> = {
  "Tahfidz & Tahsin Qur'an": {
    icon: BookMarked,
    color: "text-teal-600",
    bg: "bg-teal-500/10",
  },
  "Kajian Kitab Kuning": {
    icon: BookOpen,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
  },
  "Leadership (Kepemimpinan)": {
    icon: Compass,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  "Bahasa Arab & Bahasa Inggris": {
    icon: Languages,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
  },
  "Menghafal Hadits": {
    icon: ScrollText,
    color: "text-rose-600",
    bg: "bg-rose-500/10",
  },
  "Praktik Ibadah": {
    icon: HandHeart,
    color: "text-green-600",
    bg: "bg-green-500/10",
  },
};

export function ProgramSection() {
  return (
    <section id="programs" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-primary bg-primary/10 border-primary/20">
            Program Unggulan
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground text-balance">
            Pembinaan Harian Santri
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Enam program inti yang berjalan setiap hari di seluruh unit
            pendidikan, memadukan penguatan hafalan, penguasaan sumber keilmuan
            klasik, dan keterampilan yang relevan bagi santri hari ini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredPrograms.map((program) => {
            const visual = programIcons[program.title];
            const Icon = visual?.icon ?? BookOpen;
            return (
              <Card
                key={program.title}
                className="group hover:shadow-lg transition-shadow duration-300 border-border bg-card"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${visual?.bg ?? "bg-primary/10"}`}
                  >
                    <Icon
                      className={`h-6 w-6 ${visual?.color ?? "text-primary"}`}
                    />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {program.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {program.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/program-unggulan"
            className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
          >
            Lihat semua program unggulan
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
