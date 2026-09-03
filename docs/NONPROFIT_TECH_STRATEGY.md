# STRATEGI OPTIMALISASI TEKNOLOGI NONPROFIT CIPANSOR
## Pemanfaatan Maksimal Google Workspace & Microsoft for Nonprofits

Document Status: **DRAFT FOR REVIEW / APPROVAL**
Target Organization: **Yayasan Pesantren Cipansor**
Date: **2025**

---

## 1. RINGKASAN EKSEKUTIF & TUJUAN STRATEGIS

Yayasan Pesantren Cipansor saat ini berhak dan telah mendapatkan akses ke dua ekosistem teknologi nonprofit global:
1. **Google Workspace for Nonprofits** (Lisensi Gratis / Grant)
2. **Microsoft for Nonprofits** (Lisensi Microsoft 365 Business Basic Gratis s.d. 300 user + Grant Azure USD 2.000 / tahun)

Dokumen ini menyusun strategi arsitektur dan bisnis terbaik untuk menggabungkan kedua benefit tersebut guna memberikan **dampak operasional terbesar, keamanan maksimal, dan efisiensi biaya sebesar 100% (Rp 0/bulan untuk software & cloud server infrastruktur dasar)**.

---

## 2. ANALISIS PINTU MASUK & IDENTITAS (SSO / SINGLE SIGN-ON)

### 2.1 Evaluasi Opsi Autentikasi

| Opsi Autentikasi | Kelebihan | Kekurangan | Kesimpulan & Kelayakan |
|---|---|---|---|
| **1. Lokal Saja (Password di DB Prisma)** | • Sederhana, tidak tergantung pihak ketiga.<br>• Kontrol penuh di DB sendiri. | • Beban manajemen password & reset di admin.<br>• Resiko keamanan (phishing/leaked password) tinggi.<br>• Tidak ada MFA bawaan ekosistem domain. | ❌ Kurang Direkomendasikan untuk Staf/Guru. Tetap dipakai khusus Santri/Wali Murid yang belum punya email domain. |
| **2. Google OAuth Saja** | • Sangat familiar bagi pengguna Indonesia.<br>• Integrasi native dengan Gmail, Google Drive, Google Classroom.<br>• Login 1-klik via browser Chrome/Android. | • Tergantung 1 provider.<br>• Pengguna Microsoft Outlook/Teams butuh login terpisah. | 🟡 Baik, tapi membatasi efisiensi lisensi Microsoft 365. |
| **3. Microsoft Entra ID (Azure AD) Saja** | • Keamanan kelas enterprise (Conditional Access, MFA).<br>• Integrasi seamless dengan M365 (Office Web, Teams, OneDrive). | • Antarmuka login Microsoft kurang akrab bagi sebagian wali murid. | 🟡 Baik untuk staf internal, kurang fleksibel untuk eksternal. |
| **4. Hybrid Keduanya (Google + Microsoft)** | • Fleksibel.<br>• Pengguna bisa pilih "Login with Google" atau "Login with Microsoft". | • Kompleksitas sinkronisasi akun (2 provider terpisah jika email beda). | 🟠 Rumit di sisi manajemen pengguna jika tidak terpusat. |
| **5. Hybrid Terpusat (Lokal + Google Workspace SSO + Microsoft Entra ID OIDC)** | • **Paling Ideal**: Pengguna internal (Guru/Staf/Yayasan) menggunakan Email Domain (`@cipansor.or.id`) via **Google Workspace SSO** atau **Microsoft Entra ID**.<br>• Santri / Wali Santri / Alumni dapat menggunakan Akun Lokal (Password/OTP) atau Google Personal.<br>• Admin bisa memetakan RoleCode otomatis berdasarkan domain/email. | • Membutuhkan setup OAuth2/OIDC di backend API (`apps/api`). | **✅ REKOMENDASI UTAMA (BEST PRACTICE)** |

### 2.2 Rekomendasi Arsitektur Autentikasi Cipansor
* **Pengguna Internal (Yayasan, Kepala Sekolah, Guru, Staf TU):** Mandatory Single Sign-On (SSO) menggunakan akun Google Workspace / Microsoft 365 domain `@cipansor.or.id`.
* **Pengguna Eksternal (Siswa, Wali Santri, Alumni, Calon Santri PSB):** Menggunakan kombinasi Email/Password Lokal + Google OAuth2 Publik.

---

## 3. STRATEGI PEMBAGIAN PERAN & EKOSISTEM SOFTWARE (BEST PRACTICE WORKFLOW)

Agar tidak terjadi tumpang tindih penggunaan antara Google Workspace dan Microsoft 365, berikut pembagian standar terbaik (*best practice mapping*):

