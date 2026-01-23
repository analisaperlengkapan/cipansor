# Requirements Document - Cipansor Enhancement

**Versi:** 2.0.0
**Tanggal:** 5 Desember 2025
**Status:** Draft
**Project:** Sistem Informasi Manajemen Yayasan Pesantren Cipansor

## Change History

| Versi | Tanggal    | Perubahan                  | Author      |
| ----- | ---------- | -------------------------- | ----------- |
| 1.0   | Phase 1-12 | Initial Implementation     | Dev Team    |
| 2.0   | 5 Dec 2025 | Enhancement & Gap Analysis | AI Planning |

---

## Daftar Isi

1. [Project Overview](#1-project-overview)
2. [Gap Analysis Summary](#2-gap-analysis-summary)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Functional Requirements - PAUD/TK](#4-functional-requirements---paudtk)
5. [Functional Requirements - SD IT](#5-functional-requirements---sd-it)
6. [Functional Requirements - SMP IT](#6-functional-requirements---smp-it)
7. [Functional Requirements - SMA Al-Qur'an](#7-functional-requirements---sma-al-quran)
8. [Functional Requirements - Pesantren Core](#8-functional-requirements---pesantren-core)
9. [Functional Requirements - Yayasan](#9-functional-requirements---yayasan)
10. [Integration Requirements](#10-integration-requirements)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Success Criteria](#12-success-criteria)

---

## 1. Project Overview

### 1.1 Project Goals

Mengembangkan lebih lanjut sistem informasi manajemen yang sudah ada untuk mencapai standar best practice sistem pendidikan Indonesia, dengan fokus pada:

- Integrasi end-to-end yang lebih baik antar modul
- Fitur spesifik per jenjang pendidikan (PAUD/TK, SD IT, SMP IT, SMA Al-Qur'an)
- Compliance dengan standar Kemenag & Kemendikbud
- User Experience yang lebih baik untuk semua stakeholder

### 1.2 Current State Summary

Sistem sudah memiliki:

- ✅ **55+ Backend Modules** - Fully implemented
- ✅ **60+ Frontend Pages** - Implemented
- ✅ **5170+ lines Prisma Schema** - Comprehensive
- ✅ **Multi-unit Support** - PAUD, TK, SD IT, SMP IT, SMA Al-Qur'an
- ✅ **Indonesia Compliance** - EMIS, Dapodik, BOS
- ✅ **Islamic Features** - Tahfidz, Muhasabah, Ibadah, Kitab Kuning

### 1.3 Target Users

| Role             | Unit          | Deskripsi                 |
| ---------------- | ------------- | ------------------------- |
| SUPER_ADMIN      | Global        | Akses seluruh sistem      |
| YAYASAN_ADMIN    | Yayasan       | Dashboard konsolidasi     |
| PAUD_ADMIN/GURU  | PAUD          | Catatan perkembangan anak |
| SDIT_ADMIN/GURU  | SD IT         | Kurikulum terintegrasi    |
| SMPIT_ADMIN/GURU | SMP IT        | Akademik + Pesantren      |
| SMAQ_ADMIN/GURU  | SMA Al-Qur'an | Tahfidz intensif          |
| PARENT           | All           | Portal monitoring anak    |
| STUDENT          | All           | Portal belajar mandiri    |

### 1.4 Tech Stack (Existing)

- **Backend:** Node.js, Express 5, TypeScript, Prisma ORM
- **Database:** PostgreSQL
- **Frontend:** Next.js 15+, React, TailwindCSS, shadcn/ui
- **Authentication:** JWT with Refresh Tokens
- **Documentation:** Swagger/OpenAPI

### 1.5 Project Structure

```
cipansor/
├── apps/
│   ├── api/          # Backend Express API
│   └── web/          # Frontend Next.js
├── packages/
│   └── shared/       # Shared types & utilities
└── docs/
    └── planning/     # Planning documents
```

---

## 2. Gap Analysis Summary

### 2.1 Fitur yang Sudah Ada (Existing)

| Modul               | Status      | Completeness |
| ------------------- | ----------- | ------------ |
| Auth & RBAC         | ✅ Complete | 95%          |
| User Management     | ✅ Complete | 95%          |
| Student Management  | ✅ Complete | 90%          |
| Class Management    | ✅ Complete | 90%          |
| Academic Year       | ✅ Complete | 95%          |
| Attendance          | ✅ Complete | 90%          |
| Tahfidz             | ✅ Complete | 85%          |
| Takhosus/Halaqoh    | ✅ Complete | 80%          |
| Dormitory           | ✅ Complete | 85%          |
| Permits             | ✅ Complete | 90%          |
| Violations/Rewards  | ✅ Complete | 85%          |
| Finance             | ✅ Complete | 85%          |
| Finance Enhancement | ✅ Complete | 80%          |
| Wallet              | ✅ Complete | 85%          |
| Canteen             | ✅ Complete | 85%          |
| Laundry             | ✅ Complete | 85%          |
| Payroll             | ✅ Complete | 80%          |
| PSB/PPDB            | ✅ Complete | 85%          |
| HR                  | ✅ Complete | 85%          |
| Library             | ✅ Complete | 85%          |
| Health/UKS          | ✅ Complete | 80%          |
| Inventory           | ✅ Complete | 85%          |
| Curriculum          | ✅ Complete | 80%          |
| Assessment          | ✅ Complete | 80%          |
| Kurikulum Merdeka   | ✅ Complete | 75%          |
| Alumni              | ✅ Complete | 80%          |
| Analytics           | ✅ Complete | 75%          |
| EMIS Integration    | ✅ Complete | 80%          |
| WhatsApp            | ✅ Complete | 75%          |
| Parent Portal       | ✅ Complete | 70%          |
| Extracurricular     | ✅ Complete | 80%          |
| Counseling          | ✅ Complete | 75%          |
| Duty Roster         | ✅ Complete | 80%          |
| Meals               | ✅ Complete | 80%          |
| Calendar            | ✅ Complete | 80%          |
| Kitab Progress      | ✅ Complete | 75%          |
| Muhadhoroh          | ✅ Complete | 75%          |
| Muhadatsah          | ✅ Complete | 75%          |
| Muhasabah           | ✅ Complete | 80%          |
| Donation            | ✅ Complete | 80%          |
| PKG                 | ✅ Complete | 75%          |
| Portfolio           | ✅ Complete | 70%          |
| Ibadah              | ✅ Complete | 75%          |
| Rapor Pesantren     | ✅ Complete | 70%          |
| Facilities          | ✅ Complete | 80%          |

### 2.2 Gap yang Teridentifikasi

#### Critical Gaps (Priority 1)

| Gap ID  | Module                | Description                  | Impact |
| ------- | --------------------- | ---------------------------- | ------ |
| GAP-001 | PAUD                  | Catatan perkembangan 6 aspek | High   |
| GAP-002 | PAUD                  | Raport narasi deskriptif     | High   |
| GAP-003 | Daily Report          | Laporan harian ke orang tua  | High   |
| GAP-004 | Dashboard Integration | Konsolidasi data antar unit  | High   |
| GAP-005 | API Optimization      | Performance & caching        | High   |

#### Major Gaps (Priority 2)

| Gap ID  | Module          | Description               | Impact |
| ------- | --------------- | ------------------------- | ------ |
| GAP-006 | Tahfidz         | Murojaah tracking detail  | Medium |
| GAP-007 | Tahfidz         | Simaan/Ujian Komprehensif | Medium |
| GAP-008 | Sanad           | Certificate generation    | Medium |
| GAP-009 | Student Profile | Enhanced for Dapodik      | Medium |
| GAP-010 | Raport          | K13 format complete       | Medium |

#### Minor Gaps (Priority 3)

| Gap ID  | Module        | Description           | Impact |
| ------- | ------------- | --------------------- | ------ |
| GAP-011 | UI/UX         | Mobile responsiveness | Low    |
| GAP-012 | Reports       | PDF export quality    | Low    |
| GAP-013 | Notifications | Email integration     | Low    |

---

## 3. User Roles & Permissions

### 3.1 Role Hierarchy (Existing)

```
SUPER_ADMIN (Global)
├── YAYASAN_ADMIN
│   ├── YAYASAN_KETUA
│   ├── YAYASAN_SEKRETARIS
│   └── YAYASAN_BENDAHARA
├── PAUD_ADMIN
│   ├── PAUD_KEPALA_SEKOLAH
│   ├── PAUD_GURU
│   └── PAUD_TATA_USAHA
├── SDIT_ADMIN
│   ├── SDIT_KEPALA_SEKOLAH
│   ├── SDIT_GURU
│   └── SDIT_TATA_USAHA
├── SMPIT_ADMIN
│   ├── SMPIT_KEPALA_SEKOLAH
│   ├── SMPIT_GURU
│   └── SMPIT_TATA_USAHA
├── SMAQ_ADMIN
│   ├── SMAQ_KEPALA_SEKOLAH
│   ├── SMAQ_GURU
│   └── SMAQ_TATA_USAHA
└── PARENT / STUDENT
```

### 3.2 New Roles to Add

| Role Code       | Realm     | Description               |
| --------------- | --------- | ------------------------- |
| PAUD_PENDAMPING | PAUD      | Guru Pendamping PAUD      |
| MUSYRIF         | Pesantren | Pembina Asrama (enhanced) |
| MUHAFIDZ        | Pesantren | Pengampu Tahfidz          |
| MURABBI         | Pesantren | Pembina Akhlaq            |
| WALI_KAMAR      | Pesantren | Penanggung jawab kamar    |

---

## 4. Functional Requirements - PAUD/TK

### 4.1 Catatan Perkembangan Anak [NEW]

**Refs:** GAP-001, Best Practice PAUD

#### 4.1.1 6 Aspek Perkembangan

Sistem HARUS mencatat perkembangan anak berdasarkan 6 aspek (Permendikbud 137/2014):

| Aspek               | Kode | Indikator Contoh                   |
| ------------------- | ---- | ---------------------------------- |
| Nilai Agama & Moral | NAM  | Doa harian, akhlaq, mengenal Allah |
| Fisik Motorik       | FM   | Motorik kasar, motorik halus       |
| Kognitif            | KOG  | Berhitung, problem solving         |
| Bahasa              | BHS  | Kosakata, bercerita, menyimak      |
| Sosial Emosional    | SE   | Berbagi, kerjasama, emosi          |
| Seni                | SNI  | Menggambar, menyanyi, kreativitas  |

**Data Fields:**

```
- student_id
- assessment_period_id (semester/bulanan)
- aspect_code: NAM | FM | KOG | BHS | SE | SNI
- achievement_level: BB | MB | BSH | BSB
  - BB = Belum Berkembang
  - MB = Mulai Berkembang
  - BSH = Berkembang Sesuai Harapan
  - BSB = Berkembang Sangat Baik
- narrative_text (deskripsi pencapaian)
- indicators[] (indikator yang dicapai)
- evidence_urls[] (foto/video bukti)
- teacher_notes
- recommendations (saran untuk orang tua)
```

#### 4.1.2 Assessment Input Interface

- Form input per aspek dengan indikator checklist
- Upload foto/video kegiatan sebagai bukti
- Quick input dengan template narasi
- Bulk input untuk seluruh kelas

#### 4.1.3 Progress Tracking

- Chart perkembangan per aspek per waktu
- Perbandingan dengan standar usia
- Alert untuk aspek yang perlu perhatian khusus

### 4.2 Raport Narasi PAUD [NEW]

**Refs:** GAP-002, Best Practice Raport PAUD

#### 4.2.1 Format Raport

- **Identitas:** Data lengkap anak & sekolah
- **Per Aspek:** Narasi deskriptif (bukan angka)
- **Ringkasan:** Kekuatan & area pengembangan
- **Rekomendasi:** Saran untuk orang tua
- **Foto:** Dokumentasi kegiatan semester

#### 4.2.2 Generate & Export

- Template raport sesuai standar PAUD
- Auto-generate narasi dari assessment data
- Export ke PDF dengan format resmi
- Print-ready layout

### 4.3 Daily Report PAUD [NEW]

**Refs:** GAP-003, Parent Communication

#### 4.3.1 Daily Check-In

| Field             | Type    | Description      |
| ----------------- | ------- | ---------------- |
| attendance_status | enum    | HADIR/SAKIT/IZIN |
| arrival_time      | time    | Jam kedatangan   |
| mood_indicator    | emoji   | 😊😐😢😴         |
| health_check      | object  | Suhu, kondisi    |
| breakfast_status  | boolean | Sudah sarapan?   |

#### 4.3.2 Activity Log (Guru Input)

| Field              | Type    | Description             |
| ------------------ | ------- | ----------------------- |
| meal_status        | enum    | Habis/Setengah/Sedikit  |
| snack_status       | enum    | Habis/Setengah/Sedikit  |
| nap_duration       | minutes | Lama tidur siang        |
| toilet_log         | text    | Catatan toilet training |
| activities_summary | text    | Ringkasan kegiatan      |
| photos[]           | urls    | Foto kegiatan           |
| teacher_notes      | text    | Catatan khusus          |
| homework_activity  | text    | Aktivitas di rumah      |

#### 4.3.3 Parent Notification

- Push notification ke app parent
- WhatsApp summary
- Email digest (opsional)

### 4.4 Portfolio Anak PAUD [Enhancement]

**Refs:** Existing Portfolio module

#### 4.4.1 Tipe Portfolio PAUD

- Hasil karya (gambar, craft)
- Foto kegiatan
- Video rekaman
- Catatan guru

#### 4.4.2 Integration

- Link ke assessment sebagai evidence
- Galeri per semester
- Share ke parent portal

### 4.5 Kesehatan & Tumbuh Kembang [Enhancement]

**Refs:** Existing Health module

#### 4.5.1 Monitoring Rutin

| Field          | Frequency | Standard                    |
| -------------- | --------- | --------------------------- |
| Berat Badan    | Bulanan   | Z-Score WHO                 |
| Tinggi Badan   | Bulanan   | Z-Score WHO                 |
| Lingkar Kepala | Bulanan   | Standar Kemenkes            |
| Status Gizi    | Bulanan   | Normal/Kurus/Gemuk/Stunting |

#### 4.5.2 Imunisasi Tracking

- Jadwal imunisasi sesuai usia
- Status per vaksin
- Reminder ke orang tua

---

## 5. Functional Requirements - SD IT

### 5.1 Kurikulum Terintegrasi [Enhancement]

**Refs:** Best Practice SD IT

#### 5.1.1 Struktur Kurikulum

| Komponen               | Jam/Minggu | Catatan                      |
| ---------------------- | ---------- | ---------------------------- |
| Nasional (K13/Merdeka) | 26 jam     | Matematika, IPA, IPS, dll    |
| Keislaman              | 10 jam     | Aqidah, Fiqih, Qur'an Hadits |
| Tahfidz                | 4-6 jam    | Target 3-5 juz               |
| Ekstra Keislaman       | Terjadwal  | Sholat Dhuha, Kultum         |

#### 5.1.2 Target Tahfidz SD IT

| Kelas   | Target Minimal | Target Optimal  |
| ------- | -------------- | --------------- |
| Kelas 1 | Juz 30 (50%)   | Juz 30 lengkap  |
| Kelas 2 | Juz 30 lengkap | Juz 30 + Juz 29 |
| Kelas 3 | 1.5 Juz        | 2 Juz           |
| Kelas 4 | 2 Juz          | 3 Juz           |
| Kelas 5 | 3 Juz          | 4 Juz           |
| Kelas 6 | 3-4 Juz        | 5 Juz           |

#### 5.1.3 Integrasi dengan Existing Tahfidz Module

- Set target per kelas/level
- Dashboard progress vs target
- Alert untuk siswa di bawah target

### 5.2 Penilaian K13/Merdeka SD [Enhancement]

**Refs:** GAP-010, Existing Assessment

#### 5.2.1 Komponen Penilaian K13

| Aspek               | Bobot     | Deskripsi       |
| ------------------- | --------- | --------------- |
| KI-1 (Spiritual)    | Deskripsi | Sikap keagamaan |
| KI-2 (Sosial)       | Deskripsi | Sikap sosial    |
| KI-3 (Pengetahuan)  | Nilai     | Kognitif        |
| KI-4 (Keterampilan) | Nilai     | Praktik         |

#### 5.2.2 Komponen Kurikulum Merdeka

- Capaian Pembelajaran per TP
- P5 (Projek Penguatan Profil Pelajar Pancasila)
- Assessmen Formatif & Sumatif

#### 5.2.3 Raport SD IT

- Format K13 atau Merdeka (configurable)
- Include nilai keislaman
- Include progress tahfidz
- Catatan wali kelas & kepala sekolah

### 5.3 Daily Report SD IT [NEW]

**Refs:** GAP-003, Parent Communication

#### 5.3.1 Daily Check-In

| Field             | Type    | Description               |
| ----------------- | ------- | ------------------------- |
| attendance_status | enum    | HADIR/SAKIT/IZIN          |
| sholat_dhuha      | boolean | Sudah sholat dhuha?       |
| tahfidz_today     | object  | Surah, ayat yg disetorkan |

#### 5.3.2 Activity Summary

| Field              | Type  | Description       |
| ------------------ | ----- | ----------------- |
| subjects_learned[] | array | Mapel hari ini    |
| homework[]         | array | PR yang diberikan |
| behavior_notes     | text  | Catatan perilaku  |
| achievements       | text  | Prestasi hari ini |
| teacher_notes      | text  | Catatan khusus    |

---

## 6. Functional Requirements - SMP IT

### 6.1 Kurikulum Terintegrasi SMP IT [Enhancement]

**Refs:** Best Practice SMP IT

#### 6.1.1 Target Tahfidz SMP IT

| Kelas     | Target Semester | Target Tahunan |
| --------- | --------------- | -------------- |
| Kelas 7   | 2-3 Juz         | 5-6 Juz        |
| Kelas 8   | 2-3 Juz         | 5-6 Juz        |
| Kelas 9   | 2-3 Juz         | 5-6 Juz        |
| **Total** | -               | **15-18 Juz**  |

### 6.2 Bimbingan Konseling [Enhancement]

**Refs:** Existing Counseling module

#### 6.2.1 Fitur Tambahan

- Career guidance (pemilihan SMA/MA)
- Academic counseling
- Rapor BK
- Referral tracking

### 6.3 Persiapan UN/AKM [NEW]

#### 6.3.1 Bank Soal

- Koleksi soal per mapel
- Kategorisasi berdasarkan level

#### 6.3.2 Try Out Management

- Jadwal try out
- Hasil & analisis
- Perbandingan dengan target

---

## 7. Functional Requirements - SMA Al-Qur'an

### 7.1 Program Tahfidz Intensif [Enhancement]

**Refs:** GAP-006, GAP-007, Best Practice Pesantren

#### 7.1.1 Target Hafalan SMA Al-Qur'an

| Kelas     | Target             | Program      |
| --------- | ------------------ | ------------ |
| Kelas 10  | 10 Juz             | Foundation   |
| Kelas 11  | 10 Juz             | Intermediate |
| Kelas 12  | 10 Juz + Sanad     | Completion   |
| **Total** | **30 Juz + Sanad** | Khatam       |

#### 7.1.2 Murojaah Tracking Detail

**Kategori Murojaah:**
| Tipe | Frekuensi | Target |
|------|-----------|--------|
| Murojaah Yaumiyah | Harian | 1-3 juz terakhir |
| Murojaah Usbu'iyah | Mingguan | 5 juz terakhir |
| Murojaah Syahriyah | Bulanan | All hafalan |

**Data Fields Tambahan:**

```
- murojaah_type: YAUMIYAH | USBUIYAH | SYAHRIYAH
- juz_range: [start_juz, end_juz]
- pages_reviewed
- duration_minutes
- quality_score (1-100)
- mistake_count
- mistake_types: [LAHIN_JALI, LAHIN_KHAFI, TAJWID]
```

#### 7.1.3 Simaan/Ujian Komprehensif

**Jenis Simaan:**
| Tipe | Deskripsi | Skor |
|------|-----------|------|
| Simaan Bi'n-Nazhr | Dengan melihat mushaf | - |
| Simaan Bil-Ghaib | Tanpa melihat | Scored |
| Simaan Tahdir | Persiapan (juz dipilih) | Scored |
| Simaan Tasmi' | Random testing | Scored |

**Ujian Khatam 30 Juz:**

- Simaan marathon (beberapa sesi)
- Panel penguji (3+ muhafidz)
- Penilaian per juz
- Sertifikat khatam
- Link ke Sanad record

### 7.2 Sistem Sanad & Ijazah [Enhancement]

**Refs:** GAP-008, Existing Sanad module

#### 7.2.1 Sanad Chain Documentation

```
- sanad_chain_id
- riwayat: HAFS | WARSH | QALUN | etc
- teacher_id (muhafidz yang memberikan)
- teacher_sanad_number
- chain_document_url (silsilah)
```

#### 7.2.2 Ijazah Types

| Tipe           | Persyaratan         | Output             |
| -------------- | ------------------- | ------------------ |
| Ijazah Tahfidz | Khatam 30 juz       | Sertifikat Khatam  |
| Ijazah Sanad   | + Lulus ujian sanad | Sertifikat Sanad   |
| Ijazah Qira'at | + Menguasai qira'at | Sertifikat Qira'at |

#### 7.2.3 Certificate Generation

- Template sertifikat resmi
- QR code untuk verifikasi
- Digital signature
- Public verification URL

### 7.3 Halaqoh Management [Enhancement]

**Refs:** Existing Halaqoh/Takhosus module

#### 7.3.1 Halaqoh Scheduling

- Jadwal per halaqoh (pagi/siang/sore)
- Rotasi muhafidz
- Kapasitas management
- Reshuffling per semester

#### 7.3.2 Halaqoh Performance

- Dashboard progress per halaqoh
- Perbandingan antar halaqoh
- Report ke kepala unit

---

## 8. Functional Requirements - Pesantren Core

### 8.1 Kajian Kitab Kuning [Enhancement]

**Refs:** Existing KitabProgress module

#### 8.1.1 Kitab Curriculum

| Level    | Kitab                 | Target    |
| -------- | --------------------- | --------- |
| Pemula   | Jurumiyah, Safinah    | 1 tahun   |
| Menengah | Imrithi, Fathul Qarib | 1-2 tahun |
| Lanjut   | Alfiyah, Fathul Mu'in | 2-3 tahun |

#### 8.1.2 Tracking Enhancement

- Sorogan (individual) tracking
- Bandongan (klasikal) tracking
- Musyawarah (diskusi) tracking
- Hafalan nadzom tracking

### 8.2 Muhadhoroh (Public Speaking) [Enhancement]

**Refs:** Existing Muhadhoroh module

#### 8.2.1 Penilaian Rubrik

| Aspek       | Bobot | Indikator                     |
| ----------- | ----- | ----------------------------- |
| Konten      | 30%   | Isi, dalil, relevansi         |
| Penyampaian | 30%   | Intonasi, gestur, eye contact |
| Bahasa      | 20%   | Grammar, kosakata             |
| Waktu       | 10%   | Sesuai alokasi                |
| Penampilan  | 10%   | Kerapian, sopan               |

#### 8.2.2 Rotation System

- Jadwal otomatis per santri
- Rotasi tema (keagamaan, motivasi, aktual)
- Rotasi bahasa (Indonesia, Arab, Inggris)
- Rotasi peran (MC, Qari, Speaker)

### 8.3 Muhadatsah (Arabic Conversation) [Enhancement]

**Refs:** Existing Muhadatsah module

#### 8.3.1 Program Levels

| Level       | Target              | Duration |
| ----------- | ------------------- | -------- |
| Mubtadi     | Daily vocabulary    | 6 bulan  |
| Mutawassith | Conversation        | 6 bulan  |
| Mutaqaddim  | Debate/Presentation | Ongoing  |

#### 8.3.2 Environment Enforcement

- "Arabic Zone" designation
- Violation tracking for non-Arabic speech
- Reward for consistent use

### 8.4 Asrama Management [Enhancement]

**Refs:** Existing Dormitory module

#### 8.4.1 Musyrif Assignment

- Per dormitory assignment
- Per room assignment (optional)
- Shift/rotation schedule
- Performance tracking

#### 8.4.2 Room Inspection

- Cleanliness scoring
- Inventory check
- Violation recording
- Photo documentation

### 8.5 Perizinan Santri [Enhancement]

**Refs:** Existing Permit module

#### 8.5.1 QR Code Gate System

- QR code per izin
- Gate scanning validation
- Actual departure/return logging
- Overstay alert

#### 8.5.2 Parent Pickup Verification

- Parent photo verification
- Phone verification
- Emergency contact validation

---

## 9. Functional Requirements - Yayasan

### 9.1 Consolidated Dashboard [NEW]

**Refs:** GAP-004

#### 9.1.1 Overview Metrics

| Metric               | Source       | Visualization  |
| -------------------- | ------------ | -------------- |
| Total Siswa          | All units    | Number + trend |
| Kehadiran Hari Ini   | Attendance   | % + breakdown  |
| Pendapatan Bulan Ini | Finance      | Rp + vs target |
| Progress Tahfidz     | Tahfidz      | Chart per unit |
| Prestasi             | Achievements | Recent list    |

#### 9.1.2 Unit Comparison

- Side-by-side metrics
- Performance ranking
- Trend analysis

#### 9.1.3 Alert System

- Financial alerts (overdue, low balance)
- Academic alerts (low performance)
- Compliance alerts (deadline, document expiry)

### 9.2 Consolidated Financial Report [Enhancement]

**Refs:** Existing Finance module

#### 9.2.1 Cross-Unit Reports

- Income consolidation
- Expense consolidation
- Cash flow per unit
- Budget vs actual per unit

#### 9.2.2 BOS/BOP Reporting

- Per unit BOS allocation
- Consolidated BOS report
- Compliance checklist

### 9.3 Accreditation Management [Enhancement]

**Refs:** Existing Accreditation features

#### 9.3.1 Self-Assessment

- 8 Standar Nasional checklist
- Evidence collection per standar
- Gap analysis

#### 9.3.2 Document Management

- Required documents list
- Expiry tracking
- Renewal reminders

---

## 10. Integration Requirements

### 10.1 External System Integration

#### 10.1.1 EMIS Kemenag [Existing, Enhancement]

- **Status:** Implemented, needs refinement
- **Enhancement:** Auto-sync schedule, validation improvement

#### 10.1.2 Dapodik Kemendikbud [Enhancement]

- **Status:** Partial implementation
- **Enhancement:** Complete field mapping, export validation

#### 10.1.3 Payment Gateway [Future]

- **Target:** Midtrans, Xendit
- **Features:** Online payment, virtual account, QRIS

#### 10.1.4 WhatsApp Business API [Existing, Enhancement]

- **Status:** Implemented
- **Enhancement:** Richer templates, scheduling improvement

### 10.2 Internal Integration

#### 10.2.1 Module Integration Matrix

| From       | To            | Data Flow              |
| ---------- | ------------- | ---------------------- |
| Attendance | Parent Portal | Real-time notification |
| Tahfidz    | Report Card   | Semester summary       |
| Finance    | Wallet        | Top-up, payment        |
| Assessment | Analytics     | Dashboard data         |
| Health     | Daily Report  | Health notes           |

---

## 11. Non-Functional Requirements

### 11.1 Performance

| Metric            | Target  | Current |
| ----------------- | ------- | ------- |
| API Response Time | < 200ms | ~300ms  |
| Page Load Time    | < 2s    | ~3s     |
| Concurrent Users  | 1000+   | 500     |
| Database Query    | < 100ms | ~150ms  |

### 11.2 Security

- JWT with short expiry (15 min access, 7 day refresh)
- Role-based access control (RBAC)
- Data encryption at rest
- Audit logging for sensitive operations

### 11.3 Scalability

- Horizontal scaling ready
- Database connection pooling
- Caching layer (Redis - future)

### 11.4 Availability

- Target: 99.5% uptime
- Backup: Daily automated
- Recovery: < 4 hours RTO

### 11.5 Usability

- Mobile-responsive design
- Accessibility (WCAG 2.1 AA)
- Multi-language support (ID, AR - future)

---

## 12. Success Criteria

### 12.1 Functional Success

| Criteria           | Metric            | Target |
| ------------------ | ----------------- | ------ |
| Feature Completion | % of requirements | 100%   |
| Bug-free Release   | Critical bugs     | 0      |
| User Acceptance    | UAT pass rate     | > 95%  |

### 12.2 Business Success

| Criteria           | Metric                | Target         |
| ------------------ | --------------------- | -------------- |
| User Adoption      | Active users          | > 80% of total |
| Data Quality       | Complete records      | > 95%          |
| Process Efficiency | Manual work reduction | > 50%          |

### 12.3 Technical Success

| Criteria          | Metric               | Target |
| ----------------- | -------------------- | ------ |
| Test Coverage     | Backend unit tests   | > 70%  |
| API Documentation | Swagger completeness | 100%   |
| Code Quality      | Lint errors          | 0      |

---

## Appendix A: Reference Documents

1. Permendikbud No. 137 Tahun 2014 - Standar PAUD
2. Permendikbud No. 146 Tahun 2014 - Kurikulum 2013 PAUD
3. KMA No. 183 Tahun 2019 - Kurikulum PAI & Bahasa Arab
4. Panduan EMIS Kemenag 2024
5. Panduan Dapodik Kemendikbud 2024
6. Standar Akreditasi BAN-SM/BAN-PAUD

---

**Status:** Draft - Awaiting Confirmation

**Next Step:** Konfirmasi requirements sebelum lanjut ke Database Design
