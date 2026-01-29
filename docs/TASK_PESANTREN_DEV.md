# Task: Dev Modul Manajemen Pesantren

**Status:** In Progress
**Priority:** High
**Assignee:** Jules (AI Agent)

## Deskripsi Task
Mengembangkan lebih lanjut fitur backend dan tampilan frontend sistem informasi manajemen pesantren, memastikan integrasi end-to-end antar modul, serta merapikan dan menuntaskan fitur-fitur yang belum lengkap sesuai standar best practice pesantren.

## Analisis Codebase (Current State)

### Modul yang Sudah Ada
1.  **Perizinan (Permits):**
    *   Backend: `apps/api/src/modules/permits` (Lengkap dengan notifikasi ortu & auto-attendance).
    *   Frontend: `apps/web/src/app/permits` (Lengkap dengan approval flow).
2.  **Pelanggaran (Violations):**
    *   Backend: `apps/api/src/modules/violations` (CRUD dasar ada).
    *   Frontend: `apps/web/src/app/violations` (Tampilan ada, Summary card ada tapi endpoint mungkin missing).
    *   *Gap:* Tidak ada notifikasi ke orang tua saat pelanggaran dicatat. Tidak ada endpoint global summary yang dipanggil oleh frontend. Tidak ada logika akumulasi poin (SP).
3.  **Tahfidz & Takhosus:**
    *   Modul sudah ada dan cukup komprehensif.
4.  **Ibadah & Asrama:**
    *   Backend ada, integrasi frontend perlu diperiksa lebih lanjut.

## Gap Analysis & Rencana Pengembangan

### 1. Unified Kesantrian Dashboard (Dashboard Kesantrian)
**Masalah:** Saat ini data Kesantrian (Pelanggaran, Perizinan, Prestasi) terpecah di menu yang berbeda. Kabag Kesantrian butuh satu view untuk melihat kesehatan kedisiplinan pesantren secara menyeluruh.

**Solusi:**
- Buat halaman `apps/web/src/app/kesantrian/page.tsx`.
- Tampilkan widget:
  - Jumlah Santri Izin (Active Permits).
  - Statistik Pelanggaran (Total, Tren Mingguan).
  - Top 5 Pelanggaran Terbanyak (Kategori).
  - Top 5 Santri dengan Poin Pelanggaran Tertinggi (Watchlist).
- Tambahkan menu navigasi baru.

### 2. Peningkatan Modul Pelanggaran (Violations Enhancement)
**Masalah:**
- Endpoint `/violations/summary` yang dipanggil frontend ternyata belum ada di backend controller/routes.
- Orang tua tidak mendapat notifikasi real-time saat anak melakukan pelanggaran.

**Solusi:**
- Implementasi endpoint `GET /violations/summary` di backend.
- Tambahkan trigger `createNotification` (WhatsApp/App) ke orang tua saat pelanggaran di-input.

### 3. Integrasi & Perapihan
- Pastikan role permission diatur dengan benar untuk dashboard baru.
- Pastikan UI konsisten dengan Shadcn UI.

## Roadmap Implementasi

### Phase 1: Core Fixes & Enhancements (Current Session)
- [x] Analisis Codebase.
- [ ] Fix Backend Violations (Summary Endpoint & Notifications).
- [ ] Implementasi Frontend Dashboard Kesantrian.
- [ ] Update Navigasi.

### Phase 2: Advanced Features (Future)
- [ ] Logika Poin & SP Otomatis (Jika poin > 50 -> Auto Generate SP1).
- [ ] Integrasi Laporan Kesehatan (UKS) ke Dashboard Kesantrian.
- [ ] Integrasi Hafalan (Tahfidz) ke Parent Dashboard sebagai "Morning Update".

---
*Dokumen ini dibuat otomatis sebagai bagian dari langkah perencanaan.*
