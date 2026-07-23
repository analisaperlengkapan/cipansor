import { z } from 'zod';
import { MIN_PASSPHRASE_LENGTH } from '@/utils/esign';
import { MAX_VALIDITY_DAYS, MIN_VALIDITY_DAYS } from '@/utils/esign-lifecycle';

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

export const revokeKeySchema = z.object({
  reason: z.string().min(3).max(1000),
});

export const signLetterSchema = z.object({
  passphrase: z.string().min(1),
});
