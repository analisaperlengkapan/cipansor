import { LetterNature, LetterType } from "./correspondence";

/**
 * Jenis naskah dan sifat yang boleh menyertainya.
 *
 * Sumber kebenaran tunggal, dipakai dua sisi: server menegakkannya
 * (apps/api/src/utils/letter-naskah.ts membungkusnya dengan pelemparan galat),
 * dan formulir web membaca daftar yang sama agar pilihan yang ditawarkan sama
 * persis dengan pilihan yang diterima. Bila keduanya menyimpan salinannya
 * sendiri, cepat atau lambat mereka berselisih — dan formulir yang menawarkan
 * pilihan yang ditolak server adalah bug yang persis ingin dihindari.
 *
 * Dua sumbu yang berbeda: "jenis" (surat dinas, surat keputusan, surat tugas)
 * dan "sifat" atau derajat kerahasiaan (biasa, terbatas, rahasia, sangat
 * rahasia).
 * Surat keputusan adalah produk hukum yang justru harus dapat dibaca oleh yang
 * terkena keputusannya, jadi jenis penetapan hanya menerima Biasa atau
 * Terbatas — menandainya Rahasia adalah keliru kategori, bukan pilihan sah.
 */
const NATURES_BY_TYPE: Record<LetterType, readonly LetterNature[]> = {
  [LetterType.SURAT_DINAS]: [
    LetterNature.PUBLIC,
    LetterNature.LIMITED,
    LetterNature.CONFIDENTIAL,
    LetterNature.STRICTLY_CONFIDENTIAL,
  ],
  [LetterType.NOTA_DINAS]: [
    LetterNature.PUBLIC,
    LetterNature.LIMITED,
    LetterNature.CONFIDENTIAL,
    LetterNature.STRICTLY_CONFIDENTIAL,
  ],
  [LetterType.SURAT_KEPUTUSAN]: [LetterNature.PUBLIC, LetterNature.LIMITED],
  [LetterType.SURAT_TUGAS]: [LetterNature.PUBLIC, LetterNature.LIMITED],
  [LetterType.BERITA_ACARA]: [LetterNature.PUBLIC, LetterNature.LIMITED],
  [LetterType.SURAT_KETERANGAN]: [LetterNature.PUBLIC, LetterNature.LIMITED],
  [LetterType.SURAT_UNDANGAN]: [LetterNature.PUBLIC, LetterNature.LIMITED],
  [LetterType.SURAT_EDARAN]: [LetterNature.PUBLIC],
  [LetterType.PENGUMUMAN]: [LetterNature.PUBLIC],
};

export const LETTER_TYPE_LABELS: Record<LetterType, string> = {
  [LetterType.SURAT_DINAS]: "Surat Dinas (Korespondensi)",
  [LetterType.NOTA_DINAS]: "Nota Dinas (Internal)",
  [LetterType.SURAT_KEPUTUSAN]: "Surat Keputusan (SK)",
  [LetterType.SURAT_TUGAS]: "Surat Tugas",
  [LetterType.SURAT_EDARAN]: "Surat Edaran",
  [LetterType.SURAT_UNDANGAN]: "Surat Undangan",
  [LetterType.SURAT_KETERANGAN]: "Surat Keterangan",
  [LetterType.BERITA_ACARA]: "Berita Acara",
  [LetterType.PENGUMUMAN]: "Pengumuman",
};

export const LETTER_NATURE_LABELS: Record<LetterNature, string> = {
  [LetterNature.PUBLIC]: "Biasa",
  [LetterNature.LIMITED]: "Terbatas",
  [LetterNature.CONFIDENTIAL]: "Rahasia",
  [LetterNature.STRICTLY_CONFIDENTIAL]: "Sangat Rahasia",
};

export function naturesForType(type: LetterType): readonly LetterNature[] {
  return NATURES_BY_TYPE[type] ?? NATURES_BY_TYPE[LetterType.SURAT_DINAS];
}

export function isNatureAllowedForType(
  type: LetterType,
  nature: LetterNature,
): boolean {
  return naturesForType(type).includes(nature);
}
