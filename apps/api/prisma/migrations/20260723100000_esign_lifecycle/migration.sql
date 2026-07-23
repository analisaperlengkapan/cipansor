-- Masa berlaku kunci tanda tangan, dan alur pengajuan/persetujuannya.
--
-- Kunci tidak lagi berlaku selamanya: ia diterbitkan atas persetujuan Super
-- Admin untuk jangka waktu tertentu, dan harus diperpanjang sebelum habis.
-- Kunci yang berlaku selamanya berarti akun yang pernah bocor dapat
-- menandatangani surat bertahun-tahun kemudian tanpa pernah ada momen
-- pemeriksaan ulang.
--
-- Perhatikan: TIDAK ada kolom status kedaluwarsa. Status dihitung dari
-- expires_at setiap kali dibaca (utils/esign-lifecycle.ts). Menyimpannya
-- menuntut penjadwal yang membalik status tepat waktu; bila penjadwal itu mati
-- semalam, kunci yang sudah lewat masa berlakunya masih berstatus aktif dan
-- masih dapat dipakai menandatangani.

ALTER TABLE "user_signing_keys"
  ADD COLUMN "approved_by_id"  TEXT,
  ADD COLUMN "approved_at"     TIMESTAMP(3),
  ADD COLUMN "expires_at"      TIMESTAMP(3),
  ADD COLUMN "revoked_reason"  TEXT;

ALTER TABLE "user_signing_keys"
  ADD CONSTRAINT "user_signing_keys_approved_by_id_fkey"
  FOREIGN KEY ("approved_by_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TYPE "SigningKeyRequestKind" AS ENUM ('ENROLLMENT', 'RENEWAL');
CREATE TYPE "SigningKeyRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "signing_key_requests" (
  "id"             TEXT NOT NULL,
  "user_id"        TEXT NOT NULL,
  "kind"           "SigningKeyRequestKind" NOT NULL,
  "status"         "SigningKeyRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reason"         TEXT,
  "decided_by_id"  TEXT,
  "decided_at"     TIMESTAMP(3),
  "decision_note"  TEXT,
  -- Masa berlaku ditentukan saat menyetujui, bukan konstanta global: yang
  -- menyetujui itulah yang menanggung keputusannya.
  "granted_days"   INTEGER,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "signing_key_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "signing_key_requests_user_id_idx" ON "signing_key_requests" ("user_id");
CREATE INDEX "signing_key_requests_status_idx" ON "signing_key_requests" ("status");

ALTER TABLE "signing_key_requests"
  ADD CONSTRAINT "signing_key_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Putusan tetap dapat ditelusuri ke pemutusnya; pengguna yang pernah
-- memutuskan tidak boleh terhapus begitu saja.
ALTER TABLE "signing_key_requests"
  ADD CONSTRAINT "signing_key_requests_decided_by_id_fkey"
  FOREIGN KEY ("decided_by_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
