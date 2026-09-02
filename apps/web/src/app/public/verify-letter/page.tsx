"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useCaptchaChallenge, useVerifyPdfLetter } from "@/hooks/use-correspondence";
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
  Upload,
  Lock,
  FileUp,
} from "lucide-react";
import { safeFormat } from "@/lib/date";
import { id as localeId } from "date-fns/locale";
import type { PublicLetterVerificationResult } from "@cipansor/shared";

function formatWibTimestamp(dateInput?: Date | string | null, includeSeconds = false) {
  if (!dateInput) return "-";
  try {
    const d = new Date(dateInput);
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...(includeSeconds ? { second: "2-digit" } : {}),
      hour12: false,
    }).format(d);
  } catch {
    return "-";
  }
}

function PublicVerifyContent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<PublicLetterVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Anti-Spam CAPTCHA (Server-side challenge token)
  const { data: captchaData, refetch: refetchCaptcha } = useCaptchaChallenge();
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const verifyPdfMutation = useVerifyPdfLetter();

  const refreshCaptcha = () => {
    setCaptchaAnswer("");
    refetchCaptcha();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        setError("Format file harus berupa PDF.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleVerify = async () => {
    if (!selectedFile) {
      setError("Silakan pilih file PDF dokumen terlebih dahulu.");
      return;
    }

    if (!captchaData?.token) {
      setError("Sesi CAPTCHA belum siap. Silakan muat ulang halaman.");
      return;
    }

    if (!captchaAnswer) {
      setError("Jawaban verifikasi keamanan (CAPTCHA) wajib diisi.");
      return;
    }

    setError(null);
    setResult(null);

    try {
      const data = await verifyPdfMutation.mutateAsync({
        file: selectedFile,
        captchaToken: captchaData.token,
        captchaAnswer,
      });
      setResult(data);
      refreshCaptcha();
    } catch (err: any) {
      refreshCaptcha();
      if (err?.response?.status === 429) {
        setError("Terlalu banyak permintaan verifikasi. Silakan tunggu beberapa saat.");
      } else {
        setError(
          err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            "Terjadi kesalahan saat memverifikasi dokumen PDF."
        );
      }
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
              <Upload className="h-5 w-5 text-blue-600" />
              Unggah File PDF Surat / Naskah Dinas
            </CardTitle>
            <CardDescription>
              Unggah berkas PDF dokumen resmi untuk memverifikasi keabsahan tanda tangan elektronik.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-file">Berkas Dokumen PDF</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pdf-file"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="bg-white cursor-pointer"
                />
              </div>
              {selectedFile && (
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                  <FileUp className="h-3.5 w-3.5 text-blue-600" />
                  File terpilih: <span className="font-semibold text-slate-800">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Anti Spam CAPTCHA */}
            <div className="p-3 bg-slate-100 rounded-md border text-sm space-y-2">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Lock className="h-4 w-4 text-blue-600" />
                Keamanan Anti-Spam: Berapakah{" "}
                <strong>
                  {captchaData ? `${captchaData.num1} + ${captchaData.num2}` : "..."}
                </strong>
                ?
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Hasil..."
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="max-w-[180px] bg-white"
                />
                <Button variant="ghost" size="sm" onClick={refreshCaptcha}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Acak
                </Button>
              </div>
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              onClick={handleVerify}
              disabled={verifyPdfMutation.isPending || !selectedFile}
            >
              {verifyPdfMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Memeriksa Keabsahan Dokumen...
                </>
              ) : (
                "Verifikasi Dokumen"
              )}
            </Button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
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
                        ? `${formatWibTimestamp(result.revokedAt, true)} WIB`
                        : "tanggal yang ditentukan"}
                    </strong>
                    . Dokumen ini tidak lagi berlaku untuk keperluan administratif.
                  </p>
                  {/* The reason is the whole point of asking for one. Without
                      it the page can only say "dicabut" and leave the reader
                      to guess whether the letter was wrong, superseded, or
                      issued to the wrong person — which is exactly what they
                      came here to find out. */}
                  {result.revokedReason && (
                    <p className="mt-3 border-t border-orange-300 pt-3">
                      <span className="block text-xs uppercase tracking-wider text-orange-700">
                        Alasan pencabutan
                      </span>
                      <span className="font-medium whitespace-pre-line">
                        {result.revokedReason}
                      </span>
                    </p>
                  )}
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
                      <div className="sm:col-span-2">
                        <span className="text-xs text-slate-500 block">Waktu Penandatanganan</span>
                        <span className="font-medium text-slate-900">
                          {formatWibTimestamp(result.signedAt, true)} WIB
                        </span>
                      </div>
                    )}
                    {result.digest && (
                      <div className="sm:col-span-2">
                        <span className="text-xs text-slate-500 block">Digital Digest SHA-256</span>
                        <span className="font-mono text-xs text-slate-600 truncate block">
                          {result.digest}
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
