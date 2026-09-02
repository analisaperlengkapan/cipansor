import { RoleCode } from '@prisma/client';

/**
 * Aturan pencabutan — kunci tanda tangan dan tanda tangan pada surat.
 *
 * Dipisah dari layanannya karena pencabutan adalah satu-satunya perbuatan pada
 * modul ini yang tidak dapat ditarik kembali: ia menyatakan kepada publik bahwa
 * sesuatu yang pernah sah kini tidak lagi berlaku. Aturan sekecil "siapa yang
 * boleh" dan "apa yang tidak boleh dicabut dua kali" layak diuji sendiri, lepas
 * dari basis data dan lepas dari Express.
 *
 * Dua hal yang perlu diingat saat membaca berkas ini:
 *
 * 1. **Mencabut kunci tidak mencabut surat.** Setiap tanda tangan menyimpan
 *    salinan kunci publiknya sendiri, sehingga surat yang telanjur sah tetap
 *    terverifikasi walaupun kunci penandatangannya sudah dicabut. Itu memang
 *    yang dikehendaki untuk pergantian pejabat atau kunci yang kedaluwarsa —
 *    tetapi tidak untuk passphrase yang bocor, dan di situlah pencabutan
 *    tanda tangan per surat menjadi perlu.
 * 2. **Alasan pencabutan surat dibaca publik.** Ia ditampilkan apa adanya di
 *    halaman verifikasi kepada siapa pun yang mengunggah berkasnya. Karena itu
 *    ada panjang minimum — "abc" bukan keterangan — dan karena itu pula
 *    antarmuka wajib memberi tahu pencabutnya sebelum ia menulis.
 */

/** Panjang minimum alasan, karena alasan surat terbaca publik. */
export const MIN_REVOCATION_REASON_LENGTH = 10;
export const MAX_REVOCATION_REASON_LENGTH = 1000;

/**
 * Penolakan karena tidak berwenang ditandai tersendiri, supaya lapisan HTTP
 * tidak perlu menebaknya dari teks pesan.
 *
 * "Anda tidak berwenang" dan "sudah dicabut" sama-sama menolak, tetapi bagi
 * yang memanggil keduanya berarti hal yang berbeda — dan sebuah 500 untuk
 * keduanya, yang terjadi bila galat ini lolos begitu saja ke penangan umum,
 * tidak memberi tahu apa-apa.
 */
export class RevocationError extends Error {
  readonly forbidden: boolean;

  constructor(message: string, forbidden = false) {
    super(message);
    this.name = 'RevocationError';
    this.forbidden = forbidden;
  }
}

/** Bentuk minimal kunci yang dibutuhkan aturan di bawah. */
export interface RevocableKey {
  revokedAt: Date | null;
  revokedReason?: string | null;
}

/** Bentuk minimal tanda tangan surat yang dibutuhkan aturan di bawah. */
export interface RevocableSignature {
  signerId: string;
  revokedAt: Date | null;
}

/** Yang melakukan pencabutan — identitas dan wewenangnya. */
export interface RevocationActor {
  id: string;
  roleCode: string;
}

/**
 * Rapikan dan periksa alasan pencabutan.
 *
 * Mengembalikan bentuk yang sudah dipangkas spasinya, karena itulah yang
 * disimpan: alasan berisi spasi belaka lolos dari `min()` milik Zod tetapi
 * tampil sebagai keterangan kosong di halaman publik.
 */
export function normalizeReason(reason: string | null | undefined): string {
  const trimmed = (reason ?? '').trim();
  if (trimmed.length < MIN_REVOCATION_REASON_LENGTH) {
    throw new RevocationError(
      `Alasan pencabutan harus diisi, sekurang-kurangnya ${MIN_REVOCATION_REASON_LENGTH} karakter.`
    );
  }
  if (trimmed.length > MAX_REVOCATION_REASON_LENGTH) {
    throw new RevocationError(
      `Alasan pencabutan terlalu panjang (maksimal ${MAX_REVOCATION_REASON_LENGTH} karakter).`
    );
  }
  return trimmed;
}

/**
 * Boleh dicabut?
 *
 * Kunci yang sudah dicabut tidak dicabut ulang. Membiarkannya berarti tanggal
 * dan alasan pencabutan yang pertama tertimpa — padahal justru catatan pertama
 * itulah yang menjawab sejak kapan kunci ini tidak boleh lagi dipercaya.
 */
export function assertKeyRevocable(key: RevocableKey | null): void {
  if (!key) {
    throw new RevocationError('Kunci tanda tangan tidak ditemukan.');
  }
  if (key.revokedAt) {
    throw new RevocationError('Kunci tanda tangan ini sudah dicabut sebelumnya.');
  }
}

/**
 * Siapa yang boleh mencabut tanda tangan pada surat?
 *
 * Penandatangannya sendiri — sebab yang menarik kembali sebuah tanda tangan
 * seharusnya yang membubuhkannya — dan Super Admin, sebagai pemegang kewenangan
 * sistem ketika penandatangannya berhalangan, sudah tidak menjabat, atau justru
 * dialah persoalannya.
 *
 * Pembuat konsep sengaja tidak termasuk: seorang penyusun naskah tidak menarik
 * tanda tangan atasannya. Begitu pula pemeriksa/paraf — paraf menyatakan naskah
 * layak diajukan, bukan wewenang atas tanda tangan yang sudah dibubuhkan.
 */
export function mayRevokeSignature(
  signature: RevocableSignature,
  actor: RevocationActor
): boolean {
  return actor.roleCode === RoleCode.SUPER_ADMIN || signature.signerId === actor.id;
}

export function assertSignatureRevocable(
  signature: RevocableSignature | null,
  actor: RevocationActor
): void {
  if (!signature) {
    throw new RevocationError('Surat ini belum ditandatangani secara elektronik.');
  }
  if (!mayRevokeSignature(signature, actor)) {
    throw new RevocationError(
      'Hanya penandatangan surat ini atau Super Admin yang dapat mencabut tanda tangannya.',
      true
    );
  }
  if (signature.revokedAt) {
    throw new RevocationError('Tanda tangan surat ini sudah dicabut sebelumnya.');
  }
}
