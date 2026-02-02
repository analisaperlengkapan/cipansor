import React, { forwardRef } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { LetterDetail } from "@cipansor/shared";

interface DispositionSheetTemplateProps {
  letter: LetterDetail;
}

export const DispositionSheetTemplate = forwardRef<HTMLDivElement, DispositionSheetTemplateProps>(
  ({ letter }, ref) => {
    if (!letter) return null;

    const unit = letter.unit;

    return (
      <div
        ref={ref}
        className="bg-white text-black p-8 mx-auto"
        style={{
          width: "210mm", // A4 Width
          minHeight: "297mm", // A4 Height
          fontFamily: "Arial, sans-serif",
          fontSize: "11pt",
          lineHeight: "1.3",
        }}
      >
        {/* Kop Surat */}
        {unit && (
          <div className="flex items-center gap-4 mb-2 pb-4 border-b-4 border-double border-black">
            {unit.logoUrl && (
              <img
                src={unit.logoUrl}
                alt="Logo"
                className="h-20 w-20 object-contain"
              />
            )}
            <div className="flex-1 text-center">
              <h3 className="text-sm font-bold uppercase tracking-wide">
                YAYASAN PESANTREN CIPANSOR
              </h3>
              <h1 className="text-xl font-bold uppercase text-black mb-1">
                {unit.name}
              </h1>
              <p className="text-xs font-normal text-gray-800">
                {unit.address}
              </p>
              <p className="text-xs font-normal text-gray-800">
                Telp: {unit.phone || "-"} | Email: {unit.email || "-"}
              </p>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="text-center mb-6 mt-4">
          <h1 className="text-lg font-bold uppercase underline">LEMBAR DISPOSISI</h1>
          <p className="text-sm">PERHATIAN: Dilarang memisahkan selembar disposisi ini dari surat aslinya</p>
        </div>

        {/* Metadata Table */}
        <div className="border border-black">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="border-r border-b border-black p-2 w-1/2 align-top">
                  <span className="block text-xs font-bold text-gray-600">Surat Dari:</span>
                  <span className="block font-semibold">{letter.senderName || letter.senderInstance || "-"}</span>
                </td>
                <td className="border-b border-black p-2 w-1/2 align-top">
                  <span className="block text-xs font-bold text-gray-600">Diterima Tanggal:</span>
                  <span className="block font-semibold">
                    {letter.receivedAt
                      ? format(new Date(letter.receivedAt), "dd MMMM yyyy", { locale: id })
                      : "-"}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="border-r border-b border-black p-2 align-top">
                  <span className="block text-xs font-bold text-gray-600">Nomor Surat:</span>
                  <span className="block font-semibold">{letter.letterNumber || "-"}</span>
                </td>
                <td className="border-b border-black p-2 align-top">
                  <span className="block text-xs font-bold text-gray-600">Nomor Agenda:</span>
                  <span className="block font-semibold text-lg">{letter.agendaNumber || "-"}</span>
                </td>
              </tr>
              <tr>
                <td className="border-r border-b border-black p-2 align-top">
                  <span className="block text-xs font-bold text-gray-600">Tanggal Surat:</span>
                  <span className="block font-semibold">
                    {format(new Date(letter.date), "dd MMMM yyyy", { locale: id })}
                  </span>
                </td>
                <td className="border-b border-black p-2 align-top">
                  <span className="block text-xs font-bold text-gray-600">Sifat:</span>
                  <span className="block font-semibold">
                    {letter.nature === "CONFIDENTIAL" ? "Rahasia" : letter.nature === "STRICTLY_CONFIDENTIAL" ? "Sangat Rahasia" : "Biasa"}
                    {" / "}
                    {letter.urgency === "URGENT" ? "Segera" : letter.urgency === "IMMEDIATE" ? "Sangat Segera" : "Biasa"}
                  </span>
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="border-b border-black p-2 align-top h-24">
                  <span className="block text-xs font-bold text-gray-600">Perihal:</span>
                  <span className="block font-semibold">{letter.subject}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Disposition & Instruction Grid */}
          <div className="flex border-b border-black">
            {/* Diteruskan Kepada */}
            <div className="w-1/2 border-r border-black p-2">
              <p className="text-xs font-bold text-gray-600 mb-2">Diteruskan Kepada:</p>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Kepala Sekolah</li>
                <li>Wakil Kepala Sekolah</li>
                <li>Ka. Tata Usaha</li>
                <li>Bendahara</li>
                <li>.............................</li>
                <li>.............................</li>
                <li>.............................</li>
              </ul>
              {/* Render actual dispositions if any */}
              {letter.dispositions && letter.dispositions.length > 0 && (
                <div className="mt-4 pt-2 border-t border-gray-300">
                  <p className="text-xs font-bold text-gray-600">Riwayat Disposisi:</p>
                  {letter.dispositions.map((d, i) => (
                     <div key={i} className="text-xs mt-1">
                       - {d.recipient?.name} ({format(new Date(d.createdAt), "dd/MM/yy")})
                     </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instruksi */}
            <div className="w-1/2 p-2">
              <p className="text-xs font-bold text-gray-600 mb-2">Instruksi / Informasi:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-black"></div>
                  <span>Tindak Lanjuti</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-black"></div>
                  <span>Tanggapan Tertulis</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-black"></div>
                  <span>Pelajari/Telaah</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-black"></div>
                  <span>Untuk Diketahui</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-black"></div>
                  <span>Saran/Pendapat</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-black"></div>
                  <span>Simpan/Arsip</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-black"></div>
                  <span>Hadiri/Wakili</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-black"></div>
                  <span>Edarkan</span>
                </div>
              </div>

              <div className="mt-4 h-32 border border-dashed border-gray-400 p-2 text-xs text-gray-500">
                 (Catatan Khusus Pimpinan)
              </div>
            </div>
          </div>

          {/* Footer / Signature Area */}
          <div className="p-4 flex justify-end">
            <div className="text-center w-40">
              <p className="text-sm mb-16">Pimpinan,</p>
              <p className="border-b border-black"></p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

DispositionSheetTemplate.displayName = "DispositionSheetTemplate";
