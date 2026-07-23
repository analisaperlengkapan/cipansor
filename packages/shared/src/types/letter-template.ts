import { LetterNature, LetterType } from "./correspondence";

/**
 * Konsep awal surat keluar: kerangka yang tinggal diisi dan disunting.
 *
 * Diambil dari surat asli Yayasan (Surat Keterangan Nomor
 * 434/Sket/Y-CPS/VII/2026), sehingga bentuknya sama dengan yang selama ini
 * dikeluarkan — bukan karangan baru. Yang berbeda antar-jenis hanyalah judul,
 * kalimat pengantar, blok data yang perlu diisi, dan kalimat penutup; kop dan
 * blok tanda tangan sama untuk semua.
 *
 * Disimpan di paket bersama supaya server dan formulir web memakai satu
 * kerangka yang sama. Bila keduanya menyimpan salinan sendiri, konsep yang
 * ditawarkan formulir akan pelan-pelan berbeda dari yang dianggap sah server.
 *
 * Placeholder ditulis dalam kurung siku — `[NAMA]` — supaya jelas mana yang
 * masih harus diisi, dan supaya mudah dicari sebelum surat diajukan.
 */

/** Kop surat, apa adanya dari dokumen resmi Yayasan. */
export const LETTERHEAD = {
  organisation: "YAYASAN PESANTREN CIPANSOR",
  legalBasis: "AKTA NOTARIS NO. 01 TANGGAL 05 APRIL 2012",
  addressLine1:
    "Jl. Raya Malangbong Kp. Nyalindung RT.001 RW.001 Desa Buniasih Kec. Kadipaten",
  addressLine2: "Kab. Tasikmalaya Jawa Barat 46157",
  website: "www.cipansor.or.id",
  phone: "Tlp/HP. +628-1111-0400",
  city: "Tasikmalaya",
} as const;

export interface LetterTemplate {
  /** Judul yang dicetak di tengah, mis. "SURAT KETERANGAN". */
  title: string;
  /** Kalimat pembuka sebelum blok penanda tangan. */
  opening: string;
  /** Data penanda tangan yang dicantumkan. */
  signerFields: readonly string[];
  /** Kalimat peralihan menuju pokok surat. */
  transition: string;
  /** Data pihak yang diterangkan/ditugaskan. Kosong bila tidak relevan. */
  subjectFields: readonly string[];
  /** Paragraf isi sebagai titik awal — inilah yang paling sering disunting. */
  body: string;
  /** Kalimat penutup baku. */
  closing: string;
}

const SIGNER_FIELDS = ["Nama", "Jabatan", "Alamat Yayasan"] as const;
const PERSON_FIELDS = ["Nama", "NIK", "Email"] as const;

const CLOSING_GENERIC =
  "Demikian surat ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sesuai keperluan.";

