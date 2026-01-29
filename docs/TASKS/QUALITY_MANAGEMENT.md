# Task: Dev Modul Manajemen Kualitas

**Status:** Completed

## Deskripsi Task
- Cek codebase
- Kembangkan lebih lanjut fitur backend dan tampilan frontendnya, sesuai standar, best practice sistem informasi manajemen kualitas
- Plan dengan mendalam komprehensif
- Pastikan integrasi end to end antar modul dan antara frontend dengan backend
- Rapih, tuntas

## Analisis Codebase
Modul `quality` (Manajemen Mutu) dan `complaint` (Aduan) sudah tersedia secara struktur di repository:
- **Backend:** `apps/api/src/modules/quality` memiliki Controller dan Service yang lengkap untuk standar, indikator, evidence, dan audit.
- **Frontend:** `apps/web/src/app/quality` memiliki Dashboard dan halaman detail standar. `apps/web/src/app/quality/complaints` memiliki UI manajemen aduan.
- **Database:** `schema.prisma` mencakup `QualityStandard`, `QualityIndicator`, `QualityAudit`, dll.

**Masalah Utama:**
Modul tidak dapat digunakan (kosong) karena tabel `QualityStandard` tidak di-seed dengan data standar (8 Standar Nasional Pendidikan). User melihat dashboard kosong. Selain itu, menu "Aduan" tersembunyi dan tidak terintegrasi ke dashboard Mutu.

## Implementasi & Solusi

1.  **Backend Seeding (Best Practice):**
    - Membuat `apps/api/prisma/seeds/quality-standards.ts` yang berisi 8 Standar Nasional Pendidikan (SNP) beserta indikator sampelnya.
    - Mengintegrasikan seeder ini ke `apps/api/prisma/seed.ts` agar otomatis dijalankan saat setup environment.

2.  **Frontend Integration:**
    - Memodifikasi `apps/web/src/app/quality/page.tsx` (Dashboard Mutu).
    - Menambahkan Card navigasi "Aduan & Aspirasi" yang mengarah ke modul Complaints yang sudah ada. Ini memastikan integrasi end-to-end antara Penjaminan Mutu dan Umpan Balik (Aduan).

## Hasil Akhir
- Dashboard Mutu sekarang menampilkan 8 Standar yang siap diisi evidence-nya.
- Terdapat akses mudah ke Audit Internal dan Manajemen Aduan dalam satu tempat.
- Sistem siap digunakan untuk akreditasi atau SPMI (Sistem Penjaminan Mutu Internal).
