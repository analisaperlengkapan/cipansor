import React, { forwardRef } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { LetterDetail } from "@cipansor/shared";

interface LetterPDFTemplateProps {
  letter: LetterDetail;
}

export const LetterPDFTemplate = forwardRef<HTMLDivElement, LetterPDFTemplateProps>(
  ({ letter }, ref) => {
    if (!letter) return null;

    const unit = letter.unit;
    const signer = letter.reviewers?.find((r) => r.isSigner);
    const signerName = signer?.reviewer?.name || ".........................";
    const signerNip =
      signer?.reviewer?.teacher?.nip || signer?.reviewer?.staff?.nip || "-";

    return (
      <div
        ref={ref}
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
              <p className="text-sm font-normal text-gray-800">
                {unit.address}
              </p>
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
                  <td>
                    {letter.letterNumber || letter.agendaNumber || "DRAFT"}
                  </td>
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
              {format(new Date(letter.date), "dd MMMM yyyy", { locale: id })}
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
            di{" "}
            <span className="capitalize">
              Tempat
            </span>
          </p>
        </div>

        {/* Body */}
        <div className="mt-8 text-justify whitespace-pre-wrap min-h-[300px]">
          {letter.content}
        </div>

        {/* Signature */}
        <div className="mt-12 flex justify-end">
          <div className="text-center w-64">
            <p className="mb-20">Hormat Kami,</p>

            {/* Signature Placeholder/Image */}
            {/*
            {letter.status === 'SIGNED' && (
               <img src="/signature-placeholder.png" className="h-20 mx-auto" />
            )}
            */}

            <p className="font-bold underline uppercase">{signerName}</p>
            <p>NIP. {signerNip}</p>
          </div>
        </div>
      </div>
    );
  }
);

LetterPDFTemplate.displayName = "LetterPDFTemplate";
