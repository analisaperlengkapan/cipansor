import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  IDENTITY_DOCUMENT_RETENTION_YEARS,
  IDENTITY_STORE_RELATIVE_DIR,
  identityDocumentRetainUntil,
  isAcceptedIdentityDocument,
} from './identity-document-store';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const COMPOSE = fs.readFileSync(path.join(REPO_ROOT, 'docker-compose.yml'), 'utf8');
const DOCKERFILE = fs.readFileSync(
  path.join(REPO_ROOT, 'apps', 'api', 'Dockerfile'),
  'utf8'
);

/** `private/identity` di mesin mana pun, termasuk yang pemisah jalurnya `\`. */
const storePath = IDENTITY_STORE_RELATIVE_DIR.split(path.sep).join('/');

/**
 * Berkas ini menyimpan pindaian KTP, dan dua janji dibuat di atasnya: bahwa
 * hanya Super Admin yang membacanya, dan bahwa ia masih ada ketika ditanyakan
 * bertahun-tahun kemudian. Keduanya dipatahkan bukan oleh kode di dalam modul
 * ini, melainkan oleh berkas penerapan di luarnya — jadi di sinilah keduanya
 * diperiksa.
 */
describe('tempat penyimpanan bertahan melewati penerapan ulang', () => {
  /**
   * Kegagalan yang ditutup uji ini tidak menghasilkan galat apa pun: unggahan
   * berhasil, verifikasi berhasil, lalu `docker compose up -d` berikutnya
   * menghapus berkasnya sementara barisnya di basis data tetap menyebutkan
   * nama berkas, SHA-256, dan tenggat simpannya. Yang tersisa adalah sistem
   * yang mengaku memegang bukti yang tidak lagi dipegangnya.
   */
  it('dipasangi volume bernama di jalur yang benar-benar dipakai kode', () => {
    expect(COMPOSE).toContain(`:/app/apps/api/${storePath}`);
  });

  /**
   * Volume bernama yang dipasang pada jalur yang tidak ada di dalam image
   * dibuat Docker sebagai root, dan unggahan pertama dari proses `expressjs`
   * gagal dengan EACCES. Direktorinya harus sudah ada — dan dimiliki — sebelum
   * volumenya menempel.
   */
  it('direktorinya sudah dibuat dan dimiliki di dalam image', () => {
    expect(DOCKERFILE).toMatch(
      new RegExp(`mkdir[^\\n]*${storePath}`, 'm')
    );
    expect(DOCKERFILE).toMatch(
      new RegExp(`chown[\\s\\S]*?${storePath}`, 'm')
    );
  });

  /**
   * Di luar `public/` bukan soal kerapian: `app.ts` menyajikan
   * `public/uploads` lewat `express.static` di balik `uploadsAuth`, yang
   * memeriksa keberadaan token dan bukan peran pemiliknya. Satu direktori yang
   * salah letak akan membuat setiap pengguna yang sudah masuk — termasuk wali
   * santri — dapat mengunduh KTP setiap pejabat.
   */
  it('tidak berada di dalam direktori yang disajikan secara statis', () => {
    expect(storePath.startsWith('public/')).toBe(false);
  });
});

describe('masa simpan', () => {
  /**
   * Dihitung dari berakhirnya masa berlaku kunci, bukan dari penerbitannya —
   * itulah yang ditetapkan CA/Browser Forum, dan selisih keduanya adalah
   * seluruh umur sertifikat.
   */
  it('dihitung dari kedaluwarsa kunci, bukan dari hari ini', () => {
    const expiry = new Date('2030-01-15T00:00:00.000Z');
    const until = identityDocumentRetainUntil(expiry);
    expect(until.getUTCFullYear()).toBe(2030 + IDENTITY_DOCUMENT_RETENTION_YEARS);
    expect(until.getUTCMonth()).toBe(expiry.getUTCMonth());
    expect(until.getUTCDate()).toBe(expiry.getUTCDate());
  });

  it('tidak mengubah tanggal yang diberikan kepadanya', () => {
    const expiry = new Date('2030-01-15T00:00:00.000Z');
    identityDocumentRetainUntil(expiry);
    expect(expiry.toISOString()).toBe('2030-01-15T00:00:00.000Z');
  });
});

describe('jenis berkas', () => {
  it('menerima foto dan pindaian, menolak yang lain', () => {
    expect(isAcceptedIdentityDocument('image/jpeg')).toBe(true);
    expect(isAcceptedIdentityDocument('application/pdf')).toBe(true);
    expect(isAcceptedIdentityDocument('image/svg+xml')).toBe(false);
    expect(isAcceptedIdentityDocument('text/html')).toBe(false);
  });
});
