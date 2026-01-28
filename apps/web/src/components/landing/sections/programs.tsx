import { BookOpen, GraduationCap, Baby, School, BookMarked, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const programs = [
  {
    title: "TK Al-Qur'an",
    description: "Pendidikan usia dini dengan pendekatan bermain sambil belajar Al-Qur'an dan pembiasaan adab.",
    icon: Baby,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "SDIT Cipansor",
    description: "Sekolah Dasar Islam Terpadu yang mencetak generasi cerdas, mandiri, dan berkarakter Qur'ani.",
    icon: School,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    title: "SMPIT Cipansor",
    description: "Pendidikan menengah pertama dengan fokus pada akademik unggul dan hafalan Al-Qur'an.",
    icon: School,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    title: "SMA Al-Qur'an",
    description: "Jenjang menengah atas yang mempersiapkan santri masuk perguruan tinggi dan kepemimpinan.",
    icon: GraduationCap,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    title: "Pesantren Tahfidz",
    description: "Program khusus menghafal Al-Qur'an 30 Juz dengan sanad dan pemahaman ilmu syar'i.",
    icon: BookMarked,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
  },
  {
    title: "Madrasah Diniyah",
    description: "Pendidikan keagamaan sore hari untuk mendalami kitab kuning dan fiqih keseharian.",
    icon: BookOpen,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
];

export function ProgramSection() {
  return (
    <section id="programs" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-primary bg-primary/10 border-primary/20">
            Program Unggulan
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground">
            Jenjang Pendidikan
          </h2>
          <p className="text-lg text-muted-foreground">
            Kami menyediakan berbagai jenjang pendidikan formal dan non-formal untuk memenuhi kebutuhan umat akan pendidikan berkualitas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-border bg-card">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${program.bg}`}>
                  <program.icon className={`h-6 w-6 ${program.color}`} />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {program.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {program.description}
                </CardDescription>
              </CardContent>
              <CardFooter>
                 {/* Placeholder link */}
                 <Button variant="ghost" className="p-0 h-auto font-medium text-primary hover:text-primary/80 hover:bg-transparent group-hover:underline">
                   Selengkapnya <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
