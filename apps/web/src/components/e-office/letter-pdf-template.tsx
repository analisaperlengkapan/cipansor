"use client";

import React, { forwardRef, useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { safeFormat } from "@/lib/date";
import { siteConfig } from "@/config/site";
import { id } from "date-fns/locale";

import {
  DECIDING_OFFICIAL,
  LetterDetail,
  LETTERHEAD,
  LetterType,
  letterTemplateFor,
  natureMarking,
} from "@cipansor/shared";

/**
 * Jabatan penetap sebagaimana ditulis di bawah tanda tangan.
 */
const DECIDING_OFFICIAL_TITLE_CASE = DECIDING_OFFICIAL.split(" ")
  .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
  .join(" ");

interface LetterPDFTemplateProps {
  letter: LetterDetail;
}

export const LetterPDFTemplate = forwardRef<
  HTMLDivElement,
  LetterPDFTemplateProps
>(({ letter }, ref) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const qrSourceRef = React.useRef<HTMLCanvasElement | null>(null);

  const signatures = letter?.signatures ?? [];
  const signature = signatures.filter((s) => !s.revokedAt).at(-1);
  const qrCodeValue = signature ? signature.verificationToken : "";

  const publicSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url || "https://cipansor.or.id";
  const publicVerifyUrl = `${publicSiteUrl.replace(/\/$/, "")}/public/verify-letter`;

  useEffect(() => {
    if (!qrCodeValue) {
      setQrDataUrl(null);
      return;
    }
    setQrDataUrl(qrSourceRef.current?.toDataURL("image/png") ?? null);
  }, [qrCodeValue]);

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

  const type = (letter.type as LetterType | undefined) ?? LetterType.SURAT_DINAS;
  const template = letterTemplateFor(type);
  const centredTitle = template.title;
  const hasTitle = centredTitle.length > 0;
  const isAddressed = template.addressed;
  const isDecree = template.decree === true;

  const marking = natureMarking(letter.nature);
  const signerTitle = letter.senderTitle?.trim() ?? "";

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
      {marking && (
        <p className="mb-2 text-right text-sm font-bold uppercase tracking-widest">
          {marking}
        </p>
      )}

      {/* Kop surat */}
      <div className="mb-2 flex items-center gap-4 border-b-4 border-double border-black pb-3">
        <img
          src={unit?.logoUrl || "/images/cipansor/logo-cipansor.webp"}
          alt="Logo Yayasan Pesantren Cipansor"
          className="h-24 w-24 shrink-0 object-contain"
        />
        <div className="flex-1 text-center">
          <h3 className="text-lg font-bold uppercase tracking-wide">
            {LETTERHEAD.organisation}
          </h3>
          {unit?.name && (
            <h1 className="mb-1 text-xl font-bold uppercase">{unit.name}</h1>
          )}
          <p className="text-[9pt] font-normal text-gray-800">
            {LETTERHEAD.legalBasis}
          </p>
          {unit?.address ? (
            <>
              <p className="text-[9pt] font-normal text-gray-800">
                {unit.address}
              </p>
              <p className="text-[9pt] font-normal text-gray-800">
                {LETTERHEAD.website} &nbsp;{" "}
                {unit.phone ? `Tlp/HP. ${unit.phone}` : LETTERHEAD.phone}
                {unit.email ? ` \u00b7 ${unit.email}` : ""}
              </p>
            </>
          ) : (
            <>
              <p className="text-[9pt] font-normal text-gray-800">
                {LETTERHEAD.addressLine1}
              </p>
              <p className="text-[9pt] font-normal text-gray-800">
                {LETTERHEAD.addressLine2} &nbsp; {LETTERHEAD.website} &nbsp;{" "}
                {LETTERHEAD.phone}
              </p>
            </>
          )}
        </div>
      </div>

      {hasTitle ? (
        <div className="mt-8 text-center">
          <h2 className="text-lg font-bold uppercase">{centredTitle}</h2>
          <p className="mt-1">
            Nomor: {letter.letterNumber || letter.agendaNumber || "DRAFT"}
          </p>
          {template.subjectHeading && letter.subject && (
            <>
              <p className="mt-3">Tentang</p>
              <p className="font-bold uppercase">{letter.subject}</p>
            </>
          )}
          {isDecree && (
            <p className="mt-6 font-bold uppercase">{DECIDING_OFFICIAL}</p>
          )}
        </div>
      ) : (
        <div className="mt-6 flex items-start justify-between">
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
              {LETTERHEAD.city},{" "}
              {safeFormat(new Date(letter.date), "dd MMMM yyyy", { locale: id })}
            </p>
          </div>
        </div>
      )}

      {isAddressed && (
        <div className="mt-8">
          <p>Kepada Yth.</p>
          <p className="font-bold">
            {letter.recipientName || letter.recipientInstance || "Bapak/Ibu"}
          </p>
          {letter.recipientInstance &&
            letter.recipientInstance !== letter.recipientName && (
              <p>{letter.recipientInstance}</p>
            )}
          <p>
            di <span className="capitalize">Tempat</span>
          </p>
        </div>
      )}

      <div className="mt-8 min-h-[300px] space-y-4 text-justify">
        {(letter.content ?? "")
          .split(/\n\s*\n/)
          .filter((para) => para.trim().length > 0)
          .map((para, i) => (
            <p
              key={i}
              data-naskah-block
              className={
                isDecree && /^MEMUTUSKAN:?$/i.test(para.trim())
                  ? "whitespace-pre-wrap text-center font-bold tracking-widest"
                  : "whitespace-pre-wrap"
              }
            >
              {para}
            </p>
          ))}
      </div>

      <div className="mt-12 flex justify-end">
        <div className="text-center w-72">
          {isDecree ? (
            <div className={`text-left ${signature ? "mb-2" : "mb-20"}`}>
              <p>Ditetapkan di&nbsp;: {LETTERHEAD.city}</p>
              <p>
                Pada tanggal&nbsp;:{" "}
                {safeFormat(new Date(letter.date), "dd MMMM yyyy", { locale: id })}
              </p>
              <p className="mt-1">{DECIDING_OFFICIAL_TITLE_CASE}</p>
            </div>
          ) : isAddressed ? (
            <p className={signature ? "mb-2" : "mb-20"}>Hormat Kami,</p>
          ) : (
            <div className={signature ? "mb-2" : "mb-20"}>
              <p>
                {LETTERHEAD.city},{" "}
                {safeFormat(new Date(letter.date), "dd MMMM yyyy", { locale: id })}
              </p>
              <p>{siteConfig.legalName}</p>
              {signerTitle && <p>{signerTitle}</p>}
            </div>
          )}

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
                {new Intl.DateTimeFormat("id-ID", {
                  timeZone: "Asia/Jakarta",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }).format(new Date(signature.signedAt))}{" "}
                WIB
              </p>
            </div>
          ) : null}

          <p className="mt-1 font-bold underline uppercase">{signerName}</p>
          {signerNip !== "-" && <p>NIP. {signerNip}</p>}

          {signature && (
            <p className="mt-2 break-all text-[7pt] leading-tight text-gray-600">
              Verifikasi keaslian: {publicVerifyUrl}
            </p>
          )}
        </div>
      </div>

      {qrCodeValue && (
        <div aria-hidden="true" style={{ display: "none" }}>
          <QRCodeCanvas
            ref={qrSourceRef}
            value={qrCodeValue}
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
