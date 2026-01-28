import { Users, GraduationCap, Building2, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
  {
    label: "Santri",
    value: "1,250+",
    icon: Users,
    description: "Aktif Belajar",
  },
  {
    label: "Alumni",
    value: "3,500+",
    icon: GraduationCap,
    description: "Tersebar di Seluruh Dunia",
  },
  {
    label: "Pengajar",
    value: "150+",
    icon: UserCheck,
    description: "Berkualitas & Tersertifikasi",
  },
  {
    label: "Unit Pendidikan",
    value: "5",
    icon: Building2,
    description: "Jenjang TK hingga SMA",
  },
];

export function StatsSection() {
  return (
    <section id="stats" className="py-12 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="border-none shadow-none bg-background/50 backdrop-blur-sm">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-primary/10 rounded-full text-primary mb-2">
                  <stat.icon className="h-6 w-6" />
                </div>
                <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                <p className="font-medium text-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
