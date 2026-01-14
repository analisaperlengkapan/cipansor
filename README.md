# CIPANSOR

> **Sistem Manajemen Yayasan Pesantren Cipansor** - Platform terintegrasi untuk TK, SD IT, SMP IT, SMA Al-Qur'an dengan fokus tahfidz dan kurikulum pesantren terintegrasi.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-blueviolet.svg)](https://www.prisma.io/)
[![Express](https://img.shields.io/badge/Express-5-green.svg)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Daftar Isi

- [Overview](#-overview)
- [Antarmuka](#-antarmuka)
- [Fitur Utama](#-fitur-utama)
- [Modul](#-modul)
- [Teknologi](#-teknologi)
- [Instalasi](#-instalasi)
- [Pengembangan](#-pengembangan)
- [Dokumentasi API](#-dokumentasi-api)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)

---

## 🎯 Overview

**Cipansor** adalah sistem manajemen terintegrasi (ERP) yang dirancang khusus untuk kebutuhan **Yayasan Pesantren Cipansor**. Sistem ini mengelola berbagai unit pendidikan mulai dari TK, SD IT, SMP IT, hingga SMA Al-Qur'an dalam satu platform terpadu.

Sistem ini menggabungkan manajemen akademik sekolah formal dengan manajemen kepesantrenan (tahfidz, asrama, perizinan) serta manajemen administratif yayasan (keuangan, SDM, aset).

---

## 💻 Antarmuka

Cipansor menyediakan antarmuka modern yang responsif dan terorganisir berdasarkan modul fungsional.

### 1. Dashboard Eksekutif & Unit
Pusat kendali utama untuk memantau statistik dan kinerja seluruh unit pendidikan.

| Dashboard Global | Dashboard SMA Al-Qur'an |
|------------------|-------------------------|
| ![Dashboard Global](docs/images/dashboard-global.png) | ![Dashboard SMA](docs/images/dashboard-sma.png) |

| Dashboard SMP IT | Dashboard SD IT |
|------------------|-----------------|
| ![Dashboard SMP](docs/images/dashboard-smp.png) | ![Dashboard SD](docs/images/dashboard-sd.png) |

| Dashboard PAUD/TK | Login System |
|-------------------|--------------|
| ![Dashboard PAUD](docs/images/dashboard-paud.png) | ![Login](docs/images/login.png) |

### 2. Manajemen Yayasan (Foundation)
Pengelolaan sumber daya yayasan secara terpusat.

| Profil & Legalitas | Manajemen Unit |
|--------------------|----------------|
| ![Yayasan](docs/images/foundation.png) | ![Unit Pendidikan](docs/images/units.png) |

| Manajemen User | Kepegawaian (HR) |
|----------------|------------------|
| ![User Management](docs/images/users.png) | ![Data Pegawai](docs/images/hr.png) |

| Detail Pegawai | Keuangan Yayasan |
|----------------|------------------|
| ![Detail Pegawai](docs/images/employee-detail.png) | ![Keuangan](docs/images/finance.png) |
| Laporan (Reports) | Analitik (Analytics) |
| ![Reports](docs/images/reports.png) | ![Analytics](docs/images/analytics.png) |

### 3. Akademik & Pembelajaran
Sistem administrasi sekolah yang komprehensif.

| Data Siswa | Detail Siswa |
|------------|--------------|
| ![Manajemen Siswa](docs/images/students.png) | ![Profil Siswa](docs/images/student-detail.png) |

| Manajemen Kelas | Jadwal Pelajaran |
|-----------------|------------------|
| ![Kelas](docs/images/classes.png) | ![Jadwal](docs/images/schedule.png) |
| Kalender Akademik | Piket Santri (Duty Roster) |
| ![Calendar](docs/images/calendar.png) | ![Duty Roster](docs/images/duty-roster.png) |

| Kurikulum | Tahun Ajaran |
|-----------|--------------|
| ![Kurikulum](docs/images/curriculum.png) | ![Tahun Ajaran](docs/images/academic-years.png) |

| Absensi | Penilaian (Rapor) |
|---------|-------------------|
| ![Kehadiran](docs/images/attendance.png) | ![Penilaian](docs/images/assessment.png) |

| Sertifikat & Ijazah | Rapor PAUD |
|---------------------|------------|
| ![Sertifikat](docs/images/certificates.png) | ![Rapor PAUD](docs/images/paud-list.png) |

| Wali Kelas (Homeroom) | |
|-----------------------|---|
| ![Homeroom](docs/images/homeroom.png) | |

### 4. Kepesantrenan (Boarding System)
Fitur unggulan untuk manajemen pendidikan Islam berasrama.

| Dashboard Tahfidz | Monitoring Ibadah |
|-------------------|-------------------|
| ![Tahfidz](docs/images/tahfidz.png) | ![Jurnal Ibadah](docs/images/ibadah.png) |

| Rapor Pesantren | Asrama Santri |
|-----------------|---------------|
| ![Rapor Pesantren](docs/images/rapor-pesantren.png) | ![Asrama](docs/images/dormitories.png) |

| Pelanggaran (Kedisiplinan) | Konseling |
|----------------------------|-----------|
| ![Pelanggaran](docs/images/violations.png) | ![Bimbingan Konseling](docs/images/counseling.png) |

### 5. Fasilitas & Layanan Pendukung
Modul pendukung operasional harian.

| Kesehatan (UKS) | Perpustakaan |
|-----------------|--------------|
| ![UKS](docs/images/health.png) | ![Perpustakaan](docs/images/library.png) |

| Fasilitas & Sarana | Inventaris & Aset |
|--------------------|-------------------|
| ![Fasilitas](docs/images/facilities.png) | ![Inventaris](docs/images/inventory.png) |

| Laundry Santri | Kantin |
|----------------|--------|
| ![Laundry](docs/images/laundry.png) | ![Kantin](docs/images/canteen.png) |

| Ekstrakurikuler | Alumni |
|-----------------|--------|
| ![Ekstrakurikuler](docs/images/extracurricular.png) | ![Alumni](docs/images/alumni.png) |

| Penerimaan Santri Baru (PSB) | |
|------------------------------|---|
| ![PSB](docs/images/psb.png) | |

### 6. Portal Wali Santri
Akses khusus bagi orang tua untuk memantau perkembangan anak.

| Dashboard Wali Murid | Data & Progres Anak |
|----------------------|---------------------|
| ![Parent Portal](docs/images/hack-portal.png) | ![Data Anak](docs/images/hack-children.png) |

| Info Keuangan & Tagihan | |
|-------------------------|---|
| ![Keuangan Orang Tua](docs/images/hack-finance.png) | |

### 7. Pengaturan & Personalisasi
Konfigurasi sistem yang fleksibel.

| Profil Pengguna | Pengaturan Tampilan |
|-----------------|---------------------|
| ![Profil](docs/images/settings-profile.png) | ![Tampilan](docs/images/settings-appearance.png) |

| Keamanan Akun | Konfigurasi Umum |
|---------------|------------------|
| ![Keamanan](docs/images/settings-users.png) | ![Pengaturan Umum](docs/images/settings.png) |
| Notifikasi | |
| ![Notifications](docs/images/notifications.png) | |

---

## ✨ Fitur Utama

Sistem Cipansor memiliki fitur-fitur unggulan yang disesuaikan dengan kebutuhan pesantren modern:

*   **Multi-Unit Management**: Mengelola TK, SD, SMP, SMA dalam satu dashboard terpusat.
*   **Manajemen Tahfidz**: Pencatatan hafalan (ziyadah, murojaah), penilaian, dan laporan perkembangan santri.
*   **Kesantrian & Asrama**: Pengelolaan kamar, perizinan keluar/pulang, pelanggaran, dan poin penghargaan.
*   **Akademik Terpadu**: Jadwal pelajaran, absensi, penilaian, dan rapor (K13 & Kurikulum Merdeka).
*   **Keuangan & SPP**: Tagihan otomatis, pembayaran via berbagai metode, dan laporan keuangan yayasan.
*   **Portal Orang Tua**: Akses bagi wali santri untuk memantau hafalan, akademik, dan tagihan anak.

---

## 🧩 Modul

Cipansor terdiri dari berbagai modul yang saling terintegrasi:

### 1. Modul Akademik
*   Manajemen Siswa & Guru
*   Kelas & Tahun Ajaran
*   Jadwal Pelajaran
*   Absensi (Siswa & Guru)
*   Penilaian & Rapor

### 2. Modul Kepesantrenan
*   **Tahfidz**: Target hafalan, setoran harian, ujian tahfidz.
*   **Asrama**: Data kamar, penempatan santri, piket.
*   **Perizinan**: Izin sakit, pulang, atau keluar komplek.
*   **Kedisiplinan**: Poin pelanggaran dan prestasi.

### 3. Modul Administratif
*   **Keuangan**: SPP, uang gedung, tabungan santri.
*   **SDM**: Data pegawai, penggajian (payroll), cuti.
*   **Aset & Inventaris**: Manajemen aset yayasan dan pemeliharaan.
*   **PSB (Penerimaan Santri Baru)**: Pendaftaran online, seleksi, dan pengumuman.

### 4. Modul Pendukung
*   **Perpustakaan**: Sirkulasi buku dan katalog.
*   **UKS (Kesehatan)**: Rekam medis santri dan stok obat.
*   **Alumni**: Database alumni dan legalisir ijazah.

---

## 🛠 Teknologi

Dibangun dengan teknologi modern untuk performa dan skalabilitas tinggi:

### Backend (`apps/api`)
*   **Framework**: Express.js
*   **Bahasa**: TypeScript
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Real-time**: Socket.IO + Redis
*   **Testing**: Vitest

### Frontend (`apps/web`)
*   **Framework**: Next.js 16 (App Router)
*   **UI Library**: React 19, Tailwind CSS, shadcn/ui
*   **State Management**: Zustand, React Query
*   **Testing**: Playwright (E2E)

### Infrastruktur
*   **Package Manager**: pnpm
*   **Monorepo Tool**: Turborepo
*   **Containerization**: Docker
*   **CI/CD**: GitHub Actions

---

## 🚀 Instalasi

Ikuti langkah berikut untuk menjalankan proyek di lingkungan lokal Anda:

### Prasyarat
*   Node.js (v20+)
*   pnpm
*   PostgreSQL
*   Docker (Opsional)

### Langkah-langkah

1.  **Clone Repository**
    ```bash
    git clone https://github.com/your-org/cipansor.git
    cd cipansor
    ```

2.  **Install Dependencies**
    ```bash
    pnpm install
    ```

3.  **Setup Environment Variables**
    Salin file `.env.example` ke `.env` dan sesuaikan konfigurasinya.
    ```bash
    cp .env.example .env
    ```

4.  **Setup Database**
    Pastikan PostgreSQL berjalan, lalu jalankan migrasi dan seeding data awal.
    ```bash
    pnpm db:push
    pnpm db:seed
    ```

5.  **Jalankan Aplikasi**
    ```bash
    pnpm dev
    ```

    Akses aplikasi di:
    *   Web: `http://localhost:3000`
    *   API: `http://localhost:3001`

---

## 💻 Pengembangan

Perintah-perintah umum yang digunakan dalam pengembangan:

*   `pnpm dev`: Menjalankan semua aplikasi dalam mode development.
*   `pnpm build`: Membuild aplikasi untuk produksi.
*   `pnpm lint`: Memeriksa kode dengan ESLint.
*   `pnpm test`: Menjalankan unit test.
*   `pnpm db:studio`: Membuka Prisma Studio untuk melihat data database.

### Testing

#### E2E Testing (Playwright)

```bash
# Run all E2E tests
cd apps/web
pnpm test:e2e

# Run with UI mode
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Debug tests
pnpm test:e2e:debug

# View test report
pnpm test:e2e:report

# Cross-browser testing
pnpm test:e2e:firefox
pnpm test:e2e:webkit
pnpm test:e2e:mobile

# Using test runner script (recommended)
./run-e2e.sh              # All tests with pre-flight checks
./run-e2e.sh --ui         # UI mode
./run-e2e.sh --file auth.spec.ts  # Specific file
```

**Documentation:**
- 📖 [E2E Testing Guide](docs/E2E_TESTING_GUIDE.md) - Comprehensive guide
- 🏗️ [E2E Architecture](docs/E2E_TESTING_ARCHITECTURE.md) - Architecture diagrams
- ✅ [E2E Checklist](docs/planning/E2E_TESTING_CHECKLIST.md) - Implementation checklist
- 📊 [E2E Summary](docs/planning/E2E_OPTIMIZATION_SUMMARY.md) - Optimization summary

**Test Coverage:**
- ✅ Authentication (11 tests)
- ✅ Dashboard Real-time (9 tests)
- ✅ Tahfidz Dashboard (8 tests)
- ✅ PAUD Module (15 tests)
- ✅ Finance Reports (5 tests)
- ✅ Analytics (8 tests)

**Total:** ~56 E2E tests | **Performance:** 62% faster | **Flakiness:** <5%

---

## 📚 Dokumentasi API

Dokumentasi lengkap API tersedia di endpoint `/docs` pada service API (jika Swagger diaktifkan) atau dapat dilihat pada file spesifikasi di folder `docs/`.

Contoh endpoint utama:
*   `POST /api/auth/login`: Masuk ke sistem
*   `GET /api/students`: Mengambil daftar santri
*   `GET /api/tahfidz/records`: Mengambil data hafalan

---

## 🤝 Kontribusi

Kami menyambut kontribusi dari komunitas! Silakan ikuti langkah berikut:

1.  Fork repository ini.
2.  Buat branch fitur baru (`git checkout -b fitur-keren`).
3.  Commit perubahan Anda (`git commit -m 'Menambahkan fitur keren'`).
4.  Push ke branch (`git push origin fitur-keren`).
5.  Buat Pull Request.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

**Dibuat dengan ❤️ untuk Kemajuan Pendidikan Islam di Indonesia**
