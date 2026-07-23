-- Histori alur surat: catatan append-only tentang siapa melakukan apa, kapan.
--
-- LetterReviewer dan Disposition menyimpan keadaan sekarang, bukan riwayat:
-- status seorang verifikator ditimpa tiap kali ia bertindak, sehingga setelah
-- sebuah konsep dikembalikan lalu diajukan ulang, jejak "siapa yang meminta
-- revisi, kapan, dengan catatan apa" hilang sama sekali. Tabel ini menyimpan
-- peristiwanya, bukan kesimpulannya.

CREATE TYPE "LetterFlowAction" AS ENUM (
  'CREATED',
  'SUBMITTED',
  'APPROVED',
  'SIGNED',
  'REVISION_REQUESTED',
  'RESUBMITTED',
  'DISPOSED',
  'DISPOSITION_UPDATED',
  'SENT',
  'ARCHIVED'
);

CREATE TABLE "letter_flow_events" (
  "id"          TEXT NOT NULL,
  "letter_id"   TEXT NOT NULL,
  "actor_id"    TEXT NOT NULL,
  "action"      "LetterFlowAction" NOT NULL,
  "target_id"   TEXT,
  "from_status" "LetterStatus",
  "to_status"   "LetterStatus",
  "note"        TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "letter_flow_events_pkey" PRIMARY KEY ("id")
);

-- Riwayat sebuah surat selalu dibaca berurutan waktu, jadi indeksnya gabungan.
CREATE INDEX "letter_flow_events_letter_id_created_at_idx"
  ON "letter_flow_events" ("letter_id", "created_at");
CREATE INDEX "letter_flow_events_actor_id_idx"
  ON "letter_flow_events" ("actor_id");

-- Menghapus surat menghapus riwayatnya (CASCADE); menghapus pengguna tidak
-- boleh menghapus jejak perbuatannya, jadi actor/target memakai RESTRICT.
ALTER TABLE "letter_flow_events"
  ADD CONSTRAINT "letter_flow_events_letter_id_fkey"
  FOREIGN KEY ("letter_id") REFERENCES "letters"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "letter_flow_events"
  ADD CONSTRAINT "letter_flow_events_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "letter_flow_events"
  ADD CONSTRAINT "letter_flow_events_target_id_fkey"
  FOREIGN KEY ("target_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Surat yang sudah ada tidak punya riwayat; peristiwa CREATED disisipkan agar
-- setiap surat punya titik awal yang jujur — memakai created_at aslinya, bukan
-- waktu migrasi ini dijalankan.
INSERT INTO "letter_flow_events" ("id", "letter_id", "actor_id", "action", "to_status", "note", "created_at")
SELECT
  gen_random_uuid()::text,
  l."id",
  l."created_by_id",
  'CREATED',
  l."status",
  'Dicatat sebelum histori alur diberlakukan; status awal diambil dari keadaan surat saat migrasi.',
  l."created_at"
FROM "letters" l;
