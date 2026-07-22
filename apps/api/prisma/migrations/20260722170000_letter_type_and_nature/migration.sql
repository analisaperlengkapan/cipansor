-- Jenis naskah dinas, dan derajat kerahasiaan yang keempat.
--
-- Dua hal yang hilang dari model lama:
--
--  1. Tidak ada *jenis* naskah sama sekali. Surat keputusan dan surat tugas —
--     yang buku nomornya sendiri dan kewenangan tanda tangannya berbeda —
--     tidak bisa dibedakan dari korespondensi biasa.
--  2. Sifat hanya punya tiga nilai. Tata naskah dinas mengenal empat, dan
--     naskah "Terbatas" terpaksa dicatat sebagai "Biasa", sehingga kehilangan
--     pembatasan pembacanya.

-- Menambah nilai pada enum yang sudah dipakai; nilai lama tidak diubah agar
-- baris yang ada tetap sah. Ditempatkan setelah PUBLIC supaya urutan enum
-- mengikuti derajatnya, yang membuat ORDER BY pada kolom ini bermakna.
ALTER TYPE "LetterNature" ADD VALUE IF NOT EXISTS 'LIMITED' AFTER 'PUBLIC';

CREATE TYPE "LetterType" AS ENUM (
  'SURAT_DINAS',
  'NOTA_DINAS',
  'SURAT_KEPUTUSAN',
  'SURAT_TUGAS',
  'SURAT_EDARAN',
  'SURAT_UNDANGAN',
  'SURAT_KETERANGAN',
  'BERITA_ACARA',
  'PENGUMUMAN'
);

-- DEFAULT bukan sekadar kenyamanan: surat yang sudah ada memang korespondensi
-- biasa, jadi nilai ini benar untuknya, bukan tebakan.
ALTER TABLE "letters"
  ADD COLUMN "type" "LetterType" NOT NULL DEFAULT 'SURAT_DINAS';

CREATE INDEX "letters_type_idx" ON "letters" ("type");