```
                                  ┌─────────────────────────────────────────┐
                                  │       PORTAL UTAMA SIB CIPANSOR         │
                                  │       (portal.cipansor.or.id)           │
                                  └────────────────────┬────────────────────┘
                                                       │
                     ┌─────────────────────────────────┴─────────────────────────────────┐
                     ▼                                                                   ▼
       ┌───────────────────────────┐                                       ┌───────────────────────────┐
       │   GOOGLE WORKSPACE HUB    │                                       │   MICROSOFT 365 & AZURE   │
       └─────────────┬─────────────┘                                       └─────────────┬─────────────┘
                     │                                                                   │
    ┌────────────────┴──────────────┐                                   ┌────────────────┴──────────────┐
    │ • Gmail (Email Resmi System)   │                                   │ • Azure Cloud Host ($2.000/th)│
    │ • Google Ad Grants ($10k/bln) │                                   │ • Azure Blob Storage (Docs/PDF│
    │ • Google Drive (Dokumen Guru) │                                   │ • Microsoft Teams (Rapat Inst)│
    │ • Google Forms/Sheets (Survei)│                                   │ • SharePoint (Arsip Yayasan)  │
    └───────────────────────────────┘                                   └───────────────────────────────┘
```

### 3.1 Google Workspace for Nonprofits
* **Fungsi Utama:**
  1. **Gmail API Integration:** Email transaksional sistem (Notifikasi, E-Office, Reset Password, Tagihan SPP) via `noreply@cipansor.or.id`.
  2. **Google Ad Grants ($10,000/bulan):** Promosi Penerimaan Santri Baru (PPDB), Kampanye Donasi & Wakaf Pesantren di Google Search.
  3. **Google Drive & Docs:** Kolaborasi penyusunan RPP/Modul Ajar Guru, Kurikulum Merdeka, dan dokumen operasional harian sekolah.
  4. **Google Meet & Calendar:** Jadwal Kalender Akademik terintegrasi & Rapat Orang Tua Santri Online.

### 3.2 Microsoft for Nonprofits & Azure Grant ($2,000/Tahun)
* **Fungsi Utama:**
  1. **Azure Cloud Infrastructure (Host Aplikasi & Database):**
     - Azure App Service / Azure Container Apps untuk running Container Docker `cipansor-api` & `cipansor-web`.
     - Azure Database for PostgreSQL (Flexible Server) atau VM Postgres.
     - Menghemat biaya hosting server hingga Rp 0/tahun (sepenuhnya ditutup Grant USD 2,000).
  2. **Azure Blob Storage:** Storage terpusat berkas PDF E-Office, Surat Keputusan Yayasan, Dokumen Persyaratan PPDB, & Foto Kegiatan.
  3. **Microsoft Teams & SharePoint:** Arsip dokumen legalitas Yayasan yang sensitif dengan proteksi DLP (Data Loss Prevention) bawaan Microsoft.

---

## 4. OPTIMALISASI BERKAS & STORAGE (E-OFFICE, PPDB, & SANTRI)

### 4.1 Permasalahan Saat Ini
Saat ini, file E-Office, lampiran Tanda Tangan Digital (E-Sign), dan berkas pendaftaran PPDB disimpan secara lokal atau di memori, yang rentan kehilangan data saat redeploy container Docker dan membebani database.

### 4.2 Solusi Arsitektur Storage Terintegrasi
Mengintegrasikan **Azure Blob Storage** (menggunakan Azure Grant $2.000) sebagai S3-compatible / Azure Storage Provider utama di backend Express (`apps/api`):
* Container `e-office-documents`: Menampung PDF Surat Keluar/Masuk, Lampiran, & QR E-Sign.
* Container `student-documents`: Menampung Berkas Akta/KK/Ijazah Santri & PPDB.
* Container `media-public`: Menampung Foto Galeri, Banner Landing Page, dan Bukti Transfer Donasi/SPP.

---

## 5. PEMASARAN DIGITAL & PPDB (GOOGLE AD GRANTS $10.000/BULAN)

### 5.1 Strategi Funnel Penerimaan Santri Baru (PPDB) & Donasi
1. **Target Kata Kunci (Google Search Ads):**
   - "Pesantren Tahfidz Terbaik di [Lokasi/Jabar]"
   - "SMA Al-Qur'an Beasiswa"
   - "Pendaftaran SMP IT / SD IT Tahfidz 2025"
   - "Wakaf Pembangunan Pesantren"
2. **Landing Page Optimization (`cipansor.or.id/psb` & `/donasi`):**
   - Integrasi Google Analytics 4 (GA4) & Google Tag Manager untuk tracking konversi formulir pendaftaran PSB.
   - Pendaftaran online langsung terhubung ke Modul PPDB SIB Cipansor.

---

## 6. MATRIKS IMPLEMENTASI KODE (DELIVERABLE B ROADMAP)

Setujui dokumen strategi ini untuk melangkah ke eksekusi kode (Deliverable B) berikut:

1. **Backend Auth Module (`apps/api/src/modules/auth`)**:
   - Menambahkan endpoint `GET /api/auth/google` & `GET /api/auth/azure` (OAuth2 / OIDC authentication).
   - Sinkronisasi otomatis akun Google/Microsoft ke tabel `User` & `UserRole`.
2. **Storage Module (`apps/api/src/modules/storage`)**:
   - Menambahkan Azure Blob Storage provider service untuk penanganan upload berkas E-Office & PPDB.
3. **Dokumentasi Deployment Azure (`docs/AZURE_DEPLOYMENT.md`)**:
   - Panduan deployment Docker container Cipansor ke Azure App Service / Container Apps menggunakan Azure Nonprofits Grant.
