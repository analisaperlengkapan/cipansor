import { CalendarDays, Building2, BookMarked, Languages } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig, educationUnits, featuredPrograms } from "@/config/site";

/**
 * Only facts that can be checked against the pesantren's own published
 * profile. Enrollment and alumni counts are deliberately absent — publishing
 * numbers we cannot substantiate is an Ad Grants misrepresentation risk.
 */
const stats = [
  {
    label: "Berdiri Sejak",
    value: String(siteConfig.establishedYear),
    icon: CalendarDays,
    description: `Lebih dari ${new Date().getFullYear() - siteConfig.establishedYear} tahun mengabdi`,
  },
  {
    label: "Unit Pendidikan",
    value: String(educationUnits.length),
    icon: Building2,
    description: "Jenjang TKQ hingga Takhosus",
  },
  {
    label: "Program Unggulan",
    value: String(featuredPrograms.length),
    icon: BookMarked,
    description: "Tahfidz, kitab, hingga kepemimpinan",
  },
  {
    label: "Bahasa Pembiasaan",
    value: "2",
    icon: Languages,
    description: "Bahasa Arab & Bahasa Inggris",
  },
];

export function StatsSection() {
  return (
    <section
      id="stats"
      aria-labelledby="stats-heading"
      className="py-12 bg-muted/30 border-y border-border"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/*
          The section had no heading of its own, so the four figures below were
          marked up as <h3> to get the large type. That put "1911", "5", "10"
          and "2" into the document outline directly under the <h1> — someone
          navigating by heading heard four bare numbers, and the outline jumped
          h1 -> h3. The figures are now a description list (which is what they
          are), and this visually-hidden heading names the section.
        */}
        <h2 id="stats-heading" className="sr-only">
          Sekilas Pesantren Cipansor
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="border-none shadow-none bg-background/50 backdrop-blur-sm"
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-primary/10 rounded-full text-primary mb-2">
                  <stat.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                {/*
                  `order` flips the visual arrangement so the figure still reads
                  large-above-label, while the DOM keeps the <dt> before its
                  <dd> — both valid markup and a sensible reading order
                  ("Berdiri Sejak, 1911" rather than "1911, Berdiri Sejak").
                */}
                <dl className="flex flex-col items-center space-y-2">
                  <dt className="order-2 font-medium text-foreground">
                    {stat.label}
                  </dt>
                  <dd className="order-1 text-3xl font-bold text-foreground">
                    {stat.value}
                  </dd>
                  <dd className="order-3 text-xs text-muted-foreground">
                    {stat.description}
                  </dd>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
