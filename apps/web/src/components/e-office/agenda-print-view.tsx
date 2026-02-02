import React, { forwardRef } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { LetterDetail, LetterDirection } from "@cipansor/shared";

interface AgendaPrintViewProps {
  letters: LetterDetail[];
  direction: LetterDirection;
  unitName?: string;
}

export const AgendaPrintView = forwardRef<HTMLDivElement, AgendaPrintViewProps>(
  ({ letters, direction, unitName }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-white text-black p-8 mx-auto"
        style={{
          width: "297mm", // A4 Landscape Width
          minHeight: "210mm", // A4 Landscape Height
          fontFamily: "Arial, sans-serif",
          fontSize: "10pt",
        }}
      >
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase">BUKU AGENDA SURAT {direction === "INCOMING" ? "MASUK" : "KELUAR"}</h1>
          {unitName && <h2 className="text-lg font-bold uppercase">{unitName}</h2>}
          <p className="text-sm">Dicetak pada: {format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}</p>
        </div>

        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 w-10">No</th>
              <th className="border border-black p-2">Nomor {direction === "INCOMING" ? "Agenda" : "Surat"}</th>
              <th className="border border-black p-2">Tanggal Surat</th>
              <th className="border border-black p-2">{direction === "INCOMING" ? "Tgl Terima" : "Tujuan"}</th>
              <th className="border border-black p-2">{direction === "INCOMING" ? "Pengirim" : "Perihal"}</th>
              <th className="border border-black p-2 w-1/4">Ringkasan / Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {letters.map((letter, index) => (
              <tr key={letter.id}>
                <td className="border border-black p-2 text-center">{index + 1}</td>
                <td className="border border-black p-2">
                  {direction === "INCOMING" ? letter.agendaNumber || "-" : letter.letterNumber || "-"}
                </td>
                <td className="border border-black p-2">
                   {format(new Date(letter.date), "dd/MM/yyyy", { locale: id })}
                </td>
                <td className="border border-black p-2">
                  {direction === "INCOMING"
                    ? (letter.receivedAt ? format(new Date(letter.receivedAt), "dd/MM/yyyy", { locale: id }) : "-")
                    : (letter.recipientName || letter.recipientInstance || "-")
                  }
                </td>
                <td className="border border-black p-2">
                  {direction === "INCOMING"
                    ? (letter.senderName || letter.senderInstance || "-")
                    : letter.subject
                  }
                </td>
                <td className="border border-black p-2">
                  {direction === "INCOMING" ? letter.subject : "-"}
                  {letter.content && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{letter.content}</div>}
                </td>
              </tr>
            ))}
            {letters.length === 0 && (
               <tr>
                 <td colSpan={6} className="border border-black p-4 text-center">Tidak ada data.</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
);

AgendaPrintView.displayName = "AgendaPrintView";
