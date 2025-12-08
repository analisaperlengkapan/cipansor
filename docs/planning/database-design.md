# Database Design Document - Cipansor Enhancement

**Versi:** 1.0.0
**Tanggal:** 5 Desember 2025
**Status:** Draft
**Referensi Dokumen:** requirements.md

---

## Daftar Isi

1. [Overview](#1-overview)
2. [New Enums](#2-new-enums)
3. [PAUD Enhancement Models](#3-paud-enhancement-models)
4. [Daily Report Models](#4-daily-report-models)
5. [Tahfidz Enhancement Models](#5-tahfidz-enhancement-models)
6. [Dashboard & Analytics Models](#6-dashboard--analytics-models)
7. [Enhanced Existing Models](#7-enhanced-existing-models)
8. [Relationships Summary](#8-relationships-summary)
9. [Migration Strategy](#9-migration-strategy)

---

## 1. Overview

**Refs:** [Req 1.1], [Req 1.4], [Req 2.1], [Req 2.2]

### 1.1 Database Type
- **Database:** PostgreSQL (existing)
- **ORM:** Prisma 5.x (existing)
- **Strategy:** Enhancement - adding new models and fields to existing schema

### 1.2 Design Principles
1. **Non-Breaking Changes** - All changes backward compatible
2. **Normalization** - 3NF where appropriate
3. **Soft Delete** - Using `deletedAt` for all main entities
4. **Audit Trail** - `createdAt`, `updatedAt` on all models
5. **UUID Primary Keys** - Consistent with existing schema
6. **Naming Convention** - snake_case for DB, camelCase for Prisma

### 1.3 Schema Enhancement Summary

| Category | New Models | Enhanced Models | New Enums |
|----------|------------|-----------------|-----------|
| PAUD Assessment | 3 | 0 | 3 |
| Daily Report | 2 | 0 | 2 |
| Tahfidz Enhancement | 3 | 2 | 2 |
| Dashboard | 2 | 0 | 1 |
| **Total** | **10** | **2** | **8** |

---

## 2. New Enums

**Refs:** [Req 4.1], [Req 4.3], [Req 7.1.2]

### 2.1 PAUD Development Aspect
```prisma
/// 6 Aspek Perkembangan Anak (Permendikbud 137/2014)
enum PAUDAspect {
  NAM   // Nilai Agama & Moral
  FM    // Fisik Motorik
  KOG   // Kognitif
  BHS   // Bahasa
  SE    // Sosial Emosional
  SNI   // Seni
}
```

### 2.2 PAUD Achievement Level
```prisma
/// Capaian Perkembangan PAUD
enum PAUDAchievementLevel {
  BB    // Belum Berkembang
  MB    // Mulai Berkembang
  BSH   // Berkembang Sesuai Harapan
  BSB   // Berkembang Sangat Baik
}
```

### 2.3 Daily Report Mood
```prisma
/// Mood indicator for daily report
enum DailyMood {
  HAPPY       // 😊 Senang
  NEUTRAL     // 😐 Biasa
  SAD         // 😢 Sedih
  TIRED       // 😴 Lelah
  EXCITED     // 🤩 Antusias
  SICK        // 🤒 Sakit
}
```

### 2.4 Meal Consumption Status
```prisma
/// Status konsumsi makan/snack
enum MealConsumption {
  HABIS       // Dimakan habis
  SETENGAH    // Dimakan setengah
  SEDIKIT     // Dimakan sedikit
  TIDAK_MAU   // Tidak mau makan
}
```

### 2.5 Murojaah Type
```prisma
/// Jenis murojaah hafalan
enum MurojaahType {
  YAUMIYAH    // Harian - 1-3 juz terakhir
  USBUIYAH    // Mingguan - 5 juz terakhir  
  SYAHRIYAH   // Bulanan - Seluruh hafalan
  TASMI       // Random testing
}
```

### 2.6 Tahfidz Mistake Type
```prisma
/// Jenis kesalahan dalam hafalan
enum TahfidzMistakeType {
  LAHIN_JALI    // Kesalahan jelas (salah huruf/harakat)
  LAHIN_KHAFI   // Kesalahan tersembunyi (mad, ghunnah)
  TAJWID        // Kesalahan tajwid
  LUPA          // Lupa ayat
  URUTAN        // Salah urutan ayat
}
```

### 2.7 Simaan Type
```prisma
/// Jenis simaan/ujian hafalan
enum SimaanType {
  BIN_NAZHR     // Dengan melihat mushaf
  BIL_GHAIB     // Tanpa melihat (hafalan)
  TAHDIR        // Persiapan (juz dipilih)
  TASMI         // Random testing
  KHATAM        // Ujian khatam 30 juz
}
```

### 2.8 Report Period Type
```prisma
/// Periode laporan PAUD
enum PAUDReportPeriod {
  HARIAN        // Daily
  MINGGUAN      // Weekly
  BULANAN       // Monthly
  SEMESTER      // Semester (Raport)
}
```

---

## 3. PAUD Enhancement Models

**Refs:** [Req 4.1], [Req 4.2], [Req 4.4]

### 3.1 PAUDDevelopmentIndicator
**Refs:** [Req 4.1.1]

Model untuk menyimpan indikator perkembangan per aspek.

```prisma
/// Master data indikator perkembangan PAUD per aspek
model PAUDDevelopmentIndicator {
  id          String      @id @default(uuid())
  aspect      PAUDAspect  // Aspek perkembangan
  code        String      @unique // e.g., "NAM-01", "FM-02"
  name        String      // Nama indikator
  description String?     @db.Text
  ageGroupMin Int         @map("age_group_min") // Usia minimal (bulan)
  ageGroupMax Int         @map("age_group_max") // Usia maksimal (bulan)
  orderNumber Int         @map("order_number")
  isActive    Boolean     @default(true) @map("is_active")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  // Relations
  assessments PAUDDevelopmentAssessment[]

  @@index([aspect])
  @@index([ageGroupMin, ageGroupMax])
  @@map("paud_development_indicators")
}
```

### 3.2 PAUDDevelopmentAssessment
**Refs:** [Req 4.1.1], [Req 4.1.2], [Req 4.1.3]

Model utama untuk mencatat perkembangan anak per aspek.

```prisma
/// Catatan perkembangan anak PAUD per aspek per periode
model PAUDDevelopmentAssessment {
  id              String                @id @default(uuid())
  studentId       String                @map("student_id")
  academicYearId  String                @map("academic_year_id")
  semesterId      String?               @map("semester_id")
  periodType      PAUDReportPeriod      @map("period_type")
  periodDate      DateTime              @map("period_date") @db.Date
  aspect          PAUDAspect
  indicatorId     String?               @map("indicator_id")
  achievementLevel PAUDAchievementLevel @map("achievement_level")
  narrativeText   String?               @map("narrative_text") @db.Text
  teacherNotes    String?               @map("teacher_notes") @db.Text
  recommendations String?               @db.Text
  assessedById    String                @map("assessed_by_id")
  createdAt       DateTime              @default(now()) @map("created_at")
  updatedAt       DateTime              @updatedAt @map("updated_at")

  // Relations
  student      Student                    @relation(fields: [studentId], references: [id], onDelete: Cascade)
  academicYear AcademicYear               @relation(fields: [academicYearId], references: [id])
  semester     Semester?                  @relation(fields: [semesterId], references: [id])
  indicator    PAUDDevelopmentIndicator?  @relation(fields: [indicatorId], references: [id])
  evidences    PAUDAssessmentEvidence[]

  @@index([studentId])
  @@index([academicYearId])
  @@index([aspect])
  @@index([periodDate])
  @@map("paud_development_assessments")
}
```

### 3.3 PAUDAssessmentEvidence
**Refs:** [Req 4.1.1] - evidence_urls[], [Req 4.4]

Model untuk menyimpan bukti/dokumentasi assessment.

```prisma
/// Bukti/evidence perkembangan (foto, video, dokumen)
model PAUDAssessmentEvidence {
  id           String   @id @default(uuid())
  assessmentId String   @map("assessment_id")
  fileUrl      String   @map("file_url")
  fileType     String   @map("file_type") // image, video, document
  fileName     String?  @map("file_name")
  caption      String?
  uploadedAt   DateTime @default(now()) @map("uploaded_at")

  // Relations
  assessment PAUDDevelopmentAssessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)

  @@index([assessmentId])
  @@map("paud_assessment_evidences")
}
```

### 3.4 PAUDNarrativeReport (Raport Narasi)
**Refs:** [Req 4.2]

Model untuk raport narasi PAUD per semester.

```prisma
/// Raport narasi PAUD (format deskriptif per semester)
model PAUDNarrativeReport {
  id                    String    @id @default(uuid())
  studentId             String    @map("student_id")
  academicYearId        String    @map("academic_year_id")
  semesterId            String    @map("semester_id")
  
  // Narrative per aspect
  narrativeNAM          String?   @map("narrative_nam") @db.Text
  narrativeFM           String?   @map("narrative_fm") @db.Text
  narrativeKOG          String?   @map("narrative_kog") @db.Text
  narrativeBHS          String?   @map("narrative_bhs") @db.Text
  narrativeSE           String?   @map("narrative_se") @db.Text
  narrativeSNI          String?   @map("narrative_sni") @db.Text
  
  // Summary
  overallStrengths      String?   @map("overall_strengths") @db.Text
  areasForDevelopment   String?   @map("areas_for_development") @db.Text
  parentRecommendations String?   @map("parent_recommendations") @db.Text
  teacherSignature      String?   @map("teacher_signature")
  principalSignature    String?   @map("principal_signature")
  
  // Status
  status                String    @default("DRAFT") // DRAFT, FINALIZED, PRINTED
  finalizedAt           DateTime? @map("finalized_at")
  printedAt             DateTime? @map("printed_at")
  
  // Attendance summary
  totalDays             Int       @default(0) @map("total_days")
  presentDays           Int       @default(0) @map("present_days")
  sickDays              Int       @default(0) @map("sick_days")
  excusedDays           Int       @default(0) @map("excused_days")
  
  createdById           String    @map("created_by_id")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")

  // Relations
  student      Student      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  academicYear AcademicYear @relation(fields: [academicYearId], references: [id])
  semester     Semester     @relation(fields: [semesterId], references: [id])
  photos       PAUDReportPhoto[]

  @@unique([studentId, academicYearId, semesterId])
  @@index([studentId])
  @@index([academicYearId])
  @@map("paud_narrative_reports")
}
```

### 3.5 PAUDReportPhoto
**Refs:** [Req 4.2.1] - Foto dokumentasi kegiatan semester

```prisma
/// Foto dokumentasi untuk raport PAUD
model PAUDReportPhoto {
  id          String   @id @default(uuid())
  reportId    String   @map("report_id")
  photoUrl    String   @map("photo_url")
  caption     String?
  orderNumber Int      @default(0) @map("order_number")
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  report PAUDNarrativeReport @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@index([reportId])
  @@map("paud_report_photos")
}
```

---

## 4. Daily Report Models

**Refs:** [Req 4.3], [Req 5.3]

### 4.1 DailyStudentReport
**Refs:** [Req 4.3.1], [Req 4.3.2], [Req 5.3]

Model untuk laporan harian ke orang tua (PAUD/TK & SD IT).

```prisma
/// Laporan harian siswa untuk orang tua
model DailyStudentReport {
  id              String          @id @default(uuid())
  studentId       String          @map("student_id")
  reportDate      DateTime        @map("report_date") @db.Date
  unitType        UnitType        @map("unit_type") // PAUD, TK, SD_IT
  
  // Check-in (Guru input saat datang)
  arrivalTime     DateTime?       @map("arrival_time")
  mood            DailyMood?
  healthStatus    String?         @map("health_status") // Sehat, Demam, Flu, dll
  temperature     Float?          // Suhu badan (opsional)
  hadBreakfast    Boolean?        @map("had_breakfast")
  
  // Activities (PAUD specific)
  mealStatus      MealConsumption? @map("meal_status")
  snackStatus     MealConsumption? @map("snack_status")
  napDuration     Int?            @map("nap_duration") // dalam menit
  toiletNotes     String?         @map("toilet_notes") @db.Text
  
  // Activities (SD IT specific)  
  sholatDhuha     Boolean?        @map("sholat_dhuha")
  tahfidzActivity String?         @map("tahfidz_activity") // Surah/ayat yang disetorkan
  
  // General activity log
  activitiesSummary String?       @map("activities_summary") @db.Text
  achievements    String?         @db.Text
  behaviorNotes   String?         @map("behavior_notes") @db.Text
  teacherNotes    String?         @map("teacher_notes") @db.Text
  homeActivity    String?         @map("home_activity") @db.Text // Aktivitas di rumah
  
  // Departure
  departureTime   DateTime?       @map("departure_time")
  pickedUpBy      String?         @map("picked_up_by")
  
  // Notification
  notifiedAt      DateTime?       @map("notified_at")
  notifiedVia     String?         @map("notified_via") // whatsapp, push, email
  parentReadAt    DateTime?       @map("parent_read_at")
  
  createdById     String          @map("created_by_id")
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  // Relations
  student  Student              @relation(fields: [studentId], references: [id], onDelete: Cascade)
  photos   DailyReportPhoto[]
  homework DailyHomework[]

  @@unique([studentId, reportDate])
  @@index([studentId])
  @@index([reportDate])
  @@index([unitType])
  @@map("daily_student_reports")
}
```

### 4.2 DailyReportPhoto
**Refs:** [Req 4.3.2] - photos[]

```prisma
/// Foto kegiatan harian untuk daily report
model DailyReportPhoto {
  id          String   @id @default(uuid())
  reportId    String   @map("report_id")
  photoUrl    String   @map("photo_url")
  caption     String?
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  report DailyStudentReport @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@index([reportId])
  @@map("daily_report_photos")
}
```

### 4.3 DailyHomework
**Refs:** [Req 5.3.2] - homework[]

```prisma
/// PR/tugas yang diberikan hari ini (untuk SD IT)
model DailyHomework {
  id          String   @id @default(uuid())
  reportId    String   @map("report_id")
  subjectName String   @map("subject_name")
  description String   @db.Text
  dueDate     DateTime? @map("due_date") @db.Date
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  report DailyStudentReport @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@index([reportId])
  @@map("daily_homework")
}
```

---

## 5. Tahfidz Enhancement Models

**Refs:** [Req 7.1], [Req 7.2]

### 5.1 MurojaahRecord (Detail Tracking)
**Refs:** [Req 7.1.2]

Model untuk tracking murojaah dengan detail lebih lengkap.

```prisma
/// Detail tracking murojaah hafalan
model MurojaahRecord {
  id              String          @id @default(uuid())
  studentId       String          @map("student_id")
  enrollmentId    String?         @map("enrollment_id") // TakhosusEnrollment
  halaqohId       String?         @map("halaqoh_id")
  recordedById    String          @map("recorded_by_id")
  
  // Murojaah Info
  murojaahType    MurojaahType    @map("murojaah_type")
  murojaahDate    DateTime        @map("murojaah_date") @db.Date
  juzStart        Int             @map("juz_start")
  juzEnd          Int             @map("juz_end")
  pagesReviewed   Int             @map("pages_reviewed")
  durationMinutes Int             @map("duration_minutes")
  
  // Quality Assessment
  qualityScore    Int             @map("quality_score") // 1-100
  mistakeCount    Int             @default(0) @map("mistake_count")
  fluencyLevel    Int             @default(0) @map("fluency_level") // 1-5
  tajwidScore     Int?            @map("tajwid_score") // 1-100
  
  // Notes
  notes           String?         @db.Text
  improvementAreas String?        @map("improvement_areas") @db.Text
  
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  // Relations
  student     Student               @relation(fields: [studentId], references: [id], onDelete: Cascade)
  enrollment  TakhosusEnrollment?   @relation(fields: [enrollmentId], references: [id])
  halaqoh     Halaqoh?              @relation(fields: [halaqohId], references: [id])
  mistakes    MurojaahMistake[]

  @@index([studentId])
  @@index([murojaahDate])
  @@index([murojaahType])
  @@map("murojaah_records")
}
```

### 5.2 MurojaahMistake
**Refs:** [Req 7.1.2] - mistake_types[]

```prisma
/// Detail kesalahan saat murojaah
model MurojaahMistake {
  id            String              @id @default(uuid())
  murojaahId    String              @map("murojaah_id")
  mistakeType   TahfidzMistakeType  @map("mistake_type")
  juz           Int
  surahNumber   Int                 @map("surah_number")
  ayahNumber    Int?                @map("ayah_number")
  description   String?             @db.Text
  createdAt     DateTime            @default(now()) @map("created_at")

  // Relations
  murojaah MurojaahRecord @relation(fields: [murojaahId], references: [id], onDelete: Cascade)

  @@index([murojaahId])
  @@map("murojaah_mistakes")
}
```

### 5.3 SimaanExam (Ujian Komprehensif)
**Refs:** [Req 7.1.3]

```prisma
/// Simaan/Ujian hafalan komprehensif
model SimaanExam {
  id              String      @id @default(uuid())
  studentId       String      @map("student_id")
  enrollmentId    String?     @map("enrollment_id")
  
  // Exam Info
  simaanType      SimaanType  @map("simaan_type")
  examDate        DateTime    @map("exam_date")
  sessionNumber   Int         @default(1) @map("session_number") // Untuk multi-sesi
  totalSessions   Int         @default(1) @map("total_sessions")
  
  // Content
  juzStart        Int         @map("juz_start")
  juzEnd          Int         @map("juz_end")
  
  // Scoring
  overallScore    Float?      @map("overall_score") // 0-100
  tajwidScore     Float?      @map("tajwid_score")
  fashohaScore    Float?      @map("fashoha_score") // Kelancaran
  tartilScore     Float?      @map("tartil_score")
  
  // Grading
  grade           String?     // Mumtaz, Jayyid Jiddan, Jayyid, Maqbul, Rasib
  passed          Boolean     @default(false)
  
  // Examiners (Panel Penguji)
  notes           String?     @db.Text
  recommendations String?     @db.Text
  
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  // Relations
  student     Student               @relation(fields: [studentId], references: [id], onDelete: Cascade)
  enrollment  TakhosusEnrollment?   @relation(fields: [enrollmentId], references: [id])
  examiners   SimaanExaminer[]

  @@index([studentId])
  @@index([examDate])
  @@index([simaanType])
  @@map("simaan_exams")
}
```

### 5.4 SimaanExaminer
**Refs:** [Req 7.1.3] - Panel penguji

```prisma
/// Penguji/examiner untuk simaan
model SimaanExaminer {
  id          String   @id @default(uuid())
  simaanId    String   @map("simaan_id")
  examinerId  String   @map("examiner_id") // User ID (Muhafidz)
  score       Float?
  notes       String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  simaan SimaanExam @relation(fields: [simaanId], references: [id], onDelete: Cascade)

  @@index([simaanId])
  @@map("simaan_examiners")
}
```

### 5.5 Enhanced SanadRecord Fields
**Refs:** [Req 7.2]

Tambahan field untuk existing SanadRecord model:

```prisma
// Add to existing SanadRecord model:
model SanadRecord {
  // ... existing fields ...
  
  // NEW: Enhanced Sanad Fields
  riwayat             String?   // HAFS, WARSH, QALUN, etc.
  teacherSanadNumber  String?   @map("teacher_sanad_number")
  chainDocumentUrl    String?   @map("chain_document_url") // Silsilah sanad
  certificateUrl      String?   @map("certificate_url") // Generated certificate
  certificateNumber   String?   @unique @map("certificate_number")
  verificationCode    String?   @unique @map("verification_code") // QR verification
  publicVerificationUrl String? @map("public_verification_url")
  issuedAt            DateTime? @map("issued_at")
  
  // Ijazah Type
  ijazahType          String?   @map("ijazah_type") // TAHFIDZ, SANAD, QIRAAT
}
```

---

## 6. Dashboard & Analytics Models

**Refs:** [Req 9.1]

### 6.1 DashboardMetricSnapshot
**Refs:** [Req 9.1.1]

Model untuk menyimpan snapshot metrik dashboard (untuk performa).

```prisma
/// Snapshot metrik dashboard untuk caching
model DashboardMetricSnapshot {
  id              String    @id @default(uuid())
  unitId          String?   @map("unit_id") // null = all units (yayasan level)
  metricType      String    @map("metric_type") // STUDENT_COUNT, ATTENDANCE_RATE, etc.
  metricValue     Float     @map("metric_value")
  metricData      Json?     @map("metric_data") // Additional data as JSON
  periodType      String    @map("period_type") // DAILY, WEEKLY, MONTHLY
  periodDate      DateTime  @map("period_date") @db.Date
  calculatedAt    DateTime  @default(now()) @map("calculated_at")

  @@unique([unitId, metricType, periodType, periodDate])
  @@index([unitId])
  @@index([metricType])
  @@index([periodDate])
  @@map("dashboard_metric_snapshots")
}
```

### 6.2 UnitComparisonReport
**Refs:** [Req 9.1.2]

```prisma
/// Perbandingan performa antar unit
model UnitComparisonReport {
  id              String    @id @default(uuid())
  reportType      String    @map("report_type") // ACADEMIC, TAHFIDZ, ATTENDANCE, FINANCE
  periodType      String    @map("period_type") // WEEKLY, MONTHLY, SEMESTER
  periodStart     DateTime  @map("period_start") @db.Date
  periodEnd       DateTime  @map("period_end") @db.Date
  reportData      Json      @map("report_data") // Comparative data per unit
  generatedAt     DateTime  @default(now()) @map("generated_at")
  generatedById   String?   @map("generated_by_id")

  @@index([reportType])
  @@index([periodStart, periodEnd])
  @@map("unit_comparison_reports")
}
```

---

## 7. Enhanced Existing Models

**Refs:** [Req 3.2], [Req 4.5]

### 7.1 Student Model Enhancement
**Refs:** [Req 4.5.1], [Req 4.5.2]

Tambahan field untuk existing Student model:

```prisma
// Add to existing Student model:
model Student {
  // ... existing fields ...
  
  // NEW: Growth Tracking Fields (PAUD)
  birthWeight         Float?    @map("birth_weight") // Berat lahir (kg)
  birthHeight         Float?    @map("birth_height") // Panjang lahir (cm)
  birthHeadCircumference Float? @map("birth_head_circumference") // Lingkar kepala lahir
  
  // NEW: Immunization tracking via relation
  
  // NEW Relations
  paudAssessments     PAUDDevelopmentAssessment[]
  paudReports         PAUDNarrativeReport[]
  dailyReports        DailyStudentReport[]
  murojaahRecords     MurojaahRecord[]
  simaanExams         SimaanExam[]
}
```

### 7.2 GrowthRecord Model (New)
**Refs:** [Req 4.5.1]

```prisma
/// Catatan tumbuh kembang siswa (terutama PAUD)
model GrowthRecord {
  id                String    @id @default(uuid())
  studentId         String    @map("student_id")
  recordDate        DateTime  @map("record_date") @db.Date
  
  // Measurements
  weight            Float?    // Berat badan (kg)
  height            Float?    // Tinggi badan (cm)
  headCircumference Float?    @map("head_circumference") // Lingkar kepala (cm)
  
  // Calculated Fields (stored for historical)
  ageMonths         Int       @map("age_months") // Usia saat pengukuran
  weightZScore      Float?    @map("weight_z_score") // Z-Score BB/U
  heightZScore      Float?    @map("height_z_score") // Z-Score TB/U
  bmiZScore         Float?    @map("bmi_z_score") // Z-Score BMI
  
  // Status
  nutritionStatus   String?   @map("nutrition_status") // Normal, Kurus, Gemuk, Stunting
  notes             String?   @db.Text
  
  recordedById      String    @map("recorded_by_id")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  // Relations
  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@index([recordDate])
  @@map("growth_records")
}
```

### 7.3 ImmunizationRecord Model (New)
**Refs:** [Req 4.5.2]

```prisma
/// Catatan imunisasi siswa
model ImmunizationRecord {
  id              String    @id @default(uuid())
  studentId       String    @map("student_id")
  vaccineName     String    @map("vaccine_name") // BCG, Polio, DPT, MR, dll
  vaccineCode     String?   @map("vaccine_code")
  doseNumber      Int       @map("dose_number") // Dosis ke-
  scheduledDate   DateTime? @map("scheduled_date") @db.Date
  administeredDate DateTime? @map("administered_date") @db.Date
  administeredAt  String?   @map("administered_at") // Lokasi/tempat
  batchNumber     String?   @map("batch_number")
  notes           String?   @db.Text
  status          String    @default("PENDING") // PENDING, COMPLETED, SKIPPED
  
  recordedById    String?   @map("recorded_by_id")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([studentId, vaccineName, doseNumber])
  @@index([studentId])
  @@index([status])
  @@map("immunization_records")
}
```

---

## 8. Relationships Summary

**Refs:** All sections above

### 8.1 New Relations to Existing Models

| From Model | To Model | Relation Type | Field |
|------------|----------|---------------|-------|
| Student | PAUDDevelopmentAssessment | 1:N | paudAssessments |
| Student | PAUDNarrativeReport | 1:N | paudReports |
| Student | DailyStudentReport | 1:N | dailyReports |
| Student | MurojaahRecord | 1:N | murojaahRecords |
| Student | SimaanExam | 1:N | simaanExams |
| Student | GrowthRecord | 1:N | growthRecords |
| Student | ImmunizationRecord | 1:N | immunizationRecords |
| AcademicYear | PAUDDevelopmentAssessment | 1:N | paudAssessments |
| AcademicYear | PAUDNarrativeReport | 1:N | paudNarrativeReports |
| Semester | PAUDDevelopmentAssessment | 1:N | paudAssessments |
| Semester | PAUDNarrativeReport | 1:N | paudNarrativeReports |
| TakhosusEnrollment | MurojaahRecord | 1:N | murojaahRecords |
| TakhosusEnrollment | SimaanExam | 1:N | simaanExams |
| Halaqoh | MurojaahRecord | 1:N | murojaahRecords |

### 8.2 ERD Summary (Text)

```
┌─────────────────────┐
│     Student         │
└──────────┬──────────┘
           │
    ┌──────┴──────┬──────────────┬──────────────┬──────────────┐
    │             │              │              │              │
    ▼             ▼              ▼              ▼              ▼
┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  PAUD   │ │  Daily   │ │ Murojaah │ │  Simaan  │ │  Growth  │
│Assessment│ │  Report  │ │  Record  │ │   Exam   │ │  Record  │
└────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────┘
     │           │            │            │
     ▼           ▼            ▼            ▼
┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Evidence │ │  Photo   │ │ Mistake  │ │ Examiner │
│         │ │ Homework │ │          │ │          │
└─────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## 9. Migration Strategy

**Refs:** [Req 11.4]

### 9.1 Migration Order

| Order | Migration Name | Description | Estimated Time |
|-------|---------------|-------------|----------------|
| 1 | add_paud_enums | Add new enums | 1 min |
| 2 | add_paud_indicators | PAUDDevelopmentIndicator table | 2 min |
| 3 | add_paud_assessment | PAUDDevelopmentAssessment + Evidence | 3 min |
| 4 | add_paud_reports | PAUDNarrativeReport + Photos | 3 min |
| 5 | add_daily_reports | DailyStudentReport + related | 3 min |
| 6 | add_murojaah | MurojaahRecord + Mistake | 3 min |
| 7 | add_simaan | SimaanExam + Examiner | 3 min |
| 8 | add_growth_health | GrowthRecord + ImmunizationRecord | 3 min |
| 9 | add_dashboard_metrics | Dashboard snapshot tables | 2 min |
| 10 | enhance_sanad | Add fields to SanadRecord | 2 min |
| 11 | enhance_student | Add fields to Student | 2 min |

### 9.2 Rollback Strategy

Setiap migration memiliki rollback:
- New tables: DROP TABLE
- New columns: ALTER TABLE DROP COLUMN
- New enums: DROP TYPE (PostgreSQL)

### 9.3 Seed Data Required

| Table | Seed Data |
|-------|-----------|
| PAUDDevelopmentIndicator | 6 aspek × ~10 indikator = ~60 records |
| ImmunizationRecord (reference) | Standard vaccination schedule |

### 9.4 Data Validation Rules

| Field | Validation |
|-------|------------|
| PAUDAchievementLevel | Must be BB, MB, BSH, or BSB |
| GrowthRecord.weight | 0 < weight < 200 (kg) |
| GrowthRecord.height | 0 < height < 250 (cm) |
| MurojaahRecord.qualityScore | 1-100 |
| SimaanExam.overallScore | 0-100 |
| SimaanExam.grade | Mumtaz, Jayyid Jiddan, Jayyid, Maqbul, Rasib |

---

## Appendix A: Complete Enum Definitions (Prisma Format)

```prisma
// ===== NEW ENUMS FOR ENHANCEMENT =====

enum PAUDAspect {
  NAM   // Nilai Agama & Moral
  FM    // Fisik Motorik
  KOG   // Kognitif
  BHS   // Bahasa
  SE    // Sosial Emosional
  SNI   // Seni
}

enum PAUDAchievementLevel {
  BB    // Belum Berkembang
  MB    // Mulai Berkembang
  BSH   // Berkembang Sesuai Harapan
  BSB   // Berkembang Sangat Baik
}

enum DailyMood {
  HAPPY
  NEUTRAL
  SAD
  TIRED
  EXCITED
  SICK
}

enum MealConsumption {
  HABIS
  SETENGAH
  SEDIKIT
  TIDAK_MAU
}

enum MurojaahType {
  YAUMIYAH
  USBUIYAH
  SYAHRIYAH
  TASMI
}

enum TahfidzMistakeType {
  LAHIN_JALI
  LAHIN_KHAFI
  TAJWID
  LUPA
  URUTAN
}

enum SimaanType {
  BIN_NAZHR
  BIL_GHAIB
  TAHDIR
  TASMI
  KHATAM
}

enum PAUDReportPeriod {
  HARIAN
  MINGGUAN
  BULANAN
  SEMESTER
}
```

---

**Status:** Draft - Awaiting Confirmation

**Next Step:** Konfirmasi Database Design sebelum lanjut ke Backend Design
