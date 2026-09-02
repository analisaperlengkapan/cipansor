import { z } from 'zod';
import { MIN_PASSPHRASE_LENGTH } from '@/utils/esign';
import { MAX_VALIDITY_DAYS, MIN_VALIDITY_DAYS } from '@/utils/esign-lifecycle';
import {
  MAX_REVOCATION_REASON_LENGTH,
  MIN_REVOCATION_REASON_LENGTH,
} from '@/utils/esign-revocation';

const passphrase = z.string().min(MIN_PASSPHRASE_LENGTH);

export const requestKeySchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const activateKeySchema = z.object({
  passphrase,
});

/**
 * Ganti passphrase menuntut dua bukti berbeda: passphrase lama (pemilik kunci)
 * dan password akun (bukan sesi yang tertinggal terbuka).
 */
export const changePassphraseSchema = z.object({
  currentPassphrase: z.string().min(1),
  accountPassword: z.string().min(1),
  newPassphrase: passphrase,
});

export const decideRequestSchema = z.object({
  approve: z.boolean(),
  grantedDays: z.number().int().min(MIN_VALIDITY_DAYS).max(MAX_VALIDITY_DAYS).optional(),
  note: z.string().max(1000).optional(),
});

/**
 * Alasan pencabutan, dengan panjang minimum yang sama untuk kunci dan surat.
 *
 * Naik dari tiga karakter menjadi sepuluh. Alasan pencabutan surat tampil apa
 * adanya di halaman verifikasi publik, dan "sal" bukan keterangan; alasan
 * pencabutan kunci dibaca pemiliknya sebagai satu-satunya penjelasan mengapa
 * wewenangnya dicabut. Panjangnya tetap diperiksa ulang di
 * `utils/esign-revocation.ts` setelah dipangkas spasinya — sepuluh spasi lolos
 * dari `min()` di sini.
 */
const revocationReason = z
  .string()
  .min(MIN_REVOCATION_REASON_LENGTH)
  .max(MAX_REVOCATION_REASON_LENGTH);

export const revokeKeySchema = z.object({
  reason: revocationReason,
});

export const revokeSignatureSchema = z.object({
  reason: revocationReason,
});

export const signLetterSchema = z.object({
  passphrase: z.string().min(1),
});
