# Task: Dev Modul Manajemen Persuratan (E-Office)

**Judul Task:** Dev Modul Manajemen Persuratan
**Status:** Planned
**Prioritas:** High

## Deskripsi Task
Melakukan pengembangan lanjutan (enhancement) pada modul Manajemen Persuratan (E-Office) di sistem Cipansor. Pengembangan ini bertujuan untuk melengkapi fitur backend dan frontend sesuai dengan standar Tata Naskah Dinas, best practices sistem informasi manajemen, dan memastikan integrasi end-to-end yang seamless.

---

## 1. Analisis Codebase Saat Ini (Existing State)

Berdasarkan pemeriksaan codebase yang ada:

### Backend (`apps/api/src/modules/correspondence`)
*   **Service & Controller:** Sudah tersedia dasar CRUD untuk `Letter` (Surat), `Disposition` (Disposisi), dan `Reviewer`.
*   **Database Schema:** Model `Letter`, `Disposition`, `FilingClassification`, `AgendaNumber`, dan `LetterReviewer` sudah terdefinisi dengan baik di Prisma.
*   **Fitur Existing:**
    *   Auto-numbering dasar (`generateNumber`).
    *   Workflow review/approval (`processReview`).
    *   Statistik dashboard (`getDashboardStats`).
*   **Kekurangan (Gaps):**
    *   **Tanda Tangan Digital:** Kode memiliki `TODO: Trigger Digital Signature here` namun belum diimplementasikan.
    *   **Templating:** Belum ada mekanisme templating backend yang kuat; kemungkinan masih bergantung penuh pada frontend.
    *   **Konfigurasi Penomoran:** Format penomoran masih hardcoded (`[NO]/[TYPE]/[ROMAN]/[YEAR]`) dan belum configurable via UI.
    *   **Retensi Arsip:** Logika pemindahan status ke `ARCHIVED` berdasarkan masa retensi belum otomatis.

### Frontend (`apps/web/src/app/e-office`)
*   **Dashboard:** Sudah diimplementasikan lengkap dengan chart statistik dan kartu ringkasan.
*   **Flow:** Halaman Inbox, Outbox, dan Create sudah tersedia.
*   **Kekurangan (Gaps):**
    *   **Preview Surat:** Belum ada fitur preview surat real-time yang akurat sebelum digenerate menjadi PDF.
    *   **Verifikasi:** Belum ada halaman publik untuk memverifikasi keaslian surat via QR Code.
    *   **Tracking Disposisi:** Visualisasi pohon/alur disposisi (siapa ke siapa) belum intuitif.

---

## 2. Rencana Pengembangan (Comprehensive Plan)

### A. Backend Development (API)

#### 1. Implementasi Tanda Tangan Digital & QR Code
*   **Objective:** Menjamin keaslian surat.
*   **Action:**
    *   Integrasikan library QR Code generator.
    *   Saat status surat berubah menjadi `SIGNED` (setelah approval terakhir), generate QR Code yang berisi URL verifikasi (misal: `https://cipansor.id/verify/surat/{id}`).
    *   Simpan URL/Path QR code di database atau generate on-the-fly.
    *   Buat endpoint public `GET /public/verify/letter/:id` yang mengembalikan status validitas surat tanpa perlu login.

#### 2. Konfigurasi Penomoran Surat (Agenda Number)
*   **Objective:** Fleksibilitas format nomor surat sesuai kebutuhan unit.
*   **Action:**
    *   Buat endpoint CRUD untuk `AgendaNumber` agar admin bisa mengubah format string.
    *   Implementasikan parser token dinamis yang lebih lengkap: `[NO]`, `[ROMAN_MONTH]`, `[MONTH]`, `[YEAR]`, `[UNIT_CODE]`, `[CLASS_CODE]`.

#### 3. Enhancement Alur Disposisi
*   **Objective:** Mendukung hierarki disposisi yang kompleks.
*   **Action:**
    *   Pastikan `parentDispositionId` digunakan dengan benar untuk tracking disposisi berjenjang (Kepala -> Kabag -> Staff).
    *   Tambahkan fitur "Lapor Selesai" (Report Back) di mana bawahan bisa melaporkan hasil tindak lanjut disposisi ke atasan pengirim disposisi.

#### 4. Manajemen Arsip & Retensi
*   **Objective:** Kerapihan data jangka panjang.
*   **Action:**
    *   Manfaatkan field `retention` pada `FilingClassification`.
    *   Buat Scheduled Job (Cron) untuk menandai surat yang melewati masa retensi sebagai `ARCHIVED` atau memindahkannya ke cold storage jika perlu.

### B. Frontend Development (UI/UX)

#### 1. Letter Builder / Template Editor
*   **Objective:** Memudahkan pembuatan surat standar.
*   **Action:**
    *   Implementasi Rich Text Editor (TipTap atau Quill) dengan dukungan "Variables" (misal: Nama Penerima, Tanggal, dll).
    *   Sediakan template bawaan untuk jenis surat umum (Surat Tugas, Undangan, SK).

#### 2. Halaman Verifikasi Publik
*   **Objective:** Transparansi dan validasi eksternal.
*   **Action:**
    *   Buat halaman `/public/verify/[id]` (di luar layout dashboard admin).
    *   Tampilkan ringkasan surat (Nomor, Perihal, Penandatangan, Tanggal) dan status "VALID".

#### 3. UI Tracking Disposisi & Log Surat
*   **Objective:** Transparansi alur kerja.
*   **Action:**
    *   Pada detail surat, tambahkan tab "Log Aktivitas" atau "Riwayat".
    *   Visualisasikan alur disposisi (Tree View atau Timeline) agar terlihat jelas perjalanan surat dari masuk hingga selesai.

#### 4. Integrasi PDF Client-Side
*   **Objective:** Generasi dokumen yang cepat.
*   **Action:**
    *   Pastikan `html2canvas` dan `jspdf` menangani page break dengan benar untuk surat panjang.
    *   Sematkan QR Code yang digenerate backend ke dalam layout PDF.

---

## 3. Integrasi & Quality Assurance

### End-to-End Testing (Playwright)
Karena belum ada test suite khusus untuk modul ini, perlu dibuat `apps/web/e2e/e-office.spec.ts` yang mencakup skenario:
1.  **Skenario Surat Keluar:**
    *   User A (Staff) membuat draft surat.
    *   User B (Kepala) menerima notifikasi review -> melakukan Approve.
    *   Sistem otomatis mengubah status jadi SIGNED dan generate Nomor.
2.  **Skenario Surat Masuk & Disposisi:**
    *   User A (Resepsionis) input surat masuk.
    *   User B (Kepala) melakukan disposisi ke User C.
    *   User C menerima notifikasi dan menyelesaikan disposisi.

### Pre-commit Checks
*   Pastikan semua endpoint baru memiliki validasi Zod (`correspondence.schema.ts`).
*   Pastikan tipe data di frontend sinkron dengan backend (`@cipansor/shared`).

---

## 4. Referensi
*   Peraturan Menteri/Lembaga terkait Tata Naskah Dinas Elektronik (TNDE).
*   Best practice keamanan dokumen digital (Digital Signature).
