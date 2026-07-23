-- Tanda tangan elektronik mandiri untuk surat keluar.
--
-- Dua tabel: kunci milik penanda tangan, dan tanda tangan yang membekas pada
-- surat. Keduanya dipisah karena umurnya berbeda — kunci boleh dicabut atau
-- diganti, sedangkan tanda tangan pada surat yang sudah beredar harus tetap
-- dapat diperiksa selamanya. Karena itu tiap tanda tangan menyimpan salinan
-- kunci publiknya sendiri, bukan rujukan ke kunci pengguna saat ini.

CREATE TABLE "user_signing_keys" (
  "id"                    TEXT NOT NULL,
  "user_id"               TEXT NOT NULL,
  "algorithm"             TEXT NOT NULL DEFAULT 'Ed25519',
  "public_key"            TEXT NOT NULL,
  -- Kunci privat tersegel. Passphrase pembukanya tidak disimpan di mana pun,
  -- termasuk tidak sebagai hash: satu-satunya bukti passphrase benar adalah
  -- dekripsi AES-GCM berhasil.
  "encrypted_private_key" TEXT NOT NULL,
  "kdf_salt"              TEXT NOT NULL,
  "kdf_params"            JSONB NOT NULL,
  "iv"                    TEXT NOT NULL,
  "auth_tag"              TEXT NOT NULL,
  "failed_attempts"       INTEGER NOT NULL DEFAULT 0,
  "locked_until"          TIMESTAMP(3),
  "last_used_at"          TIMESTAMP(3),
  "revoked_at"            TIMESTAMP(3),
  "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"            TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_signing_keys_pkey" PRIMARY KEY ("id")
);

-- Satu kunci aktif per pengguna.
CREATE UNIQUE INDEX "user_signing_keys_user_id_key" ON "user_signing_keys" ("user_id");

CREATE TABLE "letter_signatures" (
  "id"                 TEXT NOT NULL,
  "letter_id"          TEXT NOT NULL,
  "signer_id"          TEXT NOT NULL,
  "algorithm"          TEXT NOT NULL,
  "public_key"         TEXT NOT NULL,
  "digest"             TEXT NOT NULL,
  "signature"          TEXT NOT NULL,
  -- Dimuat QR. Acak 160 bit dan unik; bukan turunan id surat, supaya daftar
  -- surat tidak dapat disisir lewat halaman verifikasi publik.
  "verification_token" TEXT NOT NULL,
  "signed_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Pencabutan tidak menghapus baris: surat yang pernah beredar tetap harus
  -- bisa dijelaskan statusnya kepada yang memindai QR-nya.
  "revoked_at"         TIMESTAMP(3),
  "revoked_reason"     TEXT,
  "revoked_by_id"      TEXT,

  CONSTRAINT "letter_signatures_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "letter_signatures_verification_token_key"
  ON "letter_signatures" ("verification_token");
-- Satu tanda tangan per penanda tangan per surat.
CREATE UNIQUE INDEX "letter_signatures_letter_id_signer_id_key"
  ON "letter_signatures" ("letter_id", "signer_id");
CREATE INDEX "letter_signatures_letter_id_idx" ON "letter_signatures" ("letter_id");

ALTER TABLE "user_signing_keys"
  ADD CONSTRAINT "user_signing_keys_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Surat terhapus, tanda tangannya ikut. Penanda tangan tidak boleh terhapus
-- selama masih ada surat yang ia tandatangani (RESTRICT).
ALTER TABLE "letter_signatures"
  ADD CONSTRAINT "letter_signatures_letter_id_fkey"
  FOREIGN KEY ("letter_id") REFERENCES "letters"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "letter_signatures"
  ADD CONSTRAINT "letter_signatures_signer_id_fkey"
  FOREIGN KEY ("signer_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "letter_signatures"
  ADD CONSTRAINT "letter_signatures_revoked_by_id_fkey"
  FOREIGN KEY ("revoked_by_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
