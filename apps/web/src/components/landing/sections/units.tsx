import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { educationUnits } from "@/config/site";

export function UnitsSection() {
  return (
    <section id="units" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-primary bg-primary/10 border-primary/20">
            Unit Pendidikan
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground text-balance">
            Satu Jalur Pendidikan, dari Taman Kanak-Kanak hingga Takhosus
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Lima unit pendidikan yang saling menyambung, sehingga santri dapat
            menempuh seluruh jenjang tanpa terputus pembinaan hafalan dan
            karakternya.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {educationUnits.map((unit) => (
            <Card
              key={unit.slug}
              className="flex flex-col border-border bg-card hover:shadow-lg transition-shadow duration-300"
            >
              <CardHeader>
                <div className="relative h-16 w-16 mb-4">
                  <Image
                    src={unit.logo}
                    alt={`Logo ${unit.name}`}
                    fill
                    sizes="64px"
                    className="object-contain"
                  />
                </div>
                <CardTitle className="text-xl">{unit.name}</CardTitle>
                <p className="text-sm font-medium text-primary">
                  {unit.tagline}
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <CardDescription className="flex-1 text-base leading-relaxed">
                  {unit.description}
                </CardDescription>
                {/* Each unit has its own page; without this the homepage card
                    was a dead end and the page was reachable only from the nav. */}
                <Link
                  href={`/unit/${unit.slug}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Selengkapnya
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
