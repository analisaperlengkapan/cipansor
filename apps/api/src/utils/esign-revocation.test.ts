import { describe, it, expect } from 'vitest';
import { RoleCode } from '@prisma/client';
import {
  MIN_REVOCATION_REASON_LENGTH,
  RevocationError,
  assertKeyRevocable,
  assertSignatureRevocable,
  mayRevokeSignature,
  normalizeReason,
  type RevocableSignature,
  type RevocationActor,
} from './esign-revocation';

const SIGNER: RevocationActor = { id: 'signer-1', roleCode: RoleCode.TKQ_GURU };
const ADMIN: RevocationActor = { id: 'admin-1', roleCode: RoleCode.SUPER_ADMIN };
const OTHER: RevocationActor = { id: 'other-1', roleCode: RoleCode.TKQ_GURU };

function signature(over: Partial<RevocableSignature> = {}): RevocableSignature {
  return { signerId: SIGNER.id, revokedAt: null, ...over };
}

describe('alasan pencabutan', () => {
  it('dipangkas spasinya sebelum disimpan', () => {
    expect(normalizeReason('  Salah nomor surat  ')).toBe('Salah nomor surat');
  });

  it('menolak alasan yang terlalu pendek', () => {
    expect(() => normalizeReason('salah')).toThrow(RevocationError);
  });

  it('menolak alasan kosong', () => {
    expect(() => normalizeReason('')).toThrow(RevocationError);
    expect(() => normalizeReason(null)).toThrow(RevocationError);
    expect(() => normalizeReason(undefined)).toThrow(RevocationError);
  });

  /**
   * Yang paling mudah lolos: panjangnya cukup, isinya tidak ada. Zod `min()`
   * meluluskannya, dan halaman verifikasi publik menampilkannya sebagai
   * keterangan kosong di sebelah kata "dicabut".
   */
  it('menolak alasan yang hanya berisi spasi', () => {
    expect(() => normalizeReason(' '.repeat(MIN_REVOCATION_REASON_LENGTH + 5))).toThrow(
      RevocationError
    );
  });

  it('menolak alasan yang melampaui batas panjang', () => {
    expect(() => normalizeReason('a'.repeat(1001))).toThrow(RevocationError);
  });
});

describe('pencabutan kunci', () => {
  it('menerima kunci yang masih berlaku', () => {
    expect(() => assertKeyRevocable({ revokedAt: null })).not.toThrow();
  });

  it('menolak kunci yang tidak ada', () => {
    expect(() => assertKeyRevocable(null)).toThrow(RevocationError);
  });

  /**
   * Mencabut ulang akan menimpa tanggal dan alasan pencabutan yang pertama —
   * padahal catatan pertama itulah yang menjawab sejak kapan kunci ini tidak
   * boleh lagi dipercaya.
   */
  it('menolak kunci yang sudah dicabut', () => {
    expect(() =>
      assertKeyRevocable({ revokedAt: new Date('2026-01-01'), revokedReason: 'Passphrase bocor' })
    ).toThrow(RevocationError);
  });
});

describe('wewenang mencabut tanda tangan surat', () => {
  it('penandatangannya sendiri boleh', () => {
    expect(mayRevokeSignature(signature(), SIGNER)).toBe(true);
  });

  it('Super Admin boleh', () => {
    expect(mayRevokeSignature(signature(), ADMIN)).toBe(true);
  });

  it('pengguna lain tidak boleh', () => {
    expect(mayRevokeSignature(signature(), OTHER)).toBe(false);
  });

  it('menolak dengan sebab yang menyebut siapa yang berwenang', () => {
    expect(() => assertSignatureRevocable(signature(), OTHER)).toThrow(
      /penandatangan surat ini atau Super Admin/
    );
  });

  it('menolak surat yang belum ditandatangani', () => {
    expect(() => assertSignatureRevocable(null, ADMIN)).toThrow(
      /belum ditandatangani/
    );
  });

  /**
   * Urutan pemeriksaan penting: yang tidak berwenang tidak boleh mengetahui
   * lebih dulu bahwa tanda tangannya memang sudah dicabut.
   */
  it('memeriksa wewenang sebelum memeriksa status pencabutan', () => {
    expect(() =>
      assertSignatureRevocable(signature({ revokedAt: new Date('2026-01-01') }), OTHER)
    ).toThrow(/penandatangan surat ini atau Super Admin/);
  });

  it('menolak tanda tangan yang sudah dicabut', () => {
    expect(() =>
      assertSignatureRevocable(signature({ revokedAt: new Date('2026-01-01') }), ADMIN)
    ).toThrow(/sudah dicabut/);
  });
});
