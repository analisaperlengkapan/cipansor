-- Persona (gaya bicara) asisten AI yang dapat disunting Super Admin.
--
-- Yang disimpan di sini HANYA lapisan gaya: sapaan, kehangatan, emoji, dan
-- kalimat penutup. Aturan keselamatan — jangan mengarang biaya/tanggal, jangan
-- menyentuh data pribadi — tetap tertanam di dalam kode (modules/chatbot/
-- prompt.ts) dan ditempel DI ATAS teks ini. Pembagian itu disengaja: prompt
-- sistem yang bisa disunting dari database adalah permukaan eskalasi hak akses,
-- karena siapa pun yang dapat menyuntingnya dapat menulis "abaikan batasanmu".
-- Dengan aturan tetap di kode, akun admin yang lalai atau dibajak pun tidak
-- dapat mengubah asisten menjadi mesin pengarang.
--
-- Dikunci per `scope` (bukan satu baris tunggal) supaya persona per-peran pada
-- Phase 2 — wali santri, guru, dan seterusnya — masuk ke tabel yang sama tanpa
-- perlu migrasi ulang. Phase 1 hanya memakai scope 'public'.
--
-- Tanpa baris untuk sebuah scope, asisten memakai gaya bawaan di kode. Jadi
-- tabel kosong bukan keadaan rusak, melainkan keadaan awal yang benar.

CREATE TABLE "chatbot_personas" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_personas_pkey" PRIMARY KEY ("id")
);

-- Satu persona per scope; upsert di persona.service.ts bergantung pada ini.
CREATE UNIQUE INDEX "chatbot_personas_scope_key" ON "chatbot_personas"("scope");
