import Link from "next/link";
import {
  BookOpen,
  BookMarked,
  Compass,
  GraduationCap,
  HandHeart,
  Languages,
  Mic,
  ScrollText,
  Sprout,
  Store,
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
import { homeContentFor } from "@/config/home.i18n";
import { siteTextFor } from "@/config/site.i18n";
import { formatNumber } from "@/lib/locale-format";
import type { Locale } from "@/locales";

/**
 * Keyed by slug, not by the programme's title. Keyed by title, this map went
 * stale the moment the list grew past the original six: the four newer
 * programmes matched nothing and fell back to a generic book icon, and nothing
 * failed to say so. A slug is an identifier and does not change when the copy
 * is reworded — or translated.
 */
const programIcons: Record<
  string,
  { icon: LucideIcon; color: string; bg: string }
> = {
  "tahfidz-tahsin": {
    icon: BookMarked,
    color: "text-teal-600",
    bg: "bg-teal-500/10",
  },
  "kitab-kuning": {
    icon: BookOpen,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
  },
  leadership: {
    icon: Compass,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  bahasa: {
    icon: Languages,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
  },
  hadits: {
    icon: ScrollText,
    color: "text-rose-600",
    bg: "bg-rose-500/10",
  },
  "praktik-ibadah": {
    icon: HandHeart,
    color: "text-green-600",
    bg: "bg-green-500/10",
  },
  "public-speaking": {
    icon: Mic,
    color: "text-sky-600",
    bg: "bg-sky-500/10",
  },
  "pembinaan-islam": {
    icon: Sprout,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
  },
  entrepreneurship: {
    icon: Store,
    color: "text-orange-600",
    bg: "bg-orange-500/10",
  },
  "bimbel-xii": {
    icon: GraduationCap,
    color: "text-indigo-600",
    bg: "bg-indigo-500/10",
  },
};

export function ProgramSection({ locale }: { locale: Locale }) {
  const copy = homeContentFor(locale).programs;
  const programText = siteTextFor(locale).programs;

  return (
    <section id="programs" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-primary bg-primary/10 border-primary/20">
            {copy.eyebrow}
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground text-balance">
            {copy.heading}
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            {/* Counted, not typed. This sentence said "Enam program inti" while
                ten cards rendered beneath it. */}
            {copy.lead(formatNumber(locale, featuredPrograms.length))}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredPrograms.map((program) => {
            const visual = programIcons[program.slug];
            const Icon = visual?.icon ?? BookOpen;
            const text = programText[program.slug];
            return (
              <Card
                key={program.slug}
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
                    {text?.title ?? program.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {text?.description ?? program.description}
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
            {copy.allLink}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