const TEMPLATES: Record<LetterType, LetterTemplate> = {
  [LetterType.SURAT_KETERANGAN]: {
    title: "SURAT KETERANGAN",
    opening: "Yang bertanda tangan di bawah ini:",
    signerFields: SIGNER_FIELDS,
    transition: "Dengan ini menerangkan dengan sebenarnya bahwa:",
    subjectFields: PERSON_FIELDS,
    body: "adalah benar [URAIAN KETERANGAN, mis. merupakan relawan yang dipercaya oleh Yayasan Pesantren Cipansor sejak bulan ... hingga saat ini, dengan peran ...].",
    closing:
      "Demikian surat keterangan ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sesuai keperluan.",
  },

  [LetterType.SURAT_TUGAS]: {
    title: "SURAT TUGAS",
    opening: "Yang bertanda tangan di bawah ini:",
    signerFields: SIGNER_FIELDS,
    transition: "Dengan ini menugaskan kepada:",
    subjectFields: ["Nama", "NIP/NIK", "Jabatan"],
    body: "untuk melaksanakan [URAIAN TUGAS] pada [HARI, TANGGAL] bertempat di [TEMPAT].\n\nSegala biaya yang timbul akibat pelaksanaan tugas ini dibebankan pada [SUMBER BIAYA].",
    closing:
      "Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab, dan melaporkan hasilnya setelah tugas selesai.",
  },

  [LetterType.SURAT_KEPUTUSAN]: {
    title: "SURAT KEPUTUSAN",
    opening: "Ketua Yayasan Pesantren Cipansor, setelah:",
    // An SK is a legal instrument: its recitals are part of the document, so
    // the skeleton names them rather than leaving the drafter to remember.
    signerFields: SIGNER_FIELDS,
    transition: "MEMUTUSKAN:",
    subjectFields: [],
    body: [
      "Menimbang\t: a. bahwa [PERTIMBANGAN];",
      "\t  b. bahwa berdasarkan pertimbangan sebagaimana dimaksud pada huruf a, perlu ditetapkan Keputusan tentang [HAL].",
      "",
      "Mengingat\t: 1. Undang-Undang Nomor 16 Tahun 2001 tentang Yayasan sebagaimana diubah dengan Undang-Undang Nomor 28 Tahun 2004;",
      "\t  2. Akta Pendirian Yayasan Pesantren Cipansor Nomor 01 tanggal 5 April 2012;",
      "\t  3. [DASAR LAIN].",
      "",
      "MEMUTUSKAN:",
      "",
      "Menetapkan\t: [ISI PENETAPAN].",
      "KESATU\t: [DIKTUM PERTAMA].",
      "KEDUA\t: Keputusan ini berlaku sejak tanggal ditetapkan, dengan ketentuan apabila di kemudian hari terdapat kekeliruan akan diperbaiki sebagaimana mestinya.",
    ].join("\n"),
    closing: "",
  },

  [LetterType.BERITA_ACARA]: {
    title: "BERITA ACARA",
    opening:
      "Pada hari ini [HARI], tanggal [TANGGAL], bertempat di [TEMPAT], yang bertanda tangan di bawah ini:",
    signerFields: SIGNER_FIELDS,
    transition: "menerangkan bahwa telah dilaksanakan:",
    subjectFields: [],
    body: "[URAIAN KEGIATAN/PERISTIWA, termasuk pihak yang hadir, jalannya kegiatan, dan hasil/kesepakatan yang dicapai].",
    closing:
      "Demikian berita acara ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.",
  },

  [LetterType.SURAT_DINAS]: {
    title: "",
    opening: "Dengan hormat,",
    signerFields: [],
    transition: "",
    subjectFields: [],
    body: "[ISI SURAT].",
    closing:
      "Demikian surat ini kami sampaikan. Atas perhatian dan kerja samanya kami ucapkan terima kasih.",
  },

  [LetterType.NOTA_DINAS]: {
    title: "NOTA DINAS",
    opening: "",
    signerFields: [],
    transition: "",
    subjectFields: [],
    body: "[ISI NOTA DINAS].",
    closing: "Demikian untuk menjadi maklum dan terima kasih.",
  },

  [LetterType.SURAT_EDARAN]: {
    title: "SURAT EDARAN",
    opening: "Dengan hormat,",
    signerFields: [],
    transition: "Sehubungan dengan [LATAR], dengan ini disampaikan hal-hal sebagai berikut:",
    subjectFields: [],
    body: "1. [POIN PERTAMA];\n2. [POIN KEDUA];\n3. [POIN KETIGA].",
    closing:
      "Demikian surat edaran ini disampaikan untuk dilaksanakan sebagaimana mestinya.",
  },

  [LetterType.SURAT_UNDANGAN]: {
    title: "UNDANGAN",
    opening: "Dengan hormat,",
    signerFields: [],
    transition:
      "Mengharap kehadiran Bapak/Ibu/Saudara pada acara yang akan dilaksanakan pada:",
    subjectFields: ["Hari/Tanggal", "Waktu", "Tempat", "Acara"],
    body: "[KETERANGAN TAMBAHAN, mis. agenda ringkas atau hal yang perlu dibawa].",
    closing:
      "Mengingat pentingnya acara tersebut, kami mengharapkan kehadiran tepat waktu. Atas perhatiannya kami ucapkan terima kasih.",
  },

  [LetterType.PENGUMUMAN]: {
    title: "PENGUMUMAN",
    opening: "",
    signerFields: [],
    transition: "Diberitahukan kepada [SASARAN] bahwa:",
    subjectFields: [],
    body: "[ISI PENGUMUMAN].",
    closing: "Demikian pengumuman ini disampaikan untuk diketahui.",
  },
};

export function letterTemplateFor(type: LetterType): LetterTemplate {
  return TEMPLATES[type] ?? TEMPLATES[LetterType.SURAT_DINAS];
}

/**
 * Penandaan sifat yang dicetak pada naskah.
 *
 * Naskah "Biasa" tidak diberi tanda apa pun — memberi stempel pada surat biasa
 * justru mengaburkan arti stempel pada surat yang benar-benar terbatas. Tiga
 * derajat lainnya wajib tampak, dan dicetak dengan huruf kapital sesuai
 * kelaziman tata naskah dinas.
 */
export function natureMarking(nature: LetterNature): string | null {
  switch (nature) {
    case LetterNature.LIMITED:
      return "TERBATAS";
    case LetterNature.CONFIDENTIAL:
      return "RAHASIA";
    case LetterNature.STRICTLY_CONFIDENTIAL:
      return "SANGAT RAHASIA";
    default:
      return null;
  }
}

/**
 * Susun konsep awal sebagai teks, siap dimuat ke kolom isi surat.
 *
 * Sengaja teks biasa, bukan HTML: isi surat disimpan sebagai teks dan
 * disunting di textarea, dan menyuntikkan HTML ke dalamnya hanya akan
 * memindahkan persoalan penyaringan ke tempat lain.
 */
export function renderTemplateDraft(
  type: LetterType,
  nature: LetterNature,
): string {
  const t = letterTemplateFor(type);
  const marking = natureMarking(nature);
  const parts: string[] = [];

  if (marking) parts.push(marking, "");
  if (t.opening) parts.push(t.opening, "");

  for (const f of t.signerFields) parts.push(`${f}\t: [${f.toUpperCase()}]`);
  if (t.signerFields.length) parts.push("");

  if (t.transition) parts.push(t.transition, "");
  for (const f of t.subjectFields) parts.push(`${f}\t: [${f.toUpperCase()}]`);
  if (t.subjectFields.length) parts.push("");

  if (t.body) parts.push(t.body, "");
  if (t.closing) parts.push(t.closing);

  return parts.join("\n").trim();
}

/** Placeholder yang masih tersisa, supaya bisa diingatkan sebelum diajukan. */
export function remainingPlaceholders(content: string): string[] {
  return Array.from(new Set(content.match(/\[[A-Z0-9 ÀÁ-ÿ/.,;'’-]+\]/g) ?? []));
}
