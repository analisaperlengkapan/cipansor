# Frontend Design Document - Cipansor Enhancement

**Versi:** 1.0.0
**Tanggal:** 5 Desember 2025
**Status:** Draft
**Referensi Dokumen:** requirements.md, database-design.md, backend-design.md

---

## Daftar Isi

1. [Overview](#1-overview)
2. [PAUD Module Pages](#2-paud-module-pages)
3. [Daily Report Pages](#3-daily-report-pages)
4. [Tahfidz Enhancement Pages](#4-tahfidz-enhancement-pages)
5. [Dashboard Enhancement Pages](#5-dashboard-enhancement-pages)
6. [Component Library](#6-component-library)
7. [State Management](#7-state-management)
8. [Routing](#8-routing)
9. [Form Handling](#9-form-handling)

---

## 1. Overview

**Refs:** [Req 1.4], [Req 11.5] [DB 1.1] [BE 1.1]

### 1.1 Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **UI Library:** React 18+
- **Styling:** TailwindCSS + shadcn/ui
- **State:** React Query (TanStack Query) + Zustand
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Icons:** Lucide React

### 1.2 Design System

- **Component Library:** shadcn/ui (existing)
- **Theme:** Light/Dark mode support
- **Responsive:** Mobile-first approach
- **Accessibility:** WCAG 2.1 AA compliance

### 1.3 Folder Structure Pattern

```
app/
└── [module]/
    ├── page.tsx           # List/Dashboard page
    ├── [id]/
    │   ├── page.tsx       # Detail page
    │   └── edit/
    │       └── page.tsx   # Edit page
    └── new/
        └── page.tsx       # Create page
```

### 1.4 Page Statistics Summary

| Module          | New Pages | Enhanced Pages |
| --------------- | --------- | -------------- |
| PAUD Assessment | 6         | 0              |
| PAUD Reports    | 4         | 0              |
| Daily Report    | 5         | 0              |
| Murojaah        | 5         | 0              |
| Simaan          | 4         | 0              |
| Dashboard       | 2         | 1              |
| **Total**       | **26**    | **1**          |

---

## 2. PAUD Module Pages

**Refs:** [Req 4.1], [Req 4.2] [DB 3.x] [BE 2.x]

### 2.1 PAUD Assessment List

**Route:** `/paud/assessment`
**Refs:** [Req 4.1] [BE 2.1.1]

**Components:**

- PageHeader, FilterBar, DataTable, Pagination
- AssessmentCard (mobile view)

**Features:**

- Filter by: student, class, aspect, period, achievement level
- Search by student name
- Date range picker
- Export to Excel
- Bulk actions (for admin)

**API Integration:**

- GET /api/paud/assessments

**State:**

- filters (local)
- pagination (local)
- assessments (server - React Query)

### 2.2 PAUD Assessment Create

**Route:** `/paud/assessment/new`
**Refs:** [Req 4.1.2] [BE 2.1.2]

**Components:**

- PageHeader, Form, StudentSelector, AspectSelector
- AchievementLevelRadio, NarrativeTextarea
- EvidenceUploader, IndicatorChecklist

**Form Fields:**
| Field | Type | Validation |
|-------|------|------------|
| studentId | Select | Required |
| periodType | Select | Required |
| periodDate | DatePicker | Required, not future |
| aspect | Select | Required |
| indicatorId | Select | Optional |
| achievementLevel | RadioGroup | Required |
| narrativeText | Textarea | Max 2000 chars |
| teacherNotes | Textarea | Optional |
| recommendations | Textarea | Optional |
| evidences | FileUpload | Max 5 files, 5MB each |

**API Integration:**

- POST /api/paud/assessments
- POST /api/paud/assessments/:id/evidence

### 2.3 PAUD Assessment Detail

**Route:** `/paud/assessment/[id]`
**Refs:** [Req 4.1] [BE 2.1.1]

**Components:**

- PageHeader, DetailCard, EvidenceGallery
- AspectBadge, AchievementBadge

**Sections:**

1. Student Info (name, class, photo)
2. Assessment Info (period, aspect, date)
3. Achievement & Narrative
4. Evidence Gallery (lightbox)
5. Teacher Notes
6. Actions (edit, delete, print)

**API Integration:**

- GET /api/paud/assessments/:id
- DELETE /api/paud/assessments/:id

### 2.4 Student Progress Dashboard

**Route:** `/paud/assessment/student/[studentId]`
**Refs:** [Req 4.1.3] [BE 2.1.1]

**Components:**

- PageHeader, StudentCard, ProgressChart
- AspectProgressCard (x6), AssessmentTimeline

**Visualizations:**

1. **Radar Chart:** 6 aspects current level
2. **Line Chart:** Progress over time per aspect
3. **Timeline:** Recent assessments chronologically

**Sections:**

1. Student Overview
2. Current Achievement Summary (6 cards)
3. Progress Charts
4. Assessment History (paginated table)
5. Recommendations Summary

**API Integration:**

- GET /api/paud/assessments/student/:studentId/summary
- GET /api/paud/assessments?studentId=xxx

### 2.5 PAUD Report List

**Route:** `/paud/reports`
**Refs:** [Req 4.2] [BE 2.2.1]

**Components:**

- PageHeader, FilterBar, DataTable
- StatusBadge (DRAFT, FINALIZED, PRINTED)

**Columns:**
| Column | Description |
|--------|-------------|
| Student | Name + Class |
| Academic Year | 2024/2025 |
| Semester | Ganjil/Genap |
| Status | Badge |
| Created | Date |
| Actions | View, Edit, PDF, Finalize |

**API Integration:**

- GET /api/paud/reports

### 2.6 PAUD Report Detail/Edit

**Route:** `/paud/reports/[id]`
**Refs:** [Req 4.2] [BE 2.2.1]

**Components:**

- PageHeader, ReportForm, NarrativeEditor
- PhotoGallery, SignatureInput, PrintPreview

**Sections:**

1. Header (Student, Year, Semester)
2. Narrative per Aspect (6 rich text editors)
3. Overall Strengths (textarea)
4. Areas for Development (textarea)
5. Parent Recommendations (textarea)
6. Photo Gallery (upload/reorder)
7. Attendance Summary (auto-calculated)
8. Signatures (teacher, principal)
9. Actions (save draft, finalize, download PDF)

**Workflow States:**

```
DRAFT → FINALIZED → PRINTED
         ↑           ↑
      (Kepala)    (anyone)
```

**API Integration:**

- GET /api/paud/reports/:id
- PUT /api/paud/reports/:id
- POST /api/paud/reports/:id/finalize
- GET /api/paud/reports/:id/pdf

### 2.7 Generate Report Page

**Route:** `/paud/reports/generate`
**Refs:** [Req 4.2.2] [BE 2.2.1]

**Components:**

- PageHeader, StudentMultiSelect, PreviewCard
- GenerateButton, ProgressIndicator

**Flow:**

1. Select Academic Year & Semester
2. Select Students (single or batch)
3. Preview assessment summary
4. Generate reports
5. Redirect to report list

**API Integration:**

- POST /api/paud/reports/generate

---

## 3. Daily Report Pages

**Refs:** [Req 4.3], [Req 5.3] [DB 4.x] [BE 3.x]

### 3.1 Daily Report List

**Route:** `/daily-reports`
**Refs:** [Req 4.3] [BE 3.1.1]

**Components:**

- PageHeader, FilterBar, DatePicker
- ReportGrid (card view for mobile)
- DataTable (desktop)

**Filters:**
| Filter | Type | Options |
|--------|------|---------|
| Date | DatePicker | Single date |
| Class | Select | Teacher's classes |
| Unit Type | Select | PAUD, TK, SD_IT |
| Student | Search | Autocomplete |
| Notified | Toggle | All / Not Sent |

**Quick Actions:**

- "Buat Laporan Hari Ini" button
- Bulk check-in shortcut
- "Kirim Semua" notification button

**API Integration:**

- GET /api/daily-reports

### 3.2 Daily Report Create/Edit

**Route:** `/daily-reports/new` atau `/daily-reports/[id]`
**Refs:** [Req 4.3.1], [Req 4.3.2] [BE 3.1.2]

**Components:**

- PageHeader, StudentSelector, DatePicker
- MoodSelector, HealthStatusInput
- MealStatusRadio, ActivityTextarea
- PhotoUploader, HomeworkList

**Form Sections:**

**Section A: Check-in (Guru input pagi)**
| Field | Type | PAUD | SD IT |
|-------|------|------|-------|
| arrivalTime | TimePicker | ✓ | ✓ |
| mood | EmojiSelector | ✓ | ✓ |
| healthStatus | Select | ✓ | ✓ |
| temperature | NumberInput | ✓ (opt) | ✗ |
| hadBreakfast | Toggle | ✓ | ✓ |

**Section B: Activities (Guru input siang)**
| Field | Type | PAUD | SD IT |
|-------|------|------|-------|
| mealStatus | RadioGroup | ✓ | ✗ |
| snackStatus | RadioGroup | ✓ | ✗ |
| napDuration | NumberInput | ✓ | ✗ |
| toiletNotes | Textarea | ✓ | ✗ |
| sholatDhuha | Toggle | ✗ | ✓ |
| tahfidzActivity | Input | ✗ | ✓ |
| activitiesSummary | Textarea | ✓ | ✓ |
| achievements | Textarea | ✓ | ✓ |
| behaviorNotes | Textarea | ✓ | ✓ |
| teacherNotes | Textarea | ✓ | ✓ |
| homeActivity | Textarea | ✓ | ✓ |

**Section C: Photos**

- PhotoUploader (max 5 photos)
- Caption input per photo

**Section D: Homework (SD IT only)**

- HomeworkList component
- Add/remove subjects
- Due date per homework

**Section E: Departure**
| Field | Type |
|-------|------|
| departureTime | TimePicker |
| pickedUpBy | Input |

**API Integration:**

- POST /api/daily-reports
- PUT /api/daily-reports/:id
- POST /api/daily-reports/:id/photos
- POST /api/daily-reports/:id/homework

### 3.3 Bulk Check-in Page

**Route:** `/daily-reports/bulk-checkin`
**Refs:** [Req 4.3.1] [BE 3.1.1]

**Components:**

- PageHeader, ClassSelector, DatePicker
- StudentCheckInTable, BulkMoodSelector
- SubmitProgress

**Features:**

- Select class → load all students
- Default values for common fields
- Individual override per student
- Progress indicator during submission

**API Integration:**

- POST /api/daily-reports/bulk-checkin

### 3.4 Daily Report Detail (Parent View)

**Route:** `/parent/daily-reports/[id]`
**Refs:** [Req 4.3.3] [BE 3.1.1]

**Components:**

- PageHeader, ReportCard, PhotoGallery
- MoodDisplay, ActivityTimeline
- HomeworkList (SD IT)

**Sections:**

1. Date & Student Info
2. Mood & Health Status (visual)
3. Meal Summary (PAUD)
4. Activity Summary
5. Photo Gallery
6. Teacher Notes
7. Home Activity / PR
8. Mark as Read button

**API Integration:**

- GET /api/daily-reports/:id
- PUT /api/daily-reports/:id (parentReadAt)

### 3.5 Daily Report Class View

**Route:** `/daily-reports/class/[classId]`
**Refs:** [Req 4.3] [BE 3.1.1]

**Components:**

- PageHeader, ClassHeader, DatePicker
- StudentReportGrid, CompletionProgress

**Features:**

- View all students in a class for selected date
- Visual completion status (green/red dots)
- Quick navigate to individual reports
- Batch notification sender

**API Integration:**

- GET /api/daily-reports/class/:classId/today

---

## 4. Tahfidz Enhancement Pages

**Refs:** [Req 7.1], [Req 7.2] [DB 5.x] [BE 4.x]

### 4.1 Murojaah Record List

**Route:** `/murojaah`
**Refs:** [Req 7.1.2] [BE 4.1.1]

**Components:**

- PageHeader, FilterBar, DataTable
- QualityScoreBar, MurojaahTypeChip

**Columns:**
| Column | Description |
|--------|-------------|
| Student | Name + Halaqoh |
| Type | YAUMIYAH/USBUIYAH/etc |
| Date | DD/MM/YYYY |
| Juz Range | 1-3 |
| Pages | 60 pages |
| Quality | Progress bar + score |
| Actions | View, Edit, Delete |

**Filters:**

- Student, Halaqoh, Type, Date Range, Quality Range

**API Integration:**

- GET /api/murojaah

### 4.2 Murojaah Create/Edit

**Route:** `/murojaah/new` atau `/murojaah/[id]`
**Refs:** [Req 7.1.2] [BE 4.1.2]

**Components:**

- PageHeader, StudentSelector, HalaqohSelector
- MurojaahTypeRadio, JuzRangeSelector
- QualitySlider, MistakeLogger
- DurationInput, NotesTextarea

**Form Fields:**
| Field | Type | Validation |
|-------|------|------------|
| studentId | Select | Required |
| halaqohId | Select | Optional |
| murojaahType | RadioGroup | Required |
| murojaahDate | DatePicker | Required |
| juzStart | NumberInput | 1-30 |
| juzEnd | NumberInput | ≥ juzStart |
| pagesReviewed | NumberInput | > 0 |
| durationMinutes | NumberInput | > 0 |
| qualityScore | Slider | 1-100 |
| fluencyLevel | StarRating | 1-5 |
| tajwidScore | Slider | Optional |
| notes | Textarea | Optional |
| improvementAreas | Textarea | Optional |

**Mistake Logger Component:**

- Add mistake button
- Fields: type, juz, surah, ayah, description
- List view with delete

**API Integration:**

- POST /api/murojaah
- PUT /api/murojaah/:id
- POST /api/murojaah/:id/mistakes

### 4.3 Student Murojaah Dashboard

**Route:** `/murojaah/student/[studentId]`
**Refs:** [Req 7.1.2] [BE 4.1.1]

**Components:**

- PageHeader, StudentCard, SummaryCards
- MurojaahCalendar, QualityTrendChart
- MistakeBreakdownChart, HistoryTable

**Sections:**

1. **Summary Cards:**
   - Total Sessions (month)
   - Total Pages
   - Average Quality
   - Streak (consecutive days)

2. **Calendar View:**
   - Heat map style calendar
   - Color by quality score
   - Click to view detail

3. **Charts:**
   - Quality trend (line chart)
   - Mistake breakdown (pie chart)
   - Session by type (bar chart)

4. **History Table:**
   - Paginated list
   - Sortable columns
   - Quick actions

**API Integration:**

- GET /api/murojaah/student/:studentId/summary
- GET /api/murojaah/student/:studentId

### 4.4 Murojaah Schedule Page

**Route:** `/murojaah/schedule`
**Refs:** [Req 7.1.2] [BE 4.1.1]

**Components:**

- PageHeader, ScheduleCard, TargetProgress
- RecommendationList

**Sections:**

1. **Today's Target:**
   - YAUMIYAH target (juz range)
   - Estimated time
   - Start murojaah button

2. **Weekly Schedule:**
   - USBUIYAH target
   - Progress indicator

3. **Monthly Plan:**
   - SYAHRIYAH overview
   - Calendar view

**API Integration:**

- GET /api/murojaah/schedule

### 4.5 Simaan Exam List

**Route:** `/simaan`
**Refs:** [Req 7.1.3] [BE 4.2.1]

**Components:**

- PageHeader, FilterBar, DataTable
- SimaanTypeBadge, GradeBadge, ScoreDisplay

**Columns:**
| Column | Description |
|--------|-------------|
| Student | Name |
| Type | BIL_GHAIB, KHATAM, etc |
| Date | DD/MM/YYYY |
| Juz | 1-5 |
| Score | 87.5 |
| Grade | Jayyid Jiddan |
| Status | Passed/Failed |
| Actions | View, Edit, Finalize |

**API Integration:**

- GET /api/simaan

### 4.6 Simaan Create/Edit

**Route:** `/simaan/new` atau `/simaan/[id]`
**Refs:** [Req 7.1.3] [BE 4.2.2]

**Components:**

- PageHeader, StudentSelector, ExamTypeSelector
- JuzRangeInput, ExaminerList, ScoreInputs
- GradeCalculator, NotesTextarea

**Form Sections:**

**Section A: Basic Info**
| Field | Type |
|-------|------|
| studentId | Select |
| simaanType | RadioGroup |
| examDate | DateTimePicker |
| sessionNumber | NumberInput |
| totalSessions | NumberInput |
| juzStart | NumberInput |
| juzEnd | NumberInput |

**Section B: Examiners**

- Add examiner (select from Muhafidz)
- Score per examiner (optional)
- Notes per examiner

**Section C: Scoring (Finalize)**
| Field | Type | Range |
|-------|------|-------|
| tajwidScore | Slider | 0-100 |
| fashohaScore | Slider | 0-100 |
| tartilScore | Slider | 0-100 |

**Section D: Result (Auto-calculated)**

- Overall Score (average)
- Grade (Mumtaz/Jayyid Jiddan/etc)
- Pass/Fail status

**API Integration:**

- POST /api/simaan
- PUT /api/simaan/:id
- POST /api/simaan/:id/finalize

### 4.7 Simaan Detail

**Route:** `/simaan/[id]`
**Refs:** [Req 7.1.3] [BE 4.2.1]

**Components:**

- PageHeader, ExamInfoCard, ExaminerList
- ScoreRadarChart, ResultCard, CertificateLink

**Sections:**

1. Exam Info (student, type, date, juz range)
2. Examiners & their scores
3. Score breakdown (radar chart)
4. Final result (grade, pass/fail)
5. Actions (edit if not finalized, generate certificate)

**API Integration:**

- GET /api/simaan/:id

### 4.8 Sanad Certificate Page

**Route:** `/sanad/[id]/certificate`
**Refs:** [Req 7.2.3] [BE 4.3.2]

**Components:**

- PageHeader, CertificatePreview, QRCodeDisplay
- DownloadButton, ShareButton

**Sections:**

1. Certificate Preview (iframe or image)
2. Certificate Details (number, issued date)
3. Verification Info (QR code, URL)
4. Actions (download PDF, share, print)

**API Integration:**

- POST /api/sanad/:id/certificate
- GET /api/sanad/:id/certificate/pdf

### 4.9 Public Verification Page

**Route:** `/verify/[code]` (Public, no auth)
**Refs:** [Req 7.2.3] [BE 4.3.2]

**Components:**

- VerificationResult, CertificateInfo, SchoolLogo

**States:**

1. Loading (verifying)
2. Valid (show certificate info)
3. Invalid (show error message)

**Display Info (if valid):**

- Student name
- Juz/range certified
- Grade
- Teacher name
- Issue date
- School name

**API Integration:**

- GET /api/sanad/verify/:code (PUBLIC)

---

## 5. Dashboard Enhancement Pages

**Refs:** [Req 9.1] [DB 6.x] [BE 5.x]

### 5.1 Yayasan Dashboard

**Route:** `/dashboard/yayasan`
**Refs:** [Req 9.1.1] [BE 5.1.1]

**Components:**

- PageHeader, MetricCard, UnitSelector
- TrendChart, ComparisonTable, AlertList
- QuickActions

**Sections:**

**Row 1: Key Metrics (4 cards)**
| Metric | Icon | Value | Trend |
|--------|------|-------|-------|
| Total Siswa | Users | 1,250 | +5.2% |
| Kehadiran Hari Ini | CheckCircle | 94.5% | +1.2% |
| Pendapatan Bulan Ini | DollarSign | Rp 850jt | +2.5% |
| Progress Tahfidz | BookOpen | 65.5% avg | +3.1% |

**Row 2: Charts (2 columns)**

- Left: Attendance trend (line chart, 30 days)
- Right: Unit comparison (bar chart)

**Row 3: Tables (2 columns)**

- Left: Recent Achievements (top 5)
- Right: Active Alerts

**Row 4: Quick Actions**

- Generate reports
- View overdue payments
- Check compliance status

**API Integration:**

- GET /api/dashboard/overview
- GET /api/dashboard/alerts

### 5.2 Unit Comparison Page

**Route:** `/dashboard/comparison`
**Refs:** [Req 9.1.2] [BE 5.1.1]

**Components:**

- PageHeader, MetricSelector, PeriodSelector
- ComparisonChart, RankingTable

**Features:**

- Compare: Attendance, Tahfidz, Finance, Academic
- Period: Weekly, Monthly, Semester
- Visualization: Bar chart + ranking table
- Export to PDF/Excel

**API Integration:**

- GET /api/dashboard/comparison

### 5.3 Dashboard (Enhanced)

**Route:** `/dashboard` (existing page enhancement)
**Refs:** [Req 9.1] [BE 5.1.1]

**Enhancements:**

- Add "Lihat Data Yayasan" link (for YAYASAN roles)
- Add unit comparison widget (for unit admins)
- Add alert notification badge
- Improve mobile responsiveness

---

## 6. Component Library

**Refs:** [Req 11.5] [BE 1.4]

### 6.1 New Shared Components

| Component        | Purpose                  | Props                            |
| ---------------- | ------------------------ | -------------------------------- |
| AspectBadge      | Display PAUD aspect      | aspect, size                     |
| AchievementBadge | Display BB/MB/BSH/BSB    | level, size                      |
| MoodSelector     | Emoji-based mood picker  | value, onChange                  |
| QualityScoreBar  | Progress bar for scores  | score, max                       |
| GradeBadge       | Tahfidz grade display    | grade, passed                    |
| EvidenceGallery  | Photo/video gallery      | items, onDelete                  |
| MistakeLogger    | Tahfidz mistake input    | mistakes, onAdd, onRemove        |
| JuzRangeSelector | Juz range picker         | start, end, onChange             |
| StudentSelector  | Student search + select  | unitId, classId, value, onChange |
| DateRangePicker  | Date range filter        | startDate, endDate, onChange     |
| MetricCard       | Dashboard metric display | title, value, trend, icon        |
| TrendChart       | Line chart for trends    | data, xKey, yKey                 |
| ComparisonChart  | Bar chart for comparison | data, units                      |
| AlertCard        | Alert notification card  | type, title, message, action     |

### 6.2 Form Components Enhancement

| Component       | Enhancement                                |
| --------------- | ------------------------------------------ |
| FileUpload      | Add preview, progress, max size validation |
| RichTextarea    | Add simple formatting (bold, italic, list) |
| StarRating      | 1-5 star rating input                      |
| TimeRangePicker | Start + end time input                     |

### 6.3 Layout Components

| Component       | Purpose                       |
| --------------- | ----------------------------- |
| TwoColumnLayout | Responsive 2-col layout       |
| SectionCard     | Card with title + collapsible |
| StepWizard      | Multi-step form wizard        |
| TabLayout       | Tab-based content switch      |

---

## 7. State Management

**Refs:** [Req 11.5] [BE 1.4]

### 7.1 React Query Hooks

```typescript
// New hooks to create

// PAUD Assessment
usePAUDIndicators(filters);
usePAUDAssessments(filters);
usePAUDAssessment(id);
useCreatePAUDAssessment();
useUpdatePAUDAssessment();
useDeletePAUDAssessment();
usePAUDStudentProgress(studentId);

// PAUD Reports
usePAUDReports(filters);
usePAUDReport(id);
useCreatePAUDReport();
useUpdatePAUDReport();
useFinalizePAUDReport();
useGeneratePAUDReports();
useDownloadPAUDReportPDF(id);

// Daily Report
useDailyReports(filters);
useDailyReport(id);
useCreateDailyReport();
useUpdateDailyReport();
useDeleteDailyReport();
useBulkCheckin();
useNotifyParent(id);
useClassDailyReports(classId, date);

// Murojaah
useMurojaahRecords(filters);
useMurojaahRecord(id);
useCreateMurojaah();
useUpdateMurojaah();
useDeleteMurojaah();
useMurojaahStudentSummary(studentId);
useMurojaahSchedule();

// Simaan
useSimaanExams(filters);
useSimaanExam(id);
useCreateSimaan();
useUpdateSimaan();
useDeleteSimaan();
useFinalizeSimaan();

// Dashboard
useYayasanDashboard();
useDashboardComparison(metric, period);
useDashboardAlerts();
```

### 7.2 Zustand Stores

```typescript
// Filter persistence stores

interface PAUDFilterStore {
  classId: string | null;
  aspect: PAUDAspect | null;
  periodType: PAUDReportPeriod | null;
  dateRange: { start: Date; end: Date } | null;
  setClassId: (id: string | null) => void;
  setAspect: (aspect: PAUDAspect | null) => void;
  // ... other setters
  reset: () => void;
}

interface DailyReportFilterStore {
  date: Date;
  classId: string | null;
  unitType: UnitType | null;
  setDate: (date: Date) => void;
  // ... other setters
  reset: () => void;
}

interface MurojaahFilterStore {
  studentId: string | null;
  halaqohId: string | null;
  murojaahType: MurojaahType | null;
  dateRange: { start: Date; end: Date } | null;
  // ... setters
}
```

---

## 8. Routing

**Refs:** [Req 11.5]

### 8.1 New Routes Summary

```typescript
// PAUD Module
/paud/assessment                    // List assessments
/paud/assessment/new                // Create assessment
/paud/assessment/[id]               // View assessment
/paud/assessment/[id]/edit          // Edit assessment
/paud/assessment/student/[studentId] // Student progress

/paud/reports                       // List reports
/paud/reports/[id]                  // View/Edit report
/paud/reports/generate              // Generate reports

// Daily Report Module
/daily-reports                      // List reports
/daily-reports/new                  // Create report
/daily-reports/[id]                 // View/Edit report
/daily-reports/bulk-checkin         // Bulk check-in
/daily-reports/class/[classId]      // Class view

// Parent Portal
/parent/daily-reports               // Parent's children reports
/parent/daily-reports/[id]          // Report detail

// Murojaah Module
/murojaah                           // List records
/murojaah/new                       // Create record
/murojaah/[id]                      // View record
/murojaah/[id]/edit                 // Edit record
/murojaah/student/[studentId]       // Student dashboard
/murojaah/schedule                  // Schedule view

// Simaan Module
/simaan                             // List exams
/simaan/new                         // Create exam
/simaan/[id]                        // View exam
/simaan/[id]/edit                   // Edit exam

// Sanad Module
/sanad/[id]/certificate             // Certificate page

// Public
/verify/[code]                      // Public verification

// Dashboard
/dashboard/yayasan                  // Yayasan dashboard
/dashboard/comparison               // Unit comparison
```

### 8.2 Route Protection

```typescript
// middleware.ts additions
const protectedRoutes = {
  "/paud/*": ["PAUD_*", "SUPER_ADMIN"],
  "/daily-reports/*": ["*_GURU", "*_ADMIN", "SUPER_ADMIN"],
  "/murojaah/*": ["MUHAFIDZ", "*_GURU", "*_ADMIN", "SUPER_ADMIN"],
  "/simaan/*": ["MUHAFIDZ", "*_ADMIN", "SUPER_ADMIN"],
  "/dashboard/yayasan": ["YAYASAN_*", "SUPER_ADMIN"],
  "/parent/*": ["*_ORANG_TUA"],
};

// Public routes (no auth)
const publicRoutes = ["/verify/*"];
```

---

## 9. Form Handling

**Refs:** [Req 11.5]

### 9.1 Zod Schemas

```typescript
// PAUD Assessment Schema
const paudAssessmentSchema = z.object({
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  semesterId: z.string().uuid().optional(),
  periodType: z.enum(["HARIAN", "MINGGUAN", "BULANAN", "SEMESTER"]),
  periodDate: z.date().max(new Date(), "Cannot be future date"),
  aspect: z.enum(["NAM", "FM", "KOG", "BHS", "SE", "SNI"]),
  indicatorId: z.string().uuid().optional(),
  achievementLevel: z.enum(["BB", "MB", "BSH", "BSB"]),
  narrativeText: z.string().max(2000).optional(),
  teacherNotes: z.string().max(1000).optional(),
  recommendations: z.string().max(1000).optional(),
});

// Daily Report Schema
const dailyReportSchema = z.object({
  studentId: z.string().uuid(),
  reportDate: z.date(),
  unitType: z.enum(["PAUD", "TK", "SD_IT"]),
  arrivalTime: z.string().optional(),
  mood: z
    .enum(["HAPPY", "NEUTRAL", "SAD", "TIRED", "EXCITED", "SICK"])
    .optional(),
  healthStatus: z.string().optional(),
  temperature: z.number().min(35).max(42).optional(),
  hadBreakfast: z.boolean().optional(),
  mealStatus: z.enum(["HABIS", "SETENGAH", "SEDIKIT", "TIDAK_MAU"]).optional(),
  snackStatus: z.enum(["HABIS", "SETENGAH", "SEDIKIT", "TIDAK_MAU"]).optional(),
  napDuration: z.number().min(0).max(180).optional(),
  toiletNotes: z.string().max(500).optional(),
  sholatDhuha: z.boolean().optional(),
  tahfidzActivity: z.string().max(200).optional(),
  activitiesSummary: z.string().max(2000).optional(),
  achievements: z.string().max(1000).optional(),
  behaviorNotes: z.string().max(1000).optional(),
  teacherNotes: z.string().max(1000).optional(),
  homeActivity: z.string().max(1000).optional(),
});

// Murojaah Schema
const murojaahSchema = z
  .object({
    studentId: z.string().uuid(),
    enrollmentId: z.string().uuid().optional(),
    halaqohId: z.string().uuid().optional(),
    murojaahType: z.enum(["YAUMIYAH", "USBUIYAH", "SYAHRIYAH", "TASMI"]),
    murojaahDate: z.date(),
    juzStart: z.number().int().min(1).max(30),
    juzEnd: z.number().int().min(1).max(30),
    pagesReviewed: z.number().int().positive(),
    durationMinutes: z.number().int().positive(),
    qualityScore: z.number().int().min(1).max(100),
    fluencyLevel: z.number().int().min(1).max(5).optional(),
    tajwidScore: z.number().int().min(1).max(100).optional(),
    notes: z.string().max(1000).optional(),
    improvementAreas: z.string().max(1000).optional(),
  })
  .refine((data) => data.juzEnd >= data.juzStart, {
    message: "Juz end must be >= juz start",
    path: ["juzEnd"],
  });

// Simaan Schema
const simaanSchema = z.object({
  studentId: z.string().uuid(),
  enrollmentId: z.string().uuid().optional(),
  simaanType: z.enum(["BIN_NAZHR", "BIL_GHAIB", "TAHDIR", "TASMI", "KHATAM"]),
  examDate: z.date(),
  sessionNumber: z.number().int().positive().default(1),
  totalSessions: z.number().int().positive().default(1),
  juzStart: z.number().int().min(1).max(30),
  juzEnd: z.number().int().min(1).max(30),
  notes: z.string().max(1000).optional(),
});
```

### 9.2 Form Error Messages (Indonesian)

```typescript
const errorMessages = {
  required: "Field ini wajib diisi",
  invalid_type: "Format tidak valid",
  too_small: {
    string: "Minimal {min} karakter",
    number: "Minimal {min}",
  },
  too_big: {
    string: "Maksimal {max} karakter",
    number: "Maksimal {max}",
  },
  custom: {
    future_date: "Tanggal tidak boleh di masa depan",
    invalid_juz_range: "Juz akhir harus >= juz awal",
    duplicate_report: "Laporan untuk siswa dan tanggal ini sudah ada",
  },
};
```

---

## Appendix A: Page-Component Matrix

| Page                   | Main Components                                         |
| ---------------------- | ------------------------------------------------------- |
| PAUD Assessment List   | PageHeader, FilterBar, DataTable, Pagination            |
| PAUD Assessment Create | Form, StudentSelector, AspectSelector, EvidenceUploader |
| PAUD Assessment Detail | DetailCard, EvidenceGallery, AspectBadge                |
| Student Progress       | RadarChart, LineChart, Timeline, ProgressCard           |
| Daily Report Create    | Form, MoodSelector, PhotoUploader, HomeworkList         |
| Murojaah Create        | Form, JuzRangeSelector, QualitySlider, MistakeLogger    |
| Simaan Create          | Form, ExaminerList, ScoreInputs, GradeCalculator        |
| Yayasan Dashboard      | MetricCard, TrendChart, ComparisonTable, AlertList      |

---

## Appendix B: Mobile Responsiveness Breakpoints

| Breakpoint | Width  | Layout Change                |
| ---------- | ------ | ---------------------------- |
| sm         | 640px  | Single column, stack cards   |
| md         | 768px  | Two columns where applicable |
| lg         | 1024px | Full sidebar visible         |
| xl         | 1280px | Extra spacing, larger charts |

---

**Status:** Draft - Awaiting Confirmation

**Next Step:** Konfirmasi Frontend Design sebelum lanjut ke Tasks Breakdown
