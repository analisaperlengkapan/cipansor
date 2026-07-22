"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Real pages, not on-page anchors.
 *
 * These used to be `#about`, `#programs`, `#units`, `#news` — the whole site
 * was one document with five hash links, which left search engines (and the
 * Google Ad Grants review, which rejected the account for exactly this) with a
 * single indexable URL and no substantial content behind the menu.
 */
const navItems = [
  { title: "Beranda", href: "/" },
  { title: "Profil", href: "/profil" },
  { title: "Program Unggulan", href: "/program-unggulan" },
  { title: "Unit Pendidikan", href: "/unit" },
  { title: "Berita", href: "/berita" },
  { title: "Wakaf & Infaq", href: "/wakaf-infaq" },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll(); // Initialize on mount
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300 border-b border-transparent",
        scrolled
          ? "bg-background/80 backdrop-blur-md border-border shadow-sm"
          : "bg-transparent",
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/cipansor/logo-cipansor.webp"
              alt="Logo Pesantren Cipansor"
              width={32}
              height={32}
              priority
              className="h-8 w-8 object-contain"
            />
            <span className="whitespace-nowrap text-lg font-bold tracking-tight text-foreground">
              Pesantren Cipansor
            </span>
          </Link>

          {/*
            Switch at 1100px, measured rather than guessed.

            This used to sit at `xl` (1280px) on the estimate that the row
            needed ~1220px. Measured in the browser it needs 1062px: 202px of
            brand, 796px of nav, 64px of container padding. The 218px of slack
            mattered, because 1280px is exactly where a 1920x1080 laptop lands
            at 150% Windows scaling — and a hair under it once the scrollbar is
            counted. Anyone on that very common setup, or at 175%, got the
            mobile hamburger on a full-size desktop screen.

            1100px gives the row ~38px of real clearance. `lg` (1024px) would
            not: 1024 - 64 of padding leaves 960 for 998px of content, so it
            would overflow — which is what the earlier note about the brand
            "colliding with the first item" was seeing. Below 1100 the
            hamburger is the right answer, not a squeezed row.
            `whitespace-nowrap` keeps a label from breaking mid-phrase
            ("Program / Unggulan").
          */}
          <nav className="hidden min-[1100px]:flex items-center gap-5 2xl:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.title}
              </Link>
            ))}
            <div className="flex items-center gap-2 pl-2 border-l border-border ml-2">
              <Link href="/login">
                <Button size="sm" variant="outline" className="gap-2 whitespace-nowrap">
                  <User className="h-4 w-4" />
                  Login Portal
                </Button>
              </Link>
              <Link href="/public/spmb">
                <Button size="sm" className="whitespace-nowrap bg-primary hover:bg-primary/90">
                  Daftar SPMB
                </Button>
              </Link>
            </div>
          </nav>

          {/* Mobile Nav — must mirror the desktop breakpoint above. */}
          <div className="min-[1100px]:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-6">
                <SheetHeader>
                  <SheetTitle className="text-left flex items-center gap-2">
                    <Image
                      src="/images/cipansor/logo-cipansor.webp"
                      alt="Logo Pesantren Cipansor"
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                    Pesantren Cipansor
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {item.title}
                    </Link>
                  ))}
                  <div className="h-px bg-border my-2" />
                  <Link href="/login">
                    <Button className="w-full justify-start" variant="outline">
                      <User className="h-4 w-4 mr-2" />
                      Login Portal
                    </Button>
                  </Link>
                  <Link href="/public/spmb">
                    <Button className="w-full justify-start">
                      Daftar SPMB
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
