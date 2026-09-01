"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { usePublicVerifyLetter } from "@/hooks/use-correspondence";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  Building,
  RefreshCw,
  Search,
  Lock,
} from "lucide-react";
import { safeFormat } from "@/lib/date";
import { id as localeId } from "date-fns/locale";
import type { PublicLetterVerificationResult } from "@cipansor/shared";

function PublicVerifyContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("code") || searchParams.get("token") || "";

  const [tokenInput, setTokenInput] = useState(tokenFromUrl);
  const [activeToken, setActiveToken] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [triggerNonce, setTriggerNonce] = useState(0);

  // Simple Captcha Anti-Spam
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaPassed, setCaptchaPassed] = useState(false);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    setCaptchaNum1(num1);
    setCaptchaNum2(num2);
    setCaptchaAnswer("");
    setCaptchaPassed(false);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (tokenFromUrl && tokenFromUrl.trim()) {
      setTokenInput(tokenFromUrl.trim());
      setActiveToken(tokenFromUrl.trim());
      setCaptchaPassed(true);
    }
  }, [tokenFromUrl]);

  const { data: result, isLoading: loading, isError, error: queryError, refetch } = usePublicVerifyLetter(
    captchaPassed ? activeToken : undefined,
    triggerNonce
  );

  const verifyToken = (tokenToVerify: string) => {
    const trimmed = tokenToVerify.trim();
    if (!trimmed) return;

    if (!captchaPassed && Number(captchaAnswer) !== captchaNum1 + captchaNum2) {
      setError("Jawaban verifikasi keamanan (CAPTCHA) belum tepat.");
      return;
    }

    setCaptchaPassed(true);
    setError(null);

    if (activeToken === trimmed) {
      refetch();
    } else {
      setActiveToken(trimmed);
      setTriggerNonce((prev) => prev + 1);
    }
  };

  return (
    <main id="main-content" className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-100 text-blue-700 rounded-full mb-2">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Verifikasi Tanda Tangan Elektronik (TTE)
          </h1>
          <p className="text-slate-600 text-sm">
            Portal Resmi Verifikasi Keabsahan Naskah Dinas & Surat Resmi Yayasan Pesantren Cipansor
          </p>
        </div>

        {/* Verification Form Card */}
        <Card className="shadow-md border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Cari & Periksa Token Verifikasi
            </CardTitle>
            <CardDescription>
              Masukkan kode / token verifikasi yang tertera di bawah QR Code dokumen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Token / Kode Verifikasi Dokumen</Label>
              <Input
                id="token"
                placeholder="Masukkan token (contoh: 8f9a2b1c-3d4e-5f6a)"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="font-mono"
              />
            </div>


            {/* Anti Spam CAPTCHA */}
            {!captchaPassed && !tokenFromUrl && (
              <div className="p-3 bg-slate-100 rounded-md border text-sm space-y-2">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Lock className="h-4 w-4 text-blue-600" />
                  Keamanan Anti-Spam: Berapakah <strong>{captchaNum1} + {captchaNum2}</strong>?
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Hasil penjumlahan..."
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className="max-w-[180px] bg-white"
                  />
                  <Button variant="ghost" size="sm" onClick={generateCaptcha}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Acak
                  </Button>
                </div>
              </div>
            )}

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              onClick={() => verifyToken(tokenInput)}
              disabled={loading || !tokenInput.trim()}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Memeriksa Keabsahan...
                </>
              ) : (
                "Verifikasi Dokumen"
              )}
            </Button>

            {(error || isError) && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>
                  {error ||
                    ((queryError as any)?.response?.status === 429
                      ? "Terlalu banyak permintaan verifikasi. Silakan tunggu beberapa saat."
                      : "Terjadi kesalahan atau dokumen tidak dapat diverifikasi.")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification Result Card */}
        {result && (
          <Card
            className={`shadow-lg border-2 ${
              result.isValid
                ? "border-green-500 bg-white"
                : result.isRevoked
                ? "border-orange-500 bg-orange-50/20"
                : "border-red-500 bg-red-50/20"
            }`}
          >
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  {result.isValid ? (
                    <span className="text-green-700 flex items-center gap-2">
                      <ShieldCheck className="h-6 w-6 text-green-600" />
                      DOKUMEN SAH & TERVERIFIKASI
                    </span>
                  ) : result.isRevoked ? (
                    <span className="text-orange-700 flex items-center gap-2">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                      SURAT TELAH DICABUT
                    </span>
                  ) : (
                    <span className="text-red-700 flex items-center gap-2">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                      DOKUMEN TIDAK VALID
                    </span>
                  )}
                </CardTitle>
                <Badge
                  className={
                    result.isValid
                      ? "bg-green-100 text-green-800 hover:bg-green-100 text-sm py-1"
                      : result.isRevoked
                      ? "bg-orange-100 text-orange-800 hover:bg-orange-100 text-sm py-1"
                      : "bg-red-100 text-red-800 hover:bg-red-100 text-sm py-1"
                  }
                >
                  {result.isValid
                    ? "RESMI"
                    : result.isRevoked
                    ? "DICABUT"
                    : "INVALID"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {result.isRevoked && (
                <div className="p-4 bg-orange-100 border border-orange-300 rounded-md text-orange-900 text-sm">
                  <p className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Keterangan Pencabutan:
                  </p>
                  <p className="mt-1">
                    Surat ini telah resmi dicabut oleh penerbit/penandatangan pada{" "}
                    <strong>
                      {result.revokedAt
                        ? safeFormat(new Date(result.revokedAt), "dd MMMM yyyy HH:mm", {
                            locale: localeId,
                          })
                        : "tanggal yang ditentukan"}
                    </strong>
                    . Dokumen ini tidak lagi berlaku untuk keperluan administratif.
                  </p>
                </div>
              )}

              {result.letter && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" /> Detail Naskah Dinas / Surat
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border text-sm">
                    <div>
                      <span className="text-xs text-slate-500 block">Nomor Surat</span>
                      <span className="font-bold text-slate-900">{result.letter.letterNumber}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Unit Penerbit</span>
                      <span className="font-medium text-slate-900 flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        {result.letter.unitName}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-xs text-slate-500 block">Perihal</span>
                      {result.letter.subject ? (
                        <span className="font-medium text-slate-900">{result.letter.subject}</span>
                      ) : (
                        <span className="font-medium text-slate-500 italic flex items-center gap-1">
                          <Lock className="h-3.5 w-3.5" />
                          Perihal dan isi surat tidak ditampilkan (Sifat Surat Rahasia/Terbatas)
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Tanggal Surat</span>
                      <span className="font-medium text-slate-900 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {safeFormat(new Date(result.letter.date), "dd MMMM yyyy", {
                          locale: localeId,
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Status Dokumen</span>
                      <span className="font-medium text-slate-900">{result.letter.status}</span>
                    </div>
                  </div>
                </div>
              )}

              {result.signer && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" /> Informasi Penandatangan Elektronik (TTE)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border text-sm">
                    <div>
                      <span className="text-xs text-slate-500 block">Nama Penandatangan</span>
                      <span className="font-bold text-slate-900">{result.signer.name}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">NIP / Identitas</span>
                      <span className="font-medium text-slate-900">{result.signer.nip}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-xs text-slate-500 block">Jabatan / Wewenang</span>
                      <span className="font-medium text-slate-900">{result.signer.position}</span>
                    </div>
                    {result.signedAt && (
                      <div>
                        <span className="text-xs text-slate-500 block">Waktu Penandatanganan</span>
                        <span className="font-medium text-slate-900">
                          {safeFormat(new Date(result.signedAt), "dd MMMM yyyy HH:mm:ss", {
                            locale: localeId,
                          })} WIB
                        </span>
                      </div>
                    )}
                    {result.digest && (
                      <div>
                        <span className="text-xs text-slate-500 block">Digital Digest SHA-256</span>
                        <span className="font-mono text-xs text-slate-600 truncate block">
                          {result.digest.slice(0, 16)}...{result.digest.slice(-16)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!result.isValid && !result.isRevoked && (
                <div className="text-center py-4 text-red-600 text-sm">
                  {result.reason || "Dokumen ini tidak terdaftar dalam sistem resmi Yayasan Pesantren Cipansor."}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

export default function PublicVerifyLetterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat halaman verifikasi...</div>}>
      <PublicVerifyContent />
    </Suspense>
  );
}
