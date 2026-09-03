"use client";

import React, { forwardRef, useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { safeFormat } from "@/lib/date";
import { siteConfig, getPublicVerifyUrl } from "@/config/site";
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
 *
 * Kepala naskah memakai huruf kapital seluruhnya; kakinya tidak — di sana ia
 * dibaca sebagai jabatan orang yang menandatangani, bukan sebagai judul.
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
  /**
   * The QR now carries the bare verification token, not a URL.
   *
   * It used to encode `${origin}/verifikasi/<token>`, and scanning it opened a
   * page that answered whether the letter was valid. A token can only attest
   * that *some* letter was signed — never that the document in the reader's
   * hand is that letter — so a forger kept the genuine QR, edited the body, and
   * the page still vouched for it. Verification now means uploading the PDF at
   * the printed address, where the bytes themselves are hashed and matched.
   */
  const qrCodeValue = signature ? signature.verificationToken : "";
  const verifyUrl = getPublicVerifyUrl(
    process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url || origin || undefined,
  );

  useEffect(() => {
    if (!qrCodeValue) {
      setQrDataUrl(null);
      return;
    }
    // The offscreen canvas is painted by QRCodeCanvas below on the same commit,
    // so it is readable here.
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

  /**
   * Naskah dinas differs along two axes, and they are not the same axis.
   *
   * `title` decides whether the type is announced as a centred heading above
   * the number (every type except surat dinas). `addressed` decides whether
   * the naskah carries "Kepada Yth." and closes "Hormat Kami,".
   *
   * They were previously collapsed into one — "has a centred title" was taken
   * to mean "addressed to no one" — which is true of surat keterangan, tugas,
   * berita acara and pengumuman, and false of nota dinas, undangan and
   * edaran. Those three came out with no addressee anywhere on the paper: an
   * undangan that never says who is invited.
   */
  const type = (letter.type as LetterType | undefined) ?? LetterType.SURAT_DINAS;
  const template = letterTemplateFor(type);
  const centredTitle = template.title;
  const hasTitle = centredTitle.length > 0;
  const isAddressed = template.addressed;
  /** Surat Keputusan: kepala "Tentang", diktum di tengah, kaki "Ditetapkan di". */
  const isDecree = template.decree === true;

  /** "TERBATAS" / "RAHASIA" / "SANGAT RAHASIA" — null for a Biasa letter. */
  const marking = natureMarking(letter.nature);

  /** Jabatan penanda tangan, mis. "Ketua". Kosong bila tidak diisi. */
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
      {/*
        Derajat kerahasiaan dicetak dari `letter.nature`, bukan dari isi surat.

        Sebelumnya penandanya hanya ikut terbawa sebagai teks ketika penyusun
        menekan "Isi dari template" — jadi surat Rahasia yang disusun tanpa
        template, atau yang isinya disunting, tercetak tanpa penanda apa pun.
        Yang menentukan derajatnya adalah kolom sifat pada suratnya.
      */}
      {marking && (
        <p className="mb-2 text-right text-sm font-bold uppercase tracking-widest">
          {marking}
        </p>
      )}

      {/* Kop surat — mengikuti kop surat resmi yayasan. */}
      <div className="mb-2 flex items-center gap-4 border-b-4 border-double border-black pb-3">
        {/*
          Logo selalu ada di kiri kop. Sebelumnya hanya dicetak bila unit
          menyimpan logoUrl, sehingga surat dari unit yang belum mengunggah
          logonya keluar tanpa lambang sama sekali — kop surat tanpa lambang
          tidak dikenali sebagai surat resmi. Lambang yayasan menjadi cadangan.
        */}
        <img
          src={unit?.logoUrl || "/images/cipansor/logo-cipansor.webp"}
          alt="Logo Yayasan Pesantren Cipansor"
          className="h-24 w-24 shrink-0 object-contain"
        />
        <div className="flex-1 text-center">
          <h3 className="text-lg font-bold uppercase tracking-wide">
            {LETTERHEAD.organisation}
          </h3>
          {/* Unit hanya dicetak bila suratnya memang terbit dari unit. */}
          {unit?.name && (
            <h1 className="mb-1 text-xl font-bold uppercase">{unit.name}</h1>
          )}
          <p className="text-[9pt] font-normal text-gray-800">
            {LETTERHEAD.legalBasis}
          </p>
          {/*
            Dua cabang utuh, bukan campuran per baris. Versi sebelumnya memakai
            alamat unit tetapi tetap membuang baris kedua kop yayasan, sehingga
            kop kehilangan kabupaten dan kode pos begitu alamat unit hanya
            berisi satu baris — persis yang terjadi pada data yang ada.
          */}
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
          {/*
            "Tentang" + pokok naskah.

            Untuk keputusan, edaran dan pengumuman inilah judul sebenarnya —
            "SURAT KEPUTUSAN" saja tidak memberi tahu keputusan tentang apa.
            Perihal yang diisi penyusun sebelumnya tidak pernah sampai ke
            kertas pada naskah berjudul: kolomnya hanya dicetak pada surat
            dinas, sehingga delapan dari sembilan jenis kehilangan pokoknya.
          */}
          {template.subjectHeading && letter.subject && (
            <>
              <p className="mt-3">Tentang</p>
              <p className="font-bold uppercase">{letter.subject}</p>
            </>
          )}
          {/*
            Jabatan yang menetapkan, berdiri sendiri sebelum konsideran —
            bagian wajib naskah penetapan.
          */}
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
            {/* Tempat ikut dicetak — "Tasikmalaya, 13 Juli 2026", bukan tanggal
                telanjang, sebagaimana lazimnya naskah dinas. */}
            <p>
              {LETTERHEAD.city},{" "}
              {safeFormat(new Date(letter.date), "dd MMMM yyyy", { locale: id })}
            </p>
          </div>
        </div>
      )}

      {/*
        Alamat tujuan hanya untuk naskah yang memang ditujukan kepada seseorang.
        Surat keterangan, keputusan, tugas, berita acara dan pengumuman tidak
        ditujukan kepada siapa pun — mencetak "Kepada Yth. Bapak/Ibu" di
        atasnya justru membuatnya tampak seperti surat yang salah kirim.
      */}
      {isAddressed && (
        <div className="mt-8">
          <p>Kepada Yth.</p>
          <p className="font-bold">
            {letter.recipientName || letter.recipientInstance || "Bapak/Ibu"}
          </p>
          {/*
            Instansi tujuan dicetak sebagai barisnya sendiri.

            Sebelumnya nama dan instansi bersaing lewat `||`, jadi begitu
            keduanya terisi instansinya hilang: surat untuk "Kepala Dinas
            Pendidikan" di "Kabupaten Tasikmalaya" tercetak seolah dialamatkan
            entah ke dinas yang mana.
          */}
          {letter.recipientInstance &&
            letter.recipientInstance !== letter.recipientName && (
              <p>{letter.recipientInstance}</p>
            )}
          <p>
            di <span className="capitalize">Tempat</span>
          </p>
        </div>
      )}

      {/*
        Isi surat dipecah per alinea, bukan satu blok teks panjang.

        Alasannya bukan tampilan melainkan penggalan halaman: pengunduh PDF
        memotong naskah yang tinggi menjadi beberapa halaman, dan tanpa batas
        blok yang bisa diukur ia memotong tepat di tengah baris. Setiap alinea
        menjadi titik potong yang sah — lihat handleDownloadPDF.
      */}
      <div className="mt-8 min-h-[300px] space-y-4 text-justify">
        {(letter.content ?? "")
          .split(/\n\s*\n/)
          .filter((para) => para.trim().length > 0)
          .map((para, i) => (
            <p
              key={i}
              data-naskah-block
              className={
                /*
                  "MEMUTUSKAN" berdiri sendiri di tengah, memisahkan konsideran
                  dari diktum. Dikenali dari alineanya sendiri, bukan disisipkan
                  oleh naskah, supaya isi surat tetap satu teks utuh yang boleh
                  disunting penyusun — termasuk bila ia menyusun keputusan tanpa
                  memakai kerangka.
                */
                isDecree && /^MEMUTUSKAN:?$/i.test(para.trim())
                  ? "whitespace-pre-wrap text-center font-bold tracking-widest"
                  : "whitespace-pre-wrap"
              }
            >
              {para}
            </p>
          ))}
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
          {/*
            Naskah pernyataan ditutup dengan tempat & tanggal lalu nama
            lembaga dan jabatan — persis seperti surat keterangan yang selama
            ini dikeluarkan yayasan. "Hormat Kami," adalah penutup surat yang
            ditujukan kepada seseorang, dan janggal di bawah surat keputusan.
          */}
          {isDecree ? (
            /*
              Kaki naskah penetapan: "Ditetapkan di" dan "Pada tanggal" pada
              baris terpisah, lalu jabatan yang menetapkan. Keputusan tidak
              ditutup "Tasikmalaya, <tanggal>" seperti surat — yang dicatat
              bukan tempat surat dibuat melainkan tempat keputusan ditetapkan.
            */
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
              {/* Title case, as the yayasan writes it under a signature —
                  the kop above is the all-caps form. */}
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
            </div>
          ) : null}

          <p className="mt-1 font-bold underline uppercase">{signerName}</p>
          {/* NIP hanya untuk penanda tangan yang memang punya — surat yayasan
              yang ditandatangani ketua tidak mencantumkannya, dan "NIP. -"
              hanya menambah baris kosong yang tampak seperti data hilang. */}
          {signerNip !== "-" && <p>NIP. {signerNip}</p>}

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
