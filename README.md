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

Cipansor menyediakan antarmuka modern yang responsif untuk berbagai peran dan unit pendidikan.

### 1. Pusat Kendali Yayasan (Global)
Kelola seluruh ekosistem pesantren dalam satu dashboard terpusat.

| Dashboard Global | Profil Yayasan |
|-----------------|----------------|
| ![Dashboard Global](docs/images/dashboard-global.png) | ![Yayasan](docs/images/foundation.png) |

| Unit Pendidikan | Manajemen User |
|-----------------|----------------|
| ![Unit Pendidikan](docs/images/units.png) | ![Daftar Pengguna](docs/images/users.png) |

### 2. Dashboard Unit Pendidikan
Tampilan khusus yang disesuaikan untuk kebutuhan tiap jenjang pendidikan.

| Dashboard SMA Al-Qur'an | Dashboard PAUD/TK |
|-------------------------|-------------------|
| ![Dashboard SMA](docs/images/dashboard-sma.png) | ![Dashboard PAUD](docs/images/dashboard-paud.png) |


| Dashboard SD IT | Dashboard SMP IT |
|-----------------|------------------|
| ![Dashboard SD](docs/images/dashboard-sd.png) | ![Dashboard SMP](docs/images/dashboard-smp.png) |

### 3. Modul Akademik & KBM
Administrasi sekolah, kelas, siswa, dan pembelajaran terintegrasi.

| Data Siswa | Kelas & Rombel | Jadwal Pelajaran |
|------------|----------------|------------------|
| ![Manajemen Siswa](docs/images/students.png) | ![Daftar Kelas](docs/images/classes.png) | ![Jadwal](docs/images/schedule.png) |

| Kurikulum | Tahun Ajaran | Sertifikat |
|-----------|--------------|------------|
| ![Kurikulum](docs/images/curriculum.png) | ![Tahun Ajaran](docs/images/academic-years.png) | ![Sertifikat](docs/images/certificates.png) |


| Absensi Kehadiran | Penilaian & Kurikulum |
|-------------------|-----------------------|
| ![Rekap Absensi](docs/images/attendance.png) | ![Penilaian](docs/images/assessment.png) |

| Penilaian Khusus PAUD | Pengaturan Sistem |
|-----------------------|-------------------|
| ![Rapor PAUD](docs/images/paud-list.png) | ![Konfigurasi](docs/images/settings.png) |

### 4. Kepesantrenan & Tahfidz
Fitur khusus untuk mendukung program unggulan dan kedisiplinan santri.

| Dashboard Tahfidz | Jurnal Ibadah |
|-------------------|---------------|
| ![Hafalan Quran](docs/images/tahfidz.png) | ![Monitoring Ibadah](docs/images/ibadah.png) |

| Rapor Pesantren | |
|-----------------|---|
| ![Rapor Pesantren](docs/images/rapor-pesantren.png) | |

| Asrama Santri | Catatan Pelanggaran |
|---------------|---------------------|
| ![Kamar Santri](docs/images/dormitories.png) | ![Pelanggaran](docs/images/violations.png) |

| Layanan Kesehatan (UKS) | |
|--------------------------|---|
| ![Rekam Medis](docs/images/health.png) | ![Bimbingan Konseling](docs/images/counseling.png) | ![Ekstrakurikuler](docs/images/extracurricular.png) |
| *Layanan Kesehatan* | *Bimbingan Konseling* | *Kegiatan Ekstrakurikuler* |

### 5. Administrasi, Keuangan & PSB
Pengelolaan sumber daya yayasan yang akuntabel dan transparan.

| Keuangan & SPP | Kepegawaian (HR) |
|----------------|------------------|
| ![Laporan Keuangan](docs/images/finance.png) | ![Data Pegawai](docs/images/hr.png) |

| Inventaris Aset | PSB Online |
|-----------------|------------|
| ![Aset Yayasan](docs/images/inventory.png) | ![Penerimaan Santri](docs/images/psb.png) |

| Manajemen Fasilitas | |
|---------------------|---|
| ![Fasilitas](docs/images/facilities.png) | |

### 6. Portal & Akses lainnya

| Perpustakaan | Portal Orang Tua |
|--------------|-------------------|
| ![Katalog Buku](docs/images/library.png) | |

| **Portal Orang Tua** | **Data Anak** | **Keuangan** |
|:---:|:---:|:---:|
| ![Parent Portal](docs/images/parent-portal.png) | ![Anak](docs/images/parent-children.png) | ![Keuangan](docs/images/parent-finance.png) |
| *Dashboard Wali Murid* | *Monitoring Progres Anak* | *Info Tagihan & Pembayaran* |

| Halaman Login | |
|---------------|---|
| ![Login Page](docs/images/login.png) | |

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
*   **Testing**: Vitest

### Frontend (`apps/web`)
*   **Framework**: Next.js 16 (App Router)
*   **UI Library**: React 19, Tailwind CSS, shadcn/ui
*   **State Management**: Zustand, React Query
*   **Testing**: Playwright

### Infrastruktur
*   **Package Manager**: pnpm
*   **Monorepo Tool**: Turborepo
*   **Containerization**: Docker

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
