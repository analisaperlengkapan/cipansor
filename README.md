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
- [Screenshots](#-screenshots)
- [Features](#-features)
- [Module Roadmap](#-module-roadmap)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🎯 Overview

**Cipansor** adalah sistem manajemen terintegrasi untuk **Yayasan Pesantren Cipansor** yang mengelola:

- 🏫 **TK Qur'an** - Taman Kanak-kanak berbasis Al-Qur'an
- 📚 **SD IT (Sekolah Dasar Islam Terpadu)**
- 📖 **SMP IT (Sekolah Menengah Pertama Islam Terpadu)**
- 🕌 **SMA Qur'an** dengan fokus tahfidz 30 Juz + Sanad

### Fitur Utama

- ✅ **Multi-unit management** - Kelola semua unit dari satu dashboard yayasan
- ✅ **Role-based access** - Super Admin, Unit Admin, Teacher, Staff, Student, Parent
- ✅ **Tahfidz tracking** - Ziyadah, Murojaah, Tasmi, Penilaian hafalan
- ✅ **Pesantren management** - Asrama, perizinan, pelanggaran, reward points
- ✅ **Financial management** - Pembayaran SPP, tagihan, laporan keuangan
- ✅ **Academic tracking** - Kurikulum, absensi, nilai, raport

---

## 📸 Screenshots

### Halaman Utama (Main Page)

#### Login & Landing Page
![Login Page](docs/screenshots/main/login-page.png)
*Login interface dengan autentikasi multi-role untuk Super Admin, Unit Admin, Teacher, Staff, Student, dan Parent*

![Landing Page](docs/screenshots/main/landing-page.png)
*Halaman utama aplikasi CIPANSOR - Sistem Manajemen Yayasan Pesantren*

### Dashboard

#### Dashboard Super Admin
![Super Admin Dashboard](docs/screenshots/dashboard/super-admin-dashboard.png)
*Dashboard Super Admin dengan overview semua unit pendidikan, statistik siswa, keuangan, dan aktivitas tahfidz*

#### Dashboard Unit Admin
![Unit Admin Dashboard](docs/screenshots/dashboard/unit-admin-dashboard.png)
*Dashboard Unit Admin untuk mengelola unit pendidikan tertentu (SD IT, SMP IT, atau SMA Quran)*

#### Dashboard Teacher
![Teacher Dashboard](docs/screenshots/dashboard/teacher-dashboard.png)
*Dashboard Guru dengan akses ke kelas, absensi, nilai, dan tahfidz tracking*

#### Dashboard Student & Parent
![Student Dashboard](docs/screenshots/dashboard/student-dashboard.png)
*Dashboard Siswa dengan informasi akademik, tahfidz progress, dan pembayaran*

![Parent Portal](docs/screenshots/dashboard/parent-dashboard.png)
*Portal Orang Tua untuk monitoring progress anak, pembayaran, dan komunikasi dengan guru*

### Unit Pendidikan (Education Units)

#### SD IT (Islamic Elementary School)
![SD IT Overview](docs/screenshots/units/sd-it-overview.png)
*Sekolah Dasar Islam Terpadu - Manajemen siswa, kelas, kurikulum, dan tahfidz*

#### SMP IT (Islamic Junior High School)
![SMP IT Overview](docs/screenshots/units/smp-it-overview.png)
*Sekolah Menengah Pertama Islam Terpadu - Akademik dan tahfidz terintegrasi*

#### SMA Quran (Islamic Senior High School)
![SMA Quran Overview](docs/screenshots/units/sma-quran-overview.png)
*SMA Al-Qur'an dengan fokus tahfidz 30 Juz dan Sanad - Program intensif hafalan Quran*

#### TK Quran (Islamic Kindergarten)
![TK Quran Overview](docs/screenshots/units/tk-quran-overview.png)
*Taman Kanak-kanak berbasis Al-Qur'an - Pendidikan usia dini dengan pengenalan Quran*

#### Unit Management
![Unit Management](docs/screenshots/units/unit-management.png)
*Manajemen multi-unit pendidikan dari dashboard yayasan*

### Yayasan (Foundation Management)

#### Yayasan Overview
![Yayasan Overview](docs/screenshots/modules/yayasan-overview.png)
*Dashboard Yayasan Pesantren Cipansor - Kelola semua unit pendidikan dari satu tempat*

#### Board Members Management
![Board Members](docs/screenshots/modules/yayasan-board-members.png)
*Manajemen pengurus yayasan, board members, dan struktur organisasi*

#### Foundation Documents
![Foundation Documents](docs/screenshots/modules/yayasan-documents.png)
*Pengelolaan dokumen legal, akta, dan dokumen penting yayasan*

### Fitur Unggulan (Featured Modules)

#### Tahfidz Tracking System
![Tahfidz Tracking](docs/screenshots/modules/tahfidz-tracking.png)
*Sistem tracking hafalan Quran - Ziyadah (hafalan baru), Murojaah (mengulang), dan Tasmi (setoran)*

![Tahfidz Assessment](docs/screenshots/modules/tahfidz-assessment.png)
*Penilaian tahfidz dengan tracking per-surah dan per-juz, termasuk kualitas bacaan*

#### Finance Management
![Finance Overview](docs/screenshots/modules/finance-overview.png)
*Manajemen keuangan terintegrasi - SPP, uang gedung, seragam, dan pembayaran lainnya*

![Payment Processing](docs/screenshots/modules/finance-payments.png)
*Sistem pembayaran dengan invoice generation, payment tracking, dan laporan keuangan*

#### Academic Management
![Academic Management](docs/screenshots/modules/academic-management.png)
*Manajemen akademik - Tahun ajaran, kelas, mata pelajaran, dan kurikulum*

![Student Management](docs/screenshots/modules/student-management.png)
*Manajemen data siswa lengkap dengan NIS, NISN, dan informasi orang tua*

#### Attendance System
![Attendance System](docs/screenshots/modules/attendance-system.png)
*Sistem absensi harian dengan multiple status: Hadir, Izin, Sakit, Alpa, Terlambat*

#### Class & Schedule Management
![Class Management](docs/screenshots/modules/class-management.png)
*Manajemen kelas dengan wali kelas, jadwal pelajaran, dan student enrollment*

### Pesantren Features

#### Dormitory Management (Asrama)
![Dormitory Management](docs/screenshots/features/dormitory-management.png)
*Manajemen asrama putra dan putri - Kamar, penempatan santri, dan statistik occupancy*

#### Student Permit System (Perizinan)
![Permit System](docs/screenshots/features/permit-system.png)
*Sistem perizinan santri - Pulang, keluar, sakit, dengan approval workflow*

#### Violations & Rewards
![Violations & Rewards](docs/screenshots/features/violations-rewards.png)
*Sistem pelanggaran dan penghargaan dengan point system untuk tracking behavior santri*

### Additional Features

#### PSB (Penerimaan Santri Baru)
![PSB Registration](docs/screenshots/features/psb-registration.png)
*Sistem penerimaan santri baru - Pendaftaran, verifikasi dokumen, test, dan enrollment*

#### Library Management
![Library System](docs/screenshots/features/library-system.png)
*Sistem perpustakaan - Katalog buku, peminjaman, pengembalian, dan denda*

#### Health/UKS Management
![Health UKS](docs/screenshots/features/health-uks.png)
*Unit Kesehatan Sekolah - Rekam medis, inventori obat, dan rujukan*

#### Curriculum Management
![Curriculum Management](docs/screenshots/features/curriculum-management.png)
*Manajemen kurikulum - Mata pelajaran, silabus, RPP, dan lesson plans*

#### Assessment & Report Cards
![Assessment Reports](docs/screenshots/features/assessment-reports.png)
*Sistem penilaian dan rapor - Ujian, nilai, rapor digital dengan Kurikulum Merdeka*

#### Analytics Dashboard
![Analytics Dashboard](docs/screenshots/features/analytics-dashboard.png)
*Dashboard analytics dan statistik - Student trends, finance reports, tahfidz progress*

#### Alumni Management
![Alumni Management](docs/screenshots/features/alumni-management.png)
*Manajemen alumni - Data alumni, career tracking, donations, dan alumni events*

#### HR & Staff Management
![HR Management](docs/screenshots/features/hr-management.png)
*Manajemen SDM - Staff attendance, leave requests, dan payroll*

#### Inventory & Assets
![Inventory Management](docs/screenshots/features/inventory-management.png)
*Manajemen inventaris dan aset - Tracking, maintenance, dan depreciation*

#### Communication & Notifications
![Communication System](docs/screenshots/features/communication-system.png)
*Sistem komunikasi - Announcements, notifications, dan WhatsApp integration*

#### BOS/BOP Reporting
![BOS Reporting](docs/screenshots/features/bos-reporting.png)
*Laporan BOS/BOP sesuai standar Kemenag - 8 standar BOS dengan export Excel/PDF*

#### EMIS Kemenag Integration
![EMIS Integration](docs/screenshots/features/emis-integration.png)
*Integrasi EMIS Kemenag - Export data siswa, guru, dan institusi sesuai format resmi*

#### Document Generator
![Document Generator](docs/screenshots/features/document-generator.png)
*Generator dokumen otomatis - Kartu siswa, sertifikat, surat keterangan*

#### Accreditation Module
![Accreditation](docs/screenshots/features/accreditation.png)
*Modul akreditasi - Self-assessment, document checklist, dan report generation*

> **📝 Note**: Screenshots akan ditambahkan secara bertahap saat aplikasi berjalan. Untuk melihat aplikasi secara langsung, ikuti [Getting Started Guide](#-getting-started).

---

## 🗺 Module Roadmap

### 14 Modul Komprehensif

| # | Modul | Status | Deskripsi |
|---|-------|--------|-----------|
| 1 | **Yayasan Management** | ✅ Phase 3 | Data yayasan, board, dokumen legal |
| 2 | **Pesantren** | ✅ Phase 2 | Asrama, kamar, perizinan, pelanggaran, rewards |
| 3 | **Akademik** | ✅ MVP | Kelas, tahun ajaran, absensi, penilaian |
| 4 | **Takosus (Tahsin/Tahfidz)** | ✅ MVP | Target hafalan, setoran, murojaah, assessment |
| 5 | **SDM** | ✅ Phase 3 | Staff, guru, cuti, absensi pegawai |
| 6 | **Keuangan** | ✅ Phase 2 | Jenis pembayaran, tagihan, pembayaran |
| 7 | **PSB (Penerimaan Santri Baru)** | ✅ Phase 3 | Pendaftaran, seleksi, penerimaan |
| 8 | **Perpustakaan** | ✅ Phase 4 | Katalog, peminjaman, pengembalian |
| 9 | **UKS** | ✅ Phase 4 | Rekam medis, obat, perawatan |
| 10 | **Komunikasi** | ✅ Phase 4 | Notifikasi, pengumuman |
| 11 | **Inventaris** | ✅ Phase 4 | Aset, pemeliharaan |
| 12 | **Kurikulum** | ✅ Phase 5 | Mata pelajaran, jadwal, RPP |
| 13 | **Penilaian** | ✅ Phase 5 | Ujian, nilai, rapor |
| 14 | **Alumni** | ✅ Phase 6 | Data alumni, karir, donasi, event |
| 15 | **Analytics** | ✅ Phase 6 | Dashboard, statistik, laporan |
| 16 | **System & Security** | ✅ MVP | Auth, RBAC, audit log |
| 17 | **EMIS Kemenag** | ✅ Phase 7 | Integrasi data EMIS Kemenag |
| 18 | **BOS/BOP Reporting** | ✅ Phase 7 | Laporan keuangan BOS/BOP |
| 19 | **WhatsApp Integration** | ✅ Phase 7 | Broadcast & notifikasi WA |
| 20 | **Scheduled Notifications** | ✅ Phase 7 | Auto reminder & summary |
| 21 | **Raport Merdeka** | ✅ Phase 7 | Raport Kurikulum Merdeka |
| 22 | **Accreditation** | ✅ Phase 7 | Self-assessment akreditasi |
| 23 | **Parent Portal** | ✅ Phase 7 | Portal monitoring orang tua |
| 24 | **Document Generator** | ✅ Phase 7 | Kartu siswa, surat keterangan |

### Development Phases

```
Phase 1 (MVP) ✅ - COMPLETED
├── Authentication & Authorization
├── User Management (multi-role)
├── Unit/Lembaga Management
├── Academic Year & Classes
├── Student Enrollment
├── Attendance System
└── Tahfidz Records

Phase 2 ✅ - COMPLETED
├── Foundation Model
├── Enhanced Student Model
├── Dormitory Management (Asrama)
│   ├── Dormitories & Rooms
│   └── Room Assignments
├── Pesantren Features
│   ├── Student Permits (Perizinan)
│   ├── Violations (Pelanggaran)
│   └── Rewards (Penghargaan)
├── Finance Module
│   ├── Payment Types
│   ├── Invoices
│   └── Payments
└── Staff Model

Phase 3 ✅ - COMPLETED
├── Foundation/Yayasan Details
│   ├── Foundation CRUD
│   └── Board Members Management
├── PSB (Penerimaan Santri Baru)
│   ├── Admission Periods
│   ├── Registrant Management
│   ├── Document Verification
│   └── Status Workflow & Enrollment
├── HR Module
│   ├── Staff Attendance (check-in/out)
│   ├── Bulk Attendance Recording
│   ├── Leave Requests & Approval
│   └── Monthly Summaries
└── Enhanced Seed Data

Phase 4 ✅ - COMPLETED
├── Library Module
│   ├── Book Categories
│   ├── Book Catalog
│   └── Borrowing Management
├── Health (UKS) Module
│   ├── Medical Records
│   ├── Medication Inventory
│   └── Medication Usage Logs
├── Inventory Module
│   ├── Asset Categories
│   ├── Asset Management
│   └── Maintenance Logs
└── Communication Module
    ├── Announcements
    └── Personal Notifications

Phase 5 ✅ - COMPLETED
├── Curriculum Module
│   ├── Subjects
│   ├── Teacher Assignments
│   ├── Schedules
│   └── Lesson Plans
├── Assessment Module
│   ├── Exams
│   ├── Grades
│   └── Report Cards
└── Enhanced Seed Data

Phase 6 ✅ - COMPLETED
├── Alumni Module
│   ├── Alumni Registration & Data
│   ├── Career History Tracking
│   ├── Education History
│   ├── Donations Management
│   └── Alumni Events
├── Analytics Module
│   ├── Dashboard Overview
│   ├── Student Analytics
│   ├── Tahfidz Analytics
│   ├── Finance Analytics
│   ├── Attendance Analytics
│   ├── Academic Analytics
│   ├── Library Analytics
│   └── PSB Analytics
└── Enhanced Seed Data

Phase 7 ✅ - COMPLETED (Indonesia Compliance)
├── EMIS Kemenag Integration
│   ├── Student Data Export (Format Kemenag)
│   ├── Teacher Data Export (Format Kemenag)
│   ├── Institution Profile Export
│   └── Dapodik Format Support
├── BOS/BOP Financial Reporting
│   ├── BOS Period Management
│   ├── Budget Allocation
│   ├── Realization Tracking
│   ├── 8 Standar BOS Reporting
│   └── Export to Excel/PDF
├── WhatsApp Integration
│   ├── Broadcast Messages
│   ├── Payment Reminders
│   ├── Attendance Notifications
│   └── Academic Updates
├── Scheduled Notifications
│   ├── Payment Due Reminders
│   ├── Daily Attendance Summary
│   ├── Weekly Tahfidz Progress
│   ├── Event Reminders
│   └── Monthly Reports
├── Parent Portal
│   ├── Child Progress Dashboard
│   ├── Payment History
│   ├── Attendance Tracking
│   ├── Tahfidz Progress
│   └── Teacher Communication
├── Raport Merdeka
│   ├── Kurikulum Merdeka Format
│   ├── Capaian Pembelajaran
│   ├── Profil Pelajar Pancasila
│   └── PDF Export
├── Accreditation Module
│   ├── Self-Assessment Forms
│   ├── Document Checklist
│   ├── Progress Tracking
│   └── Report Generation
└── Document Generator
    ├── Student ID Cards
    ├── Certificates
    └── Official Letters

Phase 8 🔜 - FUTURE
├── Mobile App (React Native)
├── Email Integration (SMTP/SendGrid)
├── SMS Gateway Integration
├── Advanced Analytics & BI
└── Multi-tenant Architecture
```

---

## ✨ Features

### Phase 1 - MVP ✅

- **Authentication & Authorization**
  - JWT-based authentication with refresh tokens
  - Role-based access control (RBAC)
  - Password hashing with bcrypt

- **User Management**
  - Multi-role: Super Admin, Unit Admin, Teacher, Staff, Student, Parent
  - Profile management
  - Multi-unit assignment

- **Academic Management**
  - Unit/Lembaga management (TK, SD IT, SMP IT, SMA Al-Qur'an)
  - Academic year management
  - Class management with homeroom teachers
  - Student enrollment

- **Tahfidz Module**
  - Ziyadah (hafalan baru)
  - Murojaah (mengulang hafalan)
  - Tasmi (setoran)
  - Assessment/penilaian
  - Per-surah & per-juz tracking

- **Attendance System**
  - Daily attendance recording
  - Multiple status: Present, Absent, Late, Sick, Excused
  - Class-based attendance

### Phase 2 - Pesantren & Finance ✅

- **Dormitory Management (Asrama)**
  - Dormitory CRUD with capacity tracking
  - Room management per dormitory
  - Student room assignments
  - Occupancy statistics

- **Student Permits (Perizinan)**
  - Multiple permit types: Pulang, Keluar, Sakit, Keluarga
  - Approval workflow
  - Return tracking

- **Violations & Rewards**
  - Violation recording with categories and points
  - Reward system with point accumulation
  - Student behavior tracking
  - Point balance calculation

- **Finance Module**
  - Payment types (SPP, Uang Gedung, Seragam, etc.)
  - Invoice generation with auto-numbering
  - Payment recording with multiple methods
  - Partial payment support
  - Student finance summary
  - Unit-level finance stats

### Phase 3 - Foundation, PSB & HR ✅

- **Foundation/Yayasan Management**
  - Foundation CRUD with board members
  - Board member positions and tenure
  - Document management support

- **PSB (Penerimaan Santri Baru)**
  - Admission periods per unit/academic year
  - Registrant management with full data
  - Document upload and verification
  - Status workflow: REGISTERED → DOCUMENT_CHECK → TEST → ACCEPTED → ENROLLED
  - Score tracking (test, interview, tahfidz)
  - Convert registrant to student

- **HR Module**
  - Staff attendance with check-in/out
  - Bulk attendance recording
  - Monthly attendance summary
  - Leave request workflow (PENDING → APPROVED/REJECTED)
  - Multiple leave types: ANNUAL, SICK, MATERNITY, PATERNITY, MARRIAGE, etc.

### Roadmap

- [x] Yayasan/Foundation complete data management ✅
- [x] PSB (Penerimaan Santri Baru) ✅
- [x] HR Module (Staff Attendance, Leave) ✅
- [x] Library Module ✅
- [x] Health (UKS) Module ✅
- [x] Inventory Module ✅
- [x] Communication Module ✅
- [x] Curriculum Module ✅
- [x] Assessment Module ✅
- [x] Alumni Module ✅
- [x] Analytics Dashboard ✅
- [x] EMIS Kemenag Integration ✅
- [x] BOS/BOP Financial Reporting ✅
- [x] WhatsApp Integration ✅
- [x] Scheduled Notifications ✅
- [x] Parent Portal ✅
- [x] Raport Merdeka ✅
- [x] Accreditation Module ✅
- [x] Document Generator ✅
- [ ] Mobile App (React Native)
- [ ] Email/SMS Gateway
- [ ] Advanced Analytics & BI

### Phase 4 - Library, Health, Inventory, Communication ✅

- **Library Module**
  - Book categories with codes
  - Book catalog with full metadata
  - Borrowing management with due dates
  - Overdue tracking and late fees
  - Status workflow: ACTIVE → RETURNED/OVERDUE

- **Health (UKS) Module**
  - Medical record types: ILLNESS, INJURY, CHECKUP, FIRST_AID, REFERRAL
  - Medication inventory with expiry tracking
  - Medication usage logs per student
  - Referral to external hospitals

- **Inventory Module**
  - Asset categories (Furniture, Electronics, Vehicles, etc.)
  - Asset tracking with codes and conditions
  - Maintenance scheduling and logging
  - Warranty tracking

- **Communication Module**
  - Announcements with priority levels
  - Target audience by roles
  - Personal notifications per user
  - Read/Unread status tracking

### Phase 5 - Curriculum & Assessment ✅

- **Curriculum Module**
  - Subject types: ACADEMIC, RELIGIOUS, TAHFIDZ, EXTRACURRICULAR
  - Subject credits and levels
  - Teacher-Subject assignments per class
  - Weekly schedules with day/time/room
  - Lesson plans with objectives and materials

- **Assessment Module**
  - Exam types: DAILY_TEST, QUIZ, MIDTERM, FINAL, TAHFIDZ_TEST
  - Exam scheduling with duration and max score
  - Grade recording with percentage and letter grades
  - Report cards with subject details
  - Attendance and tahfidz summaries in report cards

### Phase 6 - Alumni & Analytics ✅

- **Alumni Module**
  - Alumni registration with graduation info
  - Career history tracking (multiple careers)
  - Education history tracking (degrees, institutions)
  - Donation management (monetary, goods, service)
  - Alumni events (reunions, seminars, charity)
  - Event attendee registration and tracking
  - Statistics by graduation year and status

- **Analytics Module**
  - Dashboard overview (students, teachers, staff, alumni)
  - Student analytics (enrollment trends, demographics)
  - Tahfidz analytics (activity distribution, top performers)
  - Finance analytics (revenue, payment status, trends)
  - Attendance analytics (rates, trends by class)
  - Academic analytics (grade distribution, subject performance)
  - Library analytics (borrowings, popular books)
  - PSB analytics (admission statistics)

### Phase 7 - Indonesia Compliance & Integration ✅

- **EMIS Kemenag Integration**
  - Student data export (format resmi Kemenag)
  - Teacher data export (format resmi Kemenag)
  - Institution profile export
  - Dapodik format support
  - Automatic field mapping

- **BOS/BOP Financial Reporting**
  - BOS period management per semester
  - Budget allocation by 8 standar BOS
  - Realization tracking with receipts
  - Compliance percentage calculation
  - Export to Excel/PDF format

- **WhatsApp Integration**
  - Broadcast messages to parents/teachers
  - Automatic payment reminders
  - Attendance notifications
  - Academic update broadcasts
  - Template message management

- **Scheduled Notifications**
  - Payment due reminders (3 days before)
  - Daily attendance summary reports
  - Weekly tahfidz progress to parents
  - Upcoming event reminders
  - Monthly report generation

- **Parent Portal**
  - Child progress dashboard
  - Payment history & outstanding
  - Attendance tracking with calendar
  - Tahfidz progress monitoring
  - Direct teacher communication

- **Raport Merdeka**
  - Kurikulum Merdeka format
  - Capaian Pembelajaran (CP) tracking
  - Profil Pelajar Pancasila assessment
  - Intrakurikuler & Projek P5
  - PDF export with official format

- **Accreditation Module**
  - Self-assessment forms (8 Standar)
  - Document checklist management
  - Progress tracking per standar
  - Automatic score calculation
  - Report generation for BAN-S/M

- **Document Generator**
  - Student ID cards with photo
  - Graduation certificates
  - Enrollment letters
  - Active student letters
  - Custom templates

---

## 🛠 Tech Stack

### Backend (`apps/api`)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Express.js** | 5.x | HTTP framework |
| **Prisma** | 5.22.0 | ORM & database toolkit |
| **PostgreSQL** | 14+ | Primary database |
| **Zod** | 3.x | Schema validation |
| **JWT** | - | Authentication |
| **Winston** | 3.x | Logging |
| **ExcelJS** | 4.x | Excel export |
| **PDFKit** | 0.15.x | PDF generation |
| **Vitest** | 3.x | Testing |

### Frontend (`apps/web`)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.6 | React framework |
| **React** | 19.x | UI library |
| **Tailwind CSS** | 4.x | Styling |
| **React Query** | 5.x | Data fetching |
| **Zustand** | 5.x | State management |
| **React Hook Form** | 7.x | Form handling |
| **shadcn/ui** | - | Component library |
| **Recharts** | 2.x | Charts & graphs |
| **Lucide React** | - | Icons |

### Tooling

| Tool | Purpose |
|------|---------|
| **pnpm** | Package manager |
| **Turborepo** | Monorepo build system |
| **ESLint** | Linting |
| **Prettier** | Code formatting |
| **Husky** | Git hooks |
| **GitHub Actions** | CI/CD |

---

## 📁 Project Structure

```
cipansor/
├── apps/
│   ├── api/                    # Express.js Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── seed.ts         # Seed data
│   │   ├── src/
│   │   │   ├── config/         # Configuration
│   │   │   ├── lib/            # Shared libraries
│   │   │   │   ├── prisma.ts   # Prisma client
│   │   │   │   ├── logger.ts   # Winston logger
│   │   │   │   └── jwt.ts      # JWT utilities
│   │   │   ├── middleware/     # Express middlewares
│   │   │   │   ├── auth.ts     # Authentication
│   │   │   │   ├── rbac.ts     # Authorization
│   │   │   │   ├── validate.ts # Request validation
│   │   │   │   └── error.ts    # Error handling
│   │   │   ├── modules/        # Feature modules
│   │   │   │   ├── auth/       # Authentication
│   │   │   │   ├── users/      # User management
│   │   │   │   ├── units/      # Unit/Lembaga
│   │   │   │   ├── students/   # Students
│   │   │   │   ├── classes/    # Classes
│   │   │   │   ├── academic-years/
│   │   │   │   ├── attendance/ # Attendance
│   │   │   │   └── tahfidz/    # Tahfidz records
│   │   │   ├── types/          # TypeScript types
│   │   │   ├── utils/          # Utilities
│   │   │   ├── app.ts          # Express app
│   │   │   └── main.ts         # Entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # Next.js Frontend
│       ├── src/
│       │   ├── app/            # App router pages
│       │   ├── components/     # Shared components
│       │   │   ├── ui/         # Base UI components
│       │   │   ├── layout/     # Layout components
│       │   │   └── forms/      # Form components
│       │   ├── features/       # Feature components
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── students/
│       │   │   └── dashboard/
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # Utilities
│       │   │   ├── api.ts      # API client
│       │   │   └── utils.ts
│       │   └── stores/         # Zustand stores
│       ├── public/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                 # Shared types & utils
│       ├── src/
│       │   ├── types/          # Shared TypeScript types
│       │   └── utils/          # Shared utilities
│       └── package.json
│
├── .env.example                # Environment template
├── .gitignore
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # pnpm workspace config
├── turbo.json                  # Turborepo config
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20 or higher
- **pnpm** 8 or higher
- **PostgreSQL** 14 or higher
- **Git**

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/cipansor.git
cd cipansor

# Install pnpm if not installed
npm install -g pnpm

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Setup database
pnpm db:push      # Push schema to database
pnpm db:seed      # Seed initial data

# Start development
pnpm dev
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cipansor"

# JWT
JWT_SECRET="your-super-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### Access

- **API**: http://localhost:3001
- **Web**: http://localhost:3000
- **API Health**: http://localhost:3001/health

### Test Credentials

After running `pnpm db:seed`, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@cipansor.id | SuperAdmin123! |
| Unit Admin | admin@alhikmah.sch.id | Admin123! |
| Teacher | ahmad@alhikmah.sch.id | Teacher123! |
| Staff | bambang@cipansor.id | Staff123! |
| Student | student1@alhikmah.sch.id | Student123! |

---

## 💻 Development

### Commands

```bash
# Development
pnpm dev              # Start all apps in development
pnpm dev:api          # Start API only
pnpm dev:web          # Start Web only

# Build
pnpm build            # Build all apps
pnpm build:api        # Build API only
pnpm build:web        # Build Web only

# Database
pnpm db:push          # Push Prisma schema
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio

# Testing
pnpm test             # Run all tests
pnpm test:api         # Run API tests
pnpm test:web         # Run Web tests
pnpm test:coverage    # Run with coverage

# Linting
pnpm lint             # Lint all
pnpm lint:fix         # Fix lint issues
pnpm format           # Format with Prettier
```

### Code Style

- **ESLint** untuk linting
- **Prettier** untuk formatting
- **Conventional Commits** untuk commit messages

```bash
# Commit format
feat: add user registration
fix: resolve login issue
docs: update README
chore: update dependencies
```

### Module Structure

Setiap module mengikuti pattern yang konsisten:

```
modules/users/
├── user.controller.ts   # HTTP handlers
├── user.service.ts      # Business logic
├── user.schema.ts       # Zod validation schemas
├── user.routes.ts       # Express routes
└── user.types.ts        # TypeScript types (optional)
```

---

## 📚 API Documentation

### Response Format

Semua response mengikuti format standar:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### Authentication

```bash
# Login
POST /api/auth/login
Content-Type: application/json
{
  "email": "admin@example.com",
  "password": "password123"
}

# Response
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

# Authenticated requests
GET /api/users
Authorization: Bearer <token>
```

### Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| **Auth** |
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/register` | Register (admin only) | Yes |
| POST | `/api/auth/logout` | Logout | Yes |
| GET | `/api/auth/me` | Get current user | Yes |
| **Users** |
| GET | `/api/users` | List users | Yes |
| GET | `/api/users/:id` | Get user | Yes |
| POST | `/api/users` | Create user | Yes (Admin) |
| PUT | `/api/users/:id` | Update user | Yes |
| DELETE | `/api/users/:id` | Delete user | Yes (Admin) |
| **Students** |
| GET | `/api/students` | List students | Yes |
| GET | `/api/students/:id` | Get student | Yes |
| POST | `/api/students` | Create student | Yes (Admin) |
| PUT | `/api/students/:id` | Update student | Yes |
| DELETE | `/api/students/:id` | Delete student | Yes (Admin) |
| **Units** |
| GET | `/api/units` | List units | Yes |
| GET | `/api/units/:id` | Get unit | Yes |
| POST | `/api/units` | Create unit | Yes (SuperAdmin) |
| PUT | `/api/units/:id` | Update unit | Yes (Admin) |
| DELETE | `/api/units/:id` | Delete unit | Yes (SuperAdmin) |
| **Classes** |
| GET | `/api/classes` | List classes | Yes |
| GET | `/api/classes/:id` | Get class | Yes |
| POST | `/api/classes` | Create class | Yes (Admin) |
| PUT | `/api/classes/:id` | Update class | Yes (Admin) |
| DELETE | `/api/classes/:id` | Delete class | Yes (Admin) |
| **Attendance** |
| GET | `/api/attendance` | List attendance | Yes |
| POST | `/api/attendance` | Record attendance | Yes (Teacher+) |
| POST | `/api/attendance/bulk` | Bulk attendance | Yes (Teacher+) |
| **Tahfidz** |
| GET | `/api/tahfidz` | List tahfidz records | Yes |
| POST | `/api/tahfidz` | Record tahfidz | Yes (Teacher+) |
| **Dormitories** |
| GET | `/api/dormitories` | List dormitories | Yes |
| POST | `/api/dormitories` | Create dormitory | Yes (Admin) |
| GET | `/api/dormitories/:id` | Get dormitory | Yes |
| GET | `/api/dormitories/:id/stats` | Get dormitory stats | Yes |
| PUT | `/api/dormitories/:id` | Update dormitory | Yes (Admin) |
| DELETE | `/api/dormitories/:id` | Delete dormitory | Yes (Admin) |
| GET | `/api/dormitories/rooms/list` | List rooms | Yes |
| POST | `/api/dormitories/rooms` | Create room | Yes (Admin) |
| GET | `/api/dormitories/rooms/:id` | Get room | Yes |
| GET | `/api/dormitories/rooms/:id/occupancy` | Get room occupancy | Yes |
| GET | `/api/dormitories/assignments/list` | List assignments | Yes |
| POST | `/api/dormitories/assignments` | Assign student to room | Yes (Admin) |
| **Permits** |
| GET | `/api/permits` | List permits | Yes |
| POST | `/api/permits` | Create permit request | Yes (Teacher+, Parent) |
| GET | `/api/permits/:id` | Get permit | Yes |
| PUT | `/api/permits/:id/status` | Approve/Reject permit | Yes (Admin) |
| PUT | `/api/permits/:id/return` | Mark student returned | Yes (Teacher+) |
| GET | `/api/permits/stats` | Get permit statistics | Yes (Admin) |
| **Violations** |
| GET | `/api/violations` | List violations | Yes (Teacher+) |
| POST | `/api/violations` | Record violation | Yes (Teacher+) |
| GET | `/api/violations/:id` | Get violation | Yes (Teacher+) |
| GET | `/api/violations/student/:studentId/summary` | Get student violations | Yes |
| **Rewards** |
| GET | `/api/rewards` | List rewards | Yes (Teacher+) |
| POST | `/api/rewards` | Give reward | Yes (Teacher+) |
| GET | `/api/rewards/student/:studentId/summary` | Get student rewards | Yes |
| GET | `/api/rewards/student/:studentId/balance` | Get point balance | Yes |
| GET | `/api/rewards/top-students` | Get leaderboard | Yes (Admin) |
| **Finance** |
| GET | `/api/finance/payment-types` | List payment types | Yes (Admin, Staff) |
| POST | `/api/finance/payment-types` | Create payment type | Yes (Admin) |
| GET | `/api/finance/invoices` | List invoices | Yes (Admin, Staff) |
| POST | `/api/finance/invoices` | Create invoice | Yes (Admin, Staff) |
| GET | `/api/finance/invoices/:id` | Get invoice | Yes |
| GET | `/api/finance/payments` | List payments | Yes (Admin, Staff) |
| POST | `/api/finance/payments` | Record payment | Yes (Admin, Staff) |
| GET | `/api/finance/student/:studentId/summary` | Student finance summary | Yes |
| GET | `/api/finance/unit/:unitId/stats` | Unit finance stats | Yes (Admin) |
| **Library** |
| GET | `/api/library/categories` | List book categories | Yes |
| POST | `/api/library/categories` | Create category | Yes (Admin) |
| GET | `/api/library/books` | List books | Yes |
| POST | `/api/library/books` | Create book | Yes (Admin) |
| GET | `/api/library/borrowings` | List borrowings | Yes |
| POST | `/api/library/borrowings` | Create borrowing | Yes |
| PUT | `/api/library/borrowings/:id/return` | Return book | Yes |
| **Health** |
| GET | `/api/health/medications` | List medications | Yes |
| POST | `/api/health/medications` | Create medication | Yes (Admin) |
| GET | `/api/health/medical-records` | List medical records | Yes |
| POST | `/api/health/medical-records` | Create record | Yes (Staff+) |
| POST | `/api/health/medication-usage` | Log medication usage | Yes (Staff+) |
| **Inventory** |
| GET | `/api/inventory/categories` | List asset categories | Yes |
| POST | `/api/inventory/categories` | Create category | Yes (Admin) |
| GET | `/api/inventory/assets` | List assets | Yes |
| POST | `/api/inventory/assets` | Create asset | Yes (Admin) |
| POST | `/api/inventory/assets/:id/maintenance` | Add maintenance log | Yes (Admin) |
| **Notifications** |
| GET | `/api/notifications` | List notifications | Yes |
| GET | `/api/notifications/announcements` | List announcements | Yes |
| POST | `/api/notifications/announcements` | Create announcement | Yes (Admin) |
| PUT | `/api/notifications/:id/read` | Mark as read | Yes |
| **Curriculum** |
| GET | `/api/curriculum/subjects` | List subjects | Yes |
| POST | `/api/curriculum/subjects` | Create subject | Yes (Admin) |
| PUT | `/api/curriculum/subjects/:id` | Update subject | Yes (Admin) |
| GET | `/api/curriculum/schedules` | List schedules | Yes |
| POST | `/api/curriculum/schedules` | Create schedule | Yes (Admin) |
| GET | `/api/curriculum/lesson-plans` | List lesson plans | Yes |
| POST | `/api/curriculum/lesson-plans` | Create lesson plan | Yes (Teacher) |
| GET | `/api/curriculum/teacher-subjects` | List assignments | Yes |
| POST | `/api/curriculum/teacher-subjects` | Assign teacher | Yes (Admin) |
| **Assessment** |
| GET | `/api/assessment/exams` | List exams | Yes |
| POST | `/api/assessment/exams` | Create exam | Yes (Teacher+) |
| PUT | `/api/assessment/exams/:id` | Update exam | Yes (Teacher+) |
| GET | `/api/assessment/grades` | List grades | Yes |
| POST | `/api/assessment/grades` | Submit grade | Yes (Teacher+) |
| POST | `/api/assessment/grades/bulk` | Bulk submit grades | Yes (Teacher+) |
| GET | `/api/assessment/report-cards` | List report cards | Yes |
| POST | `/api/assessment/report-cards/generate` | Generate report card | Yes (Admin) |
| **Alumni** |
| GET | `/api/alumni` | List alumni | Yes |
| POST | `/api/alumni` | Create alumni | Yes (Admin) |
| GET | `/api/alumni/:id` | Get alumni | Yes |
| PUT | `/api/alumni/:id` | Update alumni | Yes (Admin) |
| DELETE | `/api/alumni/:id` | Delete alumni | Yes (Admin) |
| GET | `/api/alumni/stats` | Get alumni statistics | Yes |
| POST | `/api/alumni/convert/:studentId` | Convert student to alumni | Yes (Admin) |
| GET | `/api/alumni/:id/careers` | List alumni careers | Yes |
| POST | `/api/alumni/:id/careers` | Add career | Yes |
| PUT | `/api/alumni/:alumniId/careers/:id` | Update career | Yes |
| DELETE | `/api/alumni/:alumniId/careers/:id` | Delete career | Yes |
| GET | `/api/alumni/:id/education` | List alumni education | Yes |
| POST | `/api/alumni/:id/education` | Add education | Yes |
| PUT | `/api/alumni/:alumniId/education/:id` | Update education | Yes |
| DELETE | `/api/alumni/:alumniId/education/:id` | Delete education | Yes |
| GET | `/api/alumni/donations` | List donations | Yes |
| POST | `/api/alumni/donations` | Create donation | Yes |
| GET | `/api/alumni/events` | List events | Yes |
| POST | `/api/alumni/events` | Create event | Yes (Admin) |
| GET | `/api/alumni/events/:id` | Get event | Yes |
| PUT | `/api/alumni/events/:id` | Update event | Yes (Admin) |
| DELETE | `/api/alumni/events/:id` | Delete event | Yes (Admin) |
| POST | `/api/alumni/events/:id/register` | Register for event | Yes |
| PUT | `/api/alumni/events/:id/attendance` | Update attendance | Yes (Admin) |
| **Analytics** |
| GET | `/api/analytics/dashboard` | Get dashboard overview | Yes (Admin) |
| GET | `/api/analytics/students` | Get student analytics | Yes (Admin) |
| GET | `/api/analytics/tahfidz` | Get tahfidz analytics | Yes (Admin) |
| GET | `/api/analytics/finance` | Get finance analytics | Yes (Admin) |
| GET | `/api/analytics/attendance` | Get attendance analytics | Yes (Admin) |
| GET | `/api/analytics/academic` | Get academic analytics | Yes (Admin) |
| GET | `/api/analytics/library` | Get library analytics | Yes (Admin) |
| GET | `/api/analytics/psb` | Get PSB analytics | Yes (Admin) |
| **EMIS Kemenag** |
| GET | `/api/emis/export/students` | Export students (Kemenag format) | Yes (Admin) |
| GET | `/api/emis/export/teachers` | Export teachers (Kemenag format) | Yes (Admin) |
| GET | `/api/emis/export/institution/:unitId` | Export institution profile | Yes (Admin) |
| GET | `/api/emis/dapodik/students` | Export students (Dapodik format) | Yes (Admin) |
| **BOS/BOP Reporting** |
| GET | `/api/foundation/bos/periods` | List BOS periods | Yes (Admin) |
| POST | `/api/foundation/bos/periods` | Create BOS period | Yes (Admin) |
| GET | `/api/foundation/bos/allocations` | List allocations | Yes (Admin) |
| POST | `/api/foundation/bos/allocations` | Create allocation | Yes (Admin) |
| GET | `/api/foundation/bos/realizations` | List realizations | Yes (Admin) |
| POST | `/api/foundation/bos/realizations` | Create realization | Yes (Admin) |
| GET | `/api/foundation/bos/summary/:periodId` | Get period summary | Yes (Admin) |
| GET | `/api/foundation/bos/export/:periodId` | Export BOS report | Yes (Admin) |
| **WhatsApp Integration** |
| POST | `/api/notifications/whatsapp/broadcast` | Send broadcast message | Yes (Admin) |
| POST | `/api/notifications/whatsapp/payment-reminder` | Send payment reminders | Yes (Admin) |
| POST | `/api/notifications/whatsapp/attendance` | Send attendance report | Yes (Admin) |
| GET | `/api/notifications/whatsapp/templates` | Get message templates | Yes (Admin) |
| **Scheduler** |
| GET | `/api/notifications/scheduler/status` | Get scheduler status | Yes (Admin) |
| POST | `/api/notifications/scheduler/run/:taskName` | Run task manually | Yes (Admin) |
| **Parent Portal** |
| GET | `/api/parent/children` | List linked children | Yes (Parent) |
| GET | `/api/parent/children/:id/dashboard` | Get child dashboard | Yes (Parent) |
| GET | `/api/parent/children/:id/attendance` | Get attendance history | Yes (Parent) |
| GET | `/api/parent/children/:id/tahfidz` | Get tahfidz progress | Yes (Parent) |
| GET | `/api/parent/children/:id/payments` | Get payment history | Yes (Parent) |
| **Raport Merdeka** |
| GET | `/api/reporting/raport-merdeka/students` | List students | Yes (Admin) |
| GET | `/api/reporting/raport-merdeka/:studentId` | Get raport data | Yes (Admin) |
| POST | `/api/reporting/raport-merdeka/generate` | Generate raport PDF | Yes (Admin) |
| **Accreditation** |
| GET | `/api/reporting/accreditation/standards` | List 8 standards | Yes (Admin) |
| GET | `/api/reporting/accreditation/assessments` | List assessments | Yes (Admin) |
| POST | `/api/reporting/accreditation/assessments` | Create assessment | Yes (Admin) |
| PUT | `/api/reporting/accreditation/assessments/:id` | Update assessment | Yes (Admin) |
| GET | `/api/reporting/accreditation/summary` | Get accreditation summary | Yes (Admin) |
| **Document Generator** |
| GET | `/api/students/:id/documents/id-card` | Generate ID card | Yes (Admin) |
| GET | `/api/students/:id/documents/certificate` | Generate certificate | Yes (Admin) |
| POST | `/api/students/:id/documents/letter` | Generate official letter | Yes (Admin) |

---

## 🗄 Database Schema

### Core Entities

```prisma
// User - All user types
model User {
  id           String    @id @default(uuid())
  name         String
  email        String    @unique
  passwordHash String    @map("password_hash")
  role         UserRole
  unitId       String?   @map("unit_id")
  unit         Unit?     @relation(fields: [unitId], references: [id])
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")
  
  student      Student?
  tahfidzRecords TahfidzRecord[]
  
  @@map("users")
}

// Unit - Pesantren/Sekolah
model Unit {
  id        String    @id @default(uuid())
  name      String
  type      UnitType
  address   String
  phone     String?
  email     String?
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")
  
  users     User[]
  students  Student[]
  classes   Class[]
  
  @@map("units")
}

// Student - Santri/Siswa
model Student {
  id          String    @id @default(uuid())
  userId      String    @unique @map("user_id")
  user        User      @relation(fields: [userId], references: [id])
  unitId      String    @map("unit_id")
  unit        Unit      @relation(fields: [unitId], references: [id])
  nis         String    @unique
  nisn        String?
  gender      Gender
  birthPlace  String    @map("birth_place")
  birthDate   DateTime  @map("birth_date")
  address     String
  parentName  String    @map("parent_name")
  parentPhone String    @map("parent_phone")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  
  classEnrollments ClassEnrollment[]
  attendances      Attendance[]
  tahfidzRecords   TahfidzRecord[]
  
  @@map("students")
}

// Class - Kelas
model Class {
  id              String       @id @default(uuid())
  unitId          String       @map("unit_id")
  unit            Unit         @relation(fields: [unitId], references: [id])
  academicYearId  String       @map("academic_year_id")
  academicYear    AcademicYear @relation(fields: [academicYearId], references: [id])
  name            String
  level           Int
  homeroomTeacherId String?    @map("homeroom_teacher_id")
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")
  deletedAt       DateTime?    @map("deleted_at")
  
  enrollments     ClassEnrollment[]
  attendances     Attendance[]
  
  @@map("classes")
}

// AcademicYear - Tahun Ajaran
model AcademicYear {
  id        String    @id @default(uuid())
  name      String
  semester  Semester
  isActive  Boolean   @default(false) @map("is_active")
  startDate DateTime  @map("start_date")
  endDate   DateTime  @map("end_date")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")
  
  classes   Class[]
  
  @@map("academic_years")
}
```

### Enums

```prisma
enum UserRole {
  SUPER_ADMIN
  UNIT_ADMIN
  TEACHER
  STUDENT
  PARENT
}

enum UnitType {
  PESANTREN
  PAUD
  SD_IT
  SMP_IT
  SMA_QURAN
  OTHER
}

enum Gender {
  MALE
  FEMALE
}

enum Semester {
  ODD   // Ganjil
  EVEN  // Genap
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  SICK
  PERMISSION
}
```

---

## 🚢 Deployment

### Backend (API)

```bash
# Build
pnpm build:api

# Start production
NODE_ENV=production pnpm start:api
```

Recommended platforms: **Railway**, **Render**, **DigitalOcean App Platform**

### Frontend (Web)

```bash
# Build
pnpm build:web

# Start production
pnpm start:web
```

Recommended platforms: **Vercel**, **Netlify**

### Database

Recommended: **Neon**, **Supabase**, **Railway PostgreSQL**, **AWS RDS**

### Environment

Pastikan environment variables sudah dikonfigurasi di platform deployment:

```
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
NODE_ENV=production
NEXT_PUBLIC_API_URL
```

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Guidelines

- Follow existing code style
- Write tests for new features
- Update documentation as needed
- Use conventional commits

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Kementerian Agama RI](https://kemenag.go.id/) - Format EMIS
- [Kementerian Pendidikan RI](https://kemdikbud.go.id/) - Kurikulum Merdeka
- [BAN-S/M](https://bansm.kemdikbud.go.id/) - Standar Akreditasi
- [5 Pilar Manajemen Pesantren](https://epesantren.co.id/)
- [Express.js](https://expressjs.com/)
- [Prisma](https://www.prisma.io/)
- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)

---

## 📞 Support

Untuk pertanyaan dan dukungan:
- 📧 Email: support@cipansor.id
- 📱 WhatsApp: +62 xxx-xxxx-xxxx
- 🌐 Website: https://cipansor.id

---

**Made with ❤️ for Islamic Education Institutions in Indonesia**

*Sistem ini dikembangkan sesuai dengan standar dan regulasi pendidikan Indonesia termasuk format EMIS Kemenag, Kurikulum Merdeka, dan standar BOS/BOP.*
