import { LetterNature, LetterType } from '@prisma/client';
import {
  LETTER_NATURE_LABELS,
  LETTER_TYPE_LABELS,
  isNatureAllowedForType,
  naturesForType,
} from '@cipansor/shared';

/**
 * Server-side enforcement of the jenis/sifat rule.
 *
 * The rule itself — which sifat each jenis may carry, and the labels — lives in
 * @cipansor/shared so the web form offers exactly what this accepts. A form
 * that offers a choice the server rejects is the class of bug this whole change
 * set exists to close, so there is deliberately no second copy here. This file
 * adds only the two things the client does not need: the throwing guard, and
 * the per-type agenda-numbering code.
 *
 * The @prisma/client and @cipansor/shared enums are distinct types with
 * identical string members, so a Prisma LetterType is passed to the shared
 * helpers through a cast that is a no-op at runtime.
 */

export { LETTER_NATURE_LABELS, LETTER_TYPE_LABELS, naturesForType };

export function naturesFor(type: LetterType): readonly LetterNature[] {
  return naturesForType(type as unknown as never) as unknown as LetterNature[];
}

export function isNatureAllowed(type: LetterType, nature: LetterNature): boolean {
  return isNatureAllowedForType(
    type as unknown as never,
    nature as unknown as never
  );
}

/**
 * Kode penomoran untuk tiap jenis, dipakai AgendaNumber.
 *
 * Setiap jenis punya buku nomornya sendiri: SK nomor 1 dan surat dinas nomor 1
 * hidup berdampingan, persis seperti di buku agenda kertas. Menyatukannya akan
 * membuat nomor SK melompat setiap kali ada surat biasa keluar. Server-only:
 * nomor tidak pernah dipilih di klien.
 */
export const AGENDA_TYPE_CODE: Record<LetterType, string> = {
  [LetterType.SURAT_DINAS]: 'SURAT_DINAS',
  [LetterType.NOTA_DINAS]: 'NOTA_DINAS',
  [LetterType.SURAT_KEPUTUSAN]: 'SK',
  [LetterType.SURAT_TUGAS]: 'SURAT_TUGAS',
  [LetterType.SURAT_EDARAN]: 'SURAT_EDARAN',
  [LetterType.SURAT_UNDANGAN]: 'UNDANGAN',
  [LetterType.SURAT_KETERANGAN]: 'SURAT_KETERANGAN',
  [LetterType.BERITA_ACARA]: 'BERITA_ACARA',
  [LetterType.PENGUMUMAN]: 'PENGUMUMAN',
};

export class NaskahError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NaskahError';
  }
}

/**
 * Menolak pasangan jenis/sifat yang tidak sah.
 *
 * Pesannya menyebut pilihan yang tersedia, karena penolakan yang tidak
 * menawarkan jalan keluar hanya memindahkan kebingungan ke petugas tata usaha.
 */
export function assertNatureAllowed(type: LetterType, nature: LetterNature): void {
  if (isNatureAllowed(type, nature)) return;

  const allowed = naturesFor(type)
    .map((n) => LETTER_NATURE_LABELS[n as keyof typeof LETTER_NATURE_LABELS])
    .join(', ');

  throw new NaskahError(
    `Sifat "${LETTER_NATURE_LABELS[nature as keyof typeof LETTER_NATURE_LABELS]}" ` +
      `tidak berlaku untuk ${LETTER_TYPE_LABELS[type as keyof typeof LETTER_TYPE_LABELS]}. ` +
      `Pilihan yang tersedia: ${allowed}.`
  );
}
