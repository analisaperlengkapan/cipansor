import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { HeroSection } from "@/components/landing/sections/hero";
import { StatsSection } from "@/components/landing/sections/stats";
import { AboutSection } from "@/components/landing/sections/about";
import { ProgramSection } from "@/components/landing/sections/programs";
import { CtaSection } from "@/components/landing/sections/cta";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <AboutSection />
        <ProgramSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
