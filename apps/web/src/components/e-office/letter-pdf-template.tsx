"use client";

import React, { forwardRef, useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { safeFormat } from "@/lib/date";
import { id } from "date-fns/locale";

import { LetterDetail } from "@cipansor/shared";

interface LetterPDFTemplateProps {
  letter: LetterDetail;
}

export const LetterPDFTemplate = forwardRef<
  HTMLDivElement,
  LetterPDFTemplateProps
>(({ letter }, ref) => {
  /**
   * The QR is rendered offscreen to a canvas and then printed as a PNG data
   * URL, rather than placed in the naskah as a live <canvas>.
   *
   * This template is not only displayed — html2canvas rasterises it into the
   * downloaded PDF. A `<canvas>` survives that only through html2canvas's
   * clone path for canvas elements; an `<img>` with a data URL is the one
   * thing it copies unconditionally. Getting this wrong would produce exactly
   * the bug being fixed: a letter that looks signed on screen and downloads
   * with nothing to scan.
   */
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const qrSourceRef = React.useRef<HTMLCanvasElement | null>(null);

  // Set after mount, not during render: the letter page is a client component
  // but still server-rendered first, and `window` is not there for that pass.
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const signatures = letter?.signatures ?? [];
  // Revoked signatures stay in the record so a circulated letter can still be
  // explained, but the naskah must not print one as if it were valid.
  const signature = signatures.filter((s) => !s.revokedAt).at(-1);
  const verifyUrl =
    signature && origin ? `${origin}/verifikasi/${signature.verificationToken}` : "";

  useEffect(() => {
    if (!verifyUrl) {
      setQrDataUrl(null);
      return;
    }
    // The offscreen canvas is painted by QRCodeCanvas below on the same commit,
    // so it is readable here.
    setQrDataUrl(qrSourceRef.current?.toDataURL("image/png") ?? null);
  }, [verifyUrl]);

  if (!letter) return null;

  const unit = letter.unit;
  const signer = letter.reviewers?.find((r) => r.isSigner);
  const signerName =
    signature?.signer?.name ||
    signer?.reviewer?.name ||
    ".........................";
  const signerNip =
    signature?.signer?.nip ||
    signer?.reviewer?.teacher?.nip ||
    signer?.reviewer?.staff?.nip ||
    "-";

  return (
    <div
      ref={ref}
      data-letter-naskah
      className="bg-white text-black p-8 mx-auto"
      style={{
        width: "210mm", // A4 Width
        minHeight: "297mm", // A4 Height
        fontFamily: "Times New Roman, serif",
        fontSize: "12pt",
        lineHeight: "1.5",
      }}
    >
      {/* Kop Surat */}
      {unit && (
        <div className="flex items-center gap-4 mb-2 pb-4 border-b-4 border-double border-black">
          {unit.logoUrl && (
            <img
              src={unit.logoUrl}
              alt="Logo"
              className="h-24 w-24 object-contain"
            />
          )}
          <div className="flex-1 text-center">
            <h3 className="text-lg font-bold uppercase tracking-wide">
              YAYASAN PESANTREN CIPANSOR
            </h3>
            <h1 className="text-2xl font-bold uppercase text-black mb-1">
              {unit.name}
            </h1>
            <p className="text-sm font-normal text-gray-800">{unit.address}</p>
            <p className="text-sm font-normal text-gray-800">
              Telp: {unit.phone || "-"} | Email: {unit.email || "-"}
            </p>
          </div>
        </div>
      )}

      {/* Header Content */}
      <div className="mt-6 flex justify-between items-start">
        <div className="space-y-1">
          <table className="border-collapse">
            <tbody>
              <tr>
                <td className="w-24">Nomor</td>
                <td className="w-4 text-center">:</td>
                <td>{letter.letterNumber || letter.agendaNumber || "DRAFT"}</td>
              </tr>
              <tr>
                <td>Lampiran</td>
                <td className="text-center">:</td>
                <td>-</td>
              </tr>
              <tr>
                <td>Perihal</td>
                <td className="text-center">:</td>
                <td className="font-bold">{letter.subject}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="text-right">
          <p>
            {safeFormat(new Date(letter.date), "dd MMMM yyyy", { locale: id })}
          </p>
        </div>
      </div>

      {/* Recipient */}
      <div className="mt-8">
        <p>Kepada Yth.</p>
        <p className="font-bold">
          {letter.recipientName || letter.recipientInstance || "Bapak/Ibu"}
        </p>
        <p>
          di <span className="capitalize">Tempat</span>
        </p>
      </div>

      {/* Body */}
      <div className="mt-8 text-justify whitespace-pre-wrap min-h-[300px]">
        {letter.content}
      </div>

      {/*
        Tanda tangan.

        Ketika surat sudah ditandatangani secara elektronik, ruang kosong untuk
        tanda tangan basah diganti QR — bukan ditambahi. Menyediakan keduanya
        berarti mengundang tanda tangan basah di atas surat yang sudah sah
        secara elektronik, dan pembaca tidak lagi tahu mana yang mengesahkan.

        Sebelumnya QR hanya muncul sekali di dialog penandatanganan dengan
        pesan "bubuhkan pada naskah": naskah yang diunduh sama persis dengan
        naskah yang belum ditandatangani, sehingga surat cetak tidak bisa
        diverifikasi sama sekali.
      */}
      <div className="mt-12 flex justify-end">
        <div className="text-center w-72">
          <p className={signature ? "mb-2" : "mb-20"}>Hormat Kami,</p>

          {signature ? (
            <div className="flex flex-col items-center">
              <img
                src={qrDataUrl ?? undefined}
                alt={`QR verifikasi surat ${letter.letterNumber ?? ""}`}
                width={104}
                height={104}
                className="h-26 w-26"
                style={{ height: "104px", width: "104px" }}
              />
              <p className="mt-1 text-[8pt] leading-tight text-gray-700">
                Ditandatangani secara elektronik
              </p>
              <p className="text-[8pt] leading-tight text-gray-700">
                {safeFormat(new Date(signature.signedAt), "dd MMMM yyyy HH:mm", {
                  locale: id,
                })}{" "}
                WIB
              </p>
            </div>
          ) : null}

          <p className="mt-1 font-bold underline uppercase">{signerName}</p>
          <p>NIP. {signerNip}</p>

          {signature && (
            /*
              Dicetak apa adanya di bawah QR: pemindai yang kameranya tidak
              jalan, atau penerima yang memegang fotokopi buram, tetap punya
              alamat yang bisa diketik. QR tanpa alamat tercetak adalah QR yang
              gagal begitu gambarnya rusak.
            */
            <p className="mt-2 break-all text-[7pt] leading-tight text-gray-600">
              Verifikasi keaslian: {verifyUrl}
            </p>
          )}
        </div>
      </div>

      {/*
        Sumber QR — hanya dibaca lewat toDataURL(), tidak pernah ikut tercetak.

        `display: none` aman di sini: isi kanvas digambar oleh JavaScript lewat
        context 2D, bukan oleh layout CSS, jadi kanvas yang tidak dilayout tetap
        berisi gambar yang sama. Menyembunyikannya dengan posisi absolut di luar
        layar justru berisiko: html2canvas menghitung area tangkapan dari kotak
        elemen, dan anak yang menjorok jauh ke kiri bisa menggeser hasilnya.
      */}
      {verifyUrl && (
        <div aria-hidden="true" style={{ display: "none" }}>
          <QRCodeCanvas
            ref={qrSourceRef}
            value={verifyUrl}
            size={104}
            level="M"
            marginSize={1}
          />
        </div>
      )}
    </div>
  );
});

LetterPDFTemplate.displayName = "LetterPDFTemplate";
