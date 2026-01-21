"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  Search,
  QrCode,
  Award,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleVerify = () => {
    if (!code.trim()) return;
    setIsSearching(true);
    router.push(`/certificates/verify/${code.trim()}`);
  };

  return (
    <MainLayout showSidebar={false}>
      <div className="max-w-xl mx-auto py-12">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Verifikasi Sertifikat</h1>
          <p className="text-muted-foreground mt-2">
            Pastikan keaslian sertifikat digital yang diterbitkan oleh lembaga
            kami
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Masukkan Kode Verifikasi
            </CardTitle>
            <CardDescription>
              Kode verifikasi dapat ditemukan pada QR Code atau bagian bawah
              sertifikat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Contoh: CERT-2024-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="font-mono"
              />
              <Button
                onClick={handleVerify}
                disabled={!code.trim() || isSearching}
              >
                <Search className="mr-2 h-4 w-4" />
                Verifikasi
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Cara Mendapatkan Kode:</h4>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">
                    1
                  </span>
                  Scan QR Code yang tertera pada sertifikat
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">
                    2
                  </span>
                  Atau salin kode verifikasi di bagian bawah sertifikat
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">
                    3
                  </span>
                  Tempelkan kode pada kolom di atas dan klik Verifikasi
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-2 mt-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Sertifikat Valid</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Jika sertifikat valid, akan muncul informasi lengkap
                    penerima dan detail sertifikat
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium">Sertifikat Tidak Valid</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Jika sertifikat tidak valid, kemungkinan dokumen tersebut
                    palsu atau kode salah
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span>Sertifikat Digital Resmi</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Terverifikasi Sistem</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
