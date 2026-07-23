import Link from "next/link";
import { ArrowRight, Heart, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { homeContentFor } from "@/config/home.i18n";
import type { Locale } from "@/locales";

export function CtaSection({ locale }: { locale: Locale }) {
  const copy = homeContentFor(locale).cta;

  return (
    <section className="py-20 bg-background border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* SPMB CTA */}
          <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <CardContent className="p-8 md:p-12 flex flex-col justify-center h-full space-y-6">
              <div className="p-3 bg-white/20 w-fit rounded-xl backdrop-blur-sm">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">
                  {copy.spmb.title}
                </h3>
                <p className="text-primary-foreground/90 max-w-md text-lg">
                  {copy.spmb.body}
                </p>
              </div>
              <Link href="/public/spmb">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto gap-2 text-primary font-bold"
                >
                  {copy.spmb.button} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Donation CTA */}
          <Card className="bg-muted border-border overflow-hidden relative">
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <CardContent className="p-8 md:p-12 flex flex-col justify-center h-full space-y-6">
              <div className="p-3 bg-background w-fit rounded-xl border border-border">
                <Heart className="h-8 w-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  {copy.donate.title}
                </h3>
                <p className="text-muted-foreground max-w-md text-lg">
                  {copy.donate.body}
                </p>
              </div>
              <Link href="/wakaf-infaq">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  {copy.donate.button} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
