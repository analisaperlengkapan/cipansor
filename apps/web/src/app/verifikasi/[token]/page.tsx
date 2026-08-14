import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

/**
 * Halaman verifikasi keaslian surat — tujuan QR yang tercetak pada naskah.
 *
 * Terbuka untuk umum dan memang harus begitu: yang memindai QR adalah pihak
 * luar yang tidak punya akun di sini — dinas, wali santri, calon mitra.
 * Menaruhnya di balik login membuat fiturnya tidak ada gunanya.
 *
 * Yang dijaga bukan aksesnya, melainkan **apa yang dijawab**. Halaman ini tidak
 * pernah menampilkan isi surat. QR menempel pada lembar yang bisa saja bertanda
 * "SANGAT RAHASIA"; halaman publik yang menayangkan isinya justru membocorkan
 * surat yang derajat kerahasiaannya ada untuk mencegah hal itu. Perihal pun
 * hanya ditampilkan bila suratnya bersifat Biasa (server yang memutuskan, lihat
 * EsignService.verifyByToken).
 *
 * Yang dijawab hanyalah pertanyaan yang memang ditanyakan pemindai: benarkah
 * surat ini terbit dari Yayasan, siapa yang menandatangani, kapan, dan masih
 * utuh atau sudah berubah.
 */

export const metadata: Metadata = {
  title: `Verifikasi Keaslian Surat — ${siteConfig.legalName}`,
  description:
    "Periksa keaslian surat yang diterbitkan Yayasan Pesantren Cipansor melalui kode QR pada naskah.",
  // Halaman hasil verifikasi tidak perlu diindeks mesin pencari.
  robots: { index: false, follow: false },
};

interface VerifyResult {
  found: boolean;
  valid?: boolean;
  intact?: boolean;
  revoked?: boolean;
  revokedReason?: string | null;
  letterNumber?: string | null;
  letterType?: string;
  nature?: string;
  subject?: string | null;
  date?: string;
  unitName?: string | null;
  signerName?: string;
  signedAt?: string;
}

async function fetchVerification(token: string): Promise<VerifyResult | null> {
  // This is the one fetch in the app that runs on the *server* — it is a server
  // component, rendered inside the web container before any browser sees it.
  //
  // So it cannot use NEXT_PUBLIC_API_URL: that value is deliberately empty in
  // production to make the browser's base relative, and a relative URL has no
  // origin to resolve against here. It also should not use the public origin,
  // which is what it did before: the request left the container, crossed
  // Cloudflare and came back to the same machine, so a QR scan depended on
  // public DNS and the CDN being healthy to read a row from our own database.
  //
  // API_INTERNAL_URL points straight at the API over the compose network
  // (http://api:3001). Not a NEXT_PUBLIC_ name on purpose: those are inlined at
  // build time, and this one has to be read at runtime.
  const base =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001";
  try {
    const res = await fetch(`${base}/api/esign/verify/${encodeURIComponent(token)}`, {
      // Keaslian harus dijawab dari keadaan sekarang, bukan dari cache: surat
      // yang tanda tangannya baru dicabut tidak boleh tetap tampak sah.
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

function fmt(value?: string | null) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function fmtDateTime(value?: string | null) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

const TYPE_LABEL: Record<string, string> = {
  SURAT_DINAS: "Surat Dinas",
  NOTA_DINAS: "Nota Dinas",
  SURAT_KEPUTUSAN: "Surat Keputusan",
  SURAT_TUGAS: "Surat Tugas",
  SURAT_EDARAN: "Surat Edaran",
  SURAT_UNDANGAN: "Surat Undangan",
  SURAT_KETERANGAN: "Surat Keterangan",
  BERITA_ACARA: "Berita Acara",
  PENGUMUMAN: "Pengumuman",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-3 sm:flex-row sm:gap-4">
      <dt className="w-full text-sm text-muted-foreground sm:w-56">{label}</dt>
      <dd className="flex-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

export default async function VerifikasiPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await fetchVerification(token);

  const notFound = !result || !result.found;
  const valid = !notFound && result!.valid === true;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {siteConfig.legalName}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Verifikasi Keaslian Surat
        </h1>

        {notFound ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-800">Surat tidak ditemukan</p>
            <p className="mt-1 text-sm text-red-700">
              Kode verifikasi tidak dikenali. Pastikan QR dipindai dengan benar,
              atau hubungi Tata Usaha Yayasan untuk memastikan keaslian dokumen.
            </p>
          </div>
        ) : (
          <>
            <div
              className={`mt-6 rounded-lg border p-4 ${
                valid
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <p
                className={`font-semibold ${
                  valid ? "text-emerald-800" : "text-red-800"
                }`}
              >
                {valid
                  ? "Surat ini terverifikasi asli"
                  : result!.revoked
                    ? "Tanda tangan surat ini telah dicabut"
                    : "Surat ini tidak dapat diverifikasi"}
              </p>
              <p
                className={`mt-1 text-sm ${
                  valid ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {valid
                  ? "Tanda tangan elektroniknya cocok dan naskahnya tidak berubah sejak ditandatangani."
                  : result!.revoked
                    ? result!.revokedReason
                      ? `Alasan pencabutan: ${result!.revokedReason}`
                      : "Tanda tangan dicabut oleh penerbit."
                    : "Naskah berbeda dari yang ditandatangani, atau tanda tangannya tidak sah. Jangan dijadikan pegangan; hubungi Tata Usaha Yayasan."}
              </p>
            </div>

            <dl className="mt-6">
              <Row label="Nomor surat" value={result!.letterNumber || "-"} />
              <Row
                label="Jenis naskah"
                value={TYPE_LABEL[result!.letterType ?? ""] ?? result!.letterType ?? "-"}
              />
              {/* Perihal hanya untuk surat bersifat Biasa — server yang menyaring. */}
              {result!.subject && <Row label="Perihal" value={result!.subject} />}
              <Row label="Tanggal surat" value={fmt(result!.date)} />
              <Row label="Unit penerbit" value={result!.unitName || siteConfig.legalName} />
              <Row label="Ditandatangani oleh" value={result!.signerName || "-"} />
              <Row label="Waktu penandatanganan" value={fmtDateTime(result!.signedAt)} />
            </dl>

            {!result!.subject && (
              <p className="mt-4 text-xs text-muted-foreground">
                Perihal dan isi surat tidak ditampilkan pada halaman publik
                karena sifat kerahasiaan naskah ini. Halaman ini hanya
                membuktikan keasliannya.
              </p>
            )}
          </>
        )}

        <div className="mt-8 border-t border-border pt-4 text-sm">
          <Link href="/" className="font-medium text-primary hover:underline">
            Kembali ke situs {siteConfig.legalName}
          </Link>
        </div>
      </div>
    </main>
  );
}
