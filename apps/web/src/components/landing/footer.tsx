import Link from "next/link";
import { Facebook, Instagram, Youtube, MapPin, Phone, Mail } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-muted/30 border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Pesantren Cipansor</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Membangun generasi Qur'ani yang berakhlak mulia, cerdas, dan mandiri berlandaskan nilai-nilai Ahlussunnah wal Jama'ah.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Tautan</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#about" className="text-sm text-muted-foreground hover:text-primary">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="#programs" className="text-sm text-muted-foreground hover:text-primary">
                  Program Pendidikan
                </Link>
              </li>
              <li>
                <Link href="/public/ppdb" className="text-sm text-muted-foreground hover:text-primary">
                  Pendaftaran (PPDB)
                </Link>
              </li>
              <li>
                <Link href="/donation/public" className="text-sm text-muted-foreground hover:text-primary">
                  Donasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Programs */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Unit Pendidikan</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">TK Al-Qur'an</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">SDIT Cipansor</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">SMPIT Cipansor</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">SMA Al-Qur'an</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Pesantren Tahfidz</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Hubungi Kami</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">
                  Jl. Pesantren No. 123, Cipansor, Jawa Barat, Indonesia
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">+62 812-3456-7890</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">info@pesantrencipansor.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Yayasan Pesantren Cipansor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
