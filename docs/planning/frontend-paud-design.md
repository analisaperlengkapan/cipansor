# Frontend Design - PAUD Module Enhancement

**Version:** 1.0.0  
**Date:** December 11, 2025  
**References:** enhancement-overview.md, requirements.md, backend-design.md  
**Status:** Design Specification

---

## Module Overview

### Target Users

- **PAUD Guru**: Input assessments, daily reports
- **PAUD Kepala Sekolah**: Monitor class progress, approve reports
- **Orang Tua**: View child development progress
- **PAUD Admin**: System configuration, templates

### Pages Summary

| Page                 | Route                          | Priority | Complexity |
| -------------------- | ------------------------------ | -------- | ---------- |
| Assessment List      | `/paud/assessment`             | P1       | Medium     |
| Assessment Create    | `/paud/assessment/new`         | P1       | High       |
| Assessment Edit      | `/paud/assessment/:id/edit`    | P1       | High       |
| Student Progress     | `/paud/assessment/student/:id` | P1       | High       |
| Class Dashboard      | `/paud/assessment/class/:id`   | P1       | Medium     |
| Indicator Management | `/paud/assessment/indicators`  | P2       | Low        |
| Report List          | `/paud/reports`                | P1       | Medium     |
| Report Generate      | `/paud/reports/generate`       | P1       | High       |
| Report View/Edit     | `/paud/reports/:id`            | P1       | Medium     |
| Daily Report Input   | `/paud/daily-report/new`       | P1       | Medium     |
| Daily Report List    | `/paud/daily-report`           | P1       | Low        |

---

## Page 1: PAUD Assessment List

### Route

`/paud/assessment`

### User Stories

- **As a guru**, I want to see all assessments I've created, so I can track my work
- **As a kepala sekolah**, I want to see all class assessments, so I can monitor progress
- **As a guru**, I want to filter assessments by student/aspect/period, so I can find specific records

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header: PAUD Assessment                          [+ New]    │
├─────────────────────────────────────────────────────────────┤
│ Filters: [Student ▼] [Aspect ▼] [Period ▼] [Date Range]   │
│         [Search...................................] [Filter]│
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Student        │ Aspect │ Level │ Date       │ Actions │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Ahmad Rizky    │ NAM    │ BSH   │ 2025-12-10 │ [View]  │ │
│ │ 📸 (2 photos)  │        │       │            │ [Edit]  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Siti Aisyah    │ FM     │ MB    │ 2025-12-10 │ [View]  │ │
│ │                │        │       │            │ [Edit]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Pagination: [<] 1 2 3 4 [>]                                  │
└─────────────────────────────────────────────────────────────┘
```

### Components

```typescript
// Main component
export default function PAUDAssessmentListPage() {
  const [filters, setFilters] = useState<AssessmentFilters>({})
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['paud-assessments', filters, page],
    queryFn: () => api.paud.getAssessments({ ...filters, page })
  })

  return (
    <div>
      <PageHeader
        title="PAUD Assessment"
        action={<Button>+ New Assessment</Button>}
      />
      <AssessmentFilters
        filters={filters}
        onChange={setFilters}
      />
      <AssessmentTable
        data={data?.assessments}
        isLoading={isLoading}
      />
      <Pagination
        page={page}
        totalPages={data?.pagination.totalPages}
        onChange={setPage}
      />
    </div>
  )
}
```

### Filter Component

```typescript
interface AssessmentFiltersProps {
  filters: AssessmentFilters
  onChange: (filters: AssessmentFilters) => void
}

function AssessmentFilters({ filters, onChange }: AssessmentFiltersProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StudentSelect
        value={filters.studentId}
        onChange={(v) => onChange({ ...filters, studentId: v })}
        placeholder="All Students"
      />
      <AspectSelect
        value={filters.aspect}
        onChange={(v) => onChange({ ...filters, aspect: v })}
        placeholder="All Aspects"
      />
      <PeriodSelect
        value={filters.periodId}
        onChange={(v) => onChange({ ...filters, periodId: v })}
        placeholder="All Periods"
      />
      <DateRangePicker
        from={filters.dateFrom}
        to={filters.dateTo}
        onChange={(range) => onChange({
          ...filters,
          dateFrom: range.from,
          dateTo: range.to
        })}
      />
    </div>
  )
}
```

### API Integration

```typescript
// src/lib/api/paud.ts
export const paudApi = {
  getAssessments: async (params: GetAssessmentsParams) => {
    const response = await fetch("/api/paud-assessment/assessments", {
      method: "GET",
      headers: authHeaders(),
      params: cleanParams(params),
    });
    return response.json();
  },
};
```

---

## Page 2: PAUD Assessment Create/Edit

### Route

- Create: `/paud/assessment/new`
- Edit: `/paud/assessment/:id/edit`

### User Stories

- **As a guru**, I want to input assessment quickly, so I can document learning
- **As a guru**, I want to upload photos as evidence, so I can show concrete examples
- **As a guru**, I want to use template narratives, so I can speed up input

### Layout (Multi-step Form)

```
┌─────────────────────────────────────────────────────────────┐
│ New PAUD Assessment                         [Save] [Cancel] │
├─────────────────────────────────────────────────────────────┤
│ Steps: ① Student Info → ② Assessment → ③ Evidence → ④ Review│
├─────────────────────────────────────────────────────────────┤
│ Step 1: Student Information                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Student *                                               │ │
│ │ [Select student...............................▼]        │ │
│ │                                                         │ │
│ │ Assessment Period *                                     │ │
│ │ [Monthly ▼]  [December 2025 ▼]                         │ │
│ │                                                         │ │
│ │ Assessment Date *                                       │ │
│ │ [2025-12-11................📅]                          │ │
│ │                                                         │ │
│ │                                      [Next: Assessment →]│ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: Assessment Input

```
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Assessment Details                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Aspect of Development *                                 │ │
│ │ ○ NAM - Nilai Agama & Moral                            │ │
│ │ ● FM  - Fisik Motorik                                  │ │
│ │ ○ KOG - Kognitif                                       │ │
│ │ ○ BHS - Bahasa                                         │ │
│ │ ○ SE  - Sosial Emosional                              │ │
│ │ ○ SNI - Seni                                           │ │
│ │                                                         │ │
│ │ Development Indicator (Optional)                        │ │
│ │ [Select indicator.............................▼]        │ │
│ │                                                         │ │
│ │ Achievement Level *                                     │ │
│ │ ○ BB  - Belum Berkembang                              │ │
│ │ ● MB  - Mulai Berkembang                              │ │
│ │ ○ BSH - Berkembang Sesuai Harapan                     │ │
│ │ ○ BSB - Berkembang Sangat Baik                        │ │
│ │                                                         │ │
│ │ Narrative Description *                                 │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Ahmad sudah mulai menunjukkan kemampuan motorik    │ │ │
│ │ │ kasar yang baik. Ia dapat melompat dengan satu     │ │ │
│ │ │ kaki, meskipun masih butuh latihan untuk...        │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ [Use Template ▼]                        0/2000 chars    │ │
│ │                                                         │ │
│ │ Teacher Notes (Optional)                                │ │
│ │ [................................................................] │ │
│ │                                                         │ │
│ │ Recommendations for Parents (Optional)                  │ │
│ │ [................................................................] │ │
│ │                                                         │ │
│ │                          [← Back] [Next: Evidence →]    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Evidence Upload

```
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Evidence (Photos/Videos)                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Upload Evidence (Max 5 files, 5MB each)                │ │
│ │                                                         │ │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐               │ │
│ │ │          │ │          │ │ [+]      │               │ │
│ │ │  Photo 1 │ │  Photo 2 │ │ Add More │               │ │
│ │ │   [×]    │ │   [×]    │ │          │               │ │
│ │ └──────────┘ └──────────┘ └──────────┘               │ │
│ │                                                         │ │
│ │ Or drag and drop files here                            │ │
│ │                                                         │ │
│ │ Uploaded: 2/5 files                                    │ │
│ │                                                         │ │
│ │                              [← Back] [Next: Review →]  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Implementation

```typescript
// Multi-step form with React Hook Form + Zod
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { assessmentSchema } from '@/lib/schemas/paud'

export default function AssessmentForm() {
  const [step, setStep] = useState(1)
  const form = useForm({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      studentId: '',
      aspect: '',
      achievementLevel: '',
      narrativeText: '',
      evidences: []
    }
  })

  const { mutate: createAssessment, isPending } = useMutation({
    mutationFn: paudApi.createAssessment,
    onSuccess: () => {
      toast.success('Assessment created successfully')
      router.push('/paud/assessment')
    }
  })

  const onSubmit = (data: AssessmentFormData) => {
    createAssessment(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {step === 1 && <StudentInfoStep form={form} />}
        {step === 2 && <AssessmentDetailsStep form={form} />}
        {step === 3 && <EvidenceUploadStep form={form} />}
        {step === 4 && <ReviewStep form={form} onSubmit={onSubmit} />}

        <FormNavigation
          step={step}
          totalSteps={4}
          onNext={() => setStep(s => s + 1)}
          onBack={() => setStep(s => s - 1)}
        />
      </form>
    </Form>
  )
}
```

### Evidence Upload Component

```typescript
function EvidenceUpload({ value, onChange }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (files: File[]) => {
    setUploading(true)
    try {
      const urls = await Promise.all(
        files.map(file => uploadToStorage(file))
      )
      onChange([...value, ...urls])
    } catch (error) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone
        onDrop={handleFileSelect}
        accept="image/*,video/*"
        maxSize={5 * 1024 * 1024}
        maxFiles={5}
      />
      <EvidenceGallery
        items={value}
        onRemove={(index) => {
          const newValue = [...value]
          newValue.splice(index, 1)
          onChange(newValue)
        }}
      />
    </div>
  )
}
```

---

## Page 3: Student Progress Dashboard

### Route

`/paud/assessment/student/:studentId`

### User Stories

- **As a guru**, I want to see student development across 6 aspects
- **As a kepala sekolah**, I want to see progress trends over time
- **As a parent**, I want to understand my child's strengths and areas to develop

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to List                                              │
├─────────────────────────────────────────────────────────────┤
│ ┌────────┐ Ahmad Rizky                              [Print] │
│ │ Photo  │ Class: PAUD A1 | Age: 5 years 3 months          │
│ │        │ Assessment Period: December 2025                │
│ └────────┘                                                  │
├─────────────────────────────────────────────────────────────┤
│ Development Overview - Current Status                       │
│ ┌────────────────────────────────────────────────────────┐  │
│ │          NAM                                           │  │
│ │                                                        │  │
│ │    SNI  ╱     ╲  FM        ★ Legend:                 │  │
│ │       ╱   ●   ╲            ● Current (Dec 2025)      │  │
│ │      ╱    │    ╲           ○ Previous (Nov 2025)     │  │
│ │    SE  ───┼───  KOG                                   │  │
│ │            │                                          │  │
│ │          BHS                                          │  │
│ │                                                        │  │
│ │  Level Scale: BB (1) - MB (2) - BSH (3) - BSB (4)   │  │
│ └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┬─────────────────┬─────────────────────┐ │
│ │ NAM: BSH ★★★☆   │ FM: MB ★★☆☆     │ KOG: BSH ★★★☆      │ │
│ │ Nilai Agama     │ Fisik Motorik   │ Kognitif           │ │
│ │ 8 assessments   │ 6 assessments   │ 7 assessments      │ │
│ │ [View Details]  │ [View Details]  │ [View Details]     │ │
│ ├─────────────────┼─────────────────┼─────────────────────┤ │
│ │ BHS: BSH ★★★☆   │ SE: BSB ★★★★    │ SNI: MB ★★☆☆       │ │
│ │ Bahasa          │ Sosial Emosional│ Seni               │ │
│ │ 9 assessments   │ 7 assessments   │ 5 assessments      │ │
│ │ [View Details]  │ [View Details]  │ [View Details]     │ │
│ └─────────────────┴─────────────────┴─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Progress Trends (Last 6 Months)                             │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ BSB │                                    ╱──NAM        │  │
│ │ BSH │              ╱──────SE────────────╱              │  │
│ │ MB  │    ╱────────╱───FM──BHS──KOG                    │  │
│ │ BB  │╱──────SNI                                        │  │
│ │     └─────┬─────┬─────┬─────┬─────┬─────              │  │
│ │         Jul   Aug  Sep   Oct  Nov   Dec               │  │
│ └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ Recent Assessments                                          │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 10 Dec 2025 | NAM | BSH                               │  │
│ │ Ahmad sudah mengenal doa-doa harian dengan baik...    │  │
│ │ 📸 2 photos                                [View More] │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ 09 Dec 2025 | FM | MB                                 │  │
│ │ Kemampuan motorik kasar mulai berkembang...           │  │
│ │                                           [View More] │  │
│ └────────────────────────────────────────────────────────┘  │
│ [Load More Assessments]                                     │
└─────────────────────────────────────────────────────────────┘
```

### Components

```typescript
export default function StudentProgressPage({ params }: PageProps) {
  const { studentId } = params

  const { data: student } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => api.students.getById(studentId)
  })

  const { data: summary } = useQuery({
    queryKey: ['paud-summary', studentId],
    queryFn: () => api.paud.getStudentSummary(studentId)
  })

  const { data: assessments } = useQuery({
    queryKey: ['paud-assessments', studentId],
    queryFn: () => api.paud.getAssessments({ studentId })
  })

  return (
    <div className="space-y-6">
      <StudentHeader student={student} />
      <RadarChart data={summary?.aspectScores} />
      <AspectCards data={summary?.aspects} />
      <ProgressTrendChart data={summary?.trends} />
      <RecentAssessments data={assessments} />
    </div>
  )
}
```

### Radar Chart Component

```typescript
import { RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'

function AspectRadarChart({ data }: { data: AspectScore[] }) {
  const chartData = [
    { aspect: 'NAM', current: data.NAM.level, previous: data.NAM.previousLevel },
    { aspect: 'FM', current: data.FM.level, previous: data.FM.previousLevel },
    { aspect: 'KOG', current: data.KOG.level, previous: data.KOG.previousLevel },
    { aspect: 'BHS', current: data.BHS.level, previous: data.BHS.previousLevel },
    { aspect: 'SE', current: data.SE.level, previous: data.SE.previousLevel },
    { aspect: 'SNI', current: data.SNI.level, previous: data.SNI.previousLevel },
  ]

  return (
    <RadarChart width={500} height={400} data={chartData}>
      <PolarGrid />
      <PolarAngleAxis dataKey="aspect" />
      <Radar
        name="Current"
        dataKey="current"
        stroke="#8884d8"
        fill="#8884d8"
        fillOpacity={0.6}
      />
      <Radar
        name="Previous"
        dataKey="previous"
        stroke="#82ca9d"
        fill="#82ca9d"
        fillOpacity={0.3}
      />
    </RadarChart>
  )
}
```

---

## Page 4: Class Dashboard

### Route

`/paud/assessment/class/:classId`

### User Stories

- **As a guru**, I want to see class overview to identify students needing attention
- **As a kepala sekolah**, I want to compare class progress

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Class PAUD A1 - Development Dashboard                      │
│ Academic Year: 2024/2025 | Semester: Ganjil                │
├─────────────────────────────────────────────────────────────┤
│ Class Statistics                                            │
│ ┌──────────────┬──────────────┬──────────────┬────────────┐ │
│ │ 24 Students  │ 142 Total    │ 89% Complete │ Avg: BSH   │ │
│ │ Active       │ Assessments  │ This Period  │ 3.2/4.0    │ │
│ └──────────────┴──────────────┴──────────────┴────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Achievement Distribution by Aspect                          │
│ ┌────────────────────────────────────────────────────────┐  │
│ │       NAM    FM    KOG   BHS   SE    SNI               │  │
│ │ BSB   ███   ██    ███   ████  █████  ██               │  │
│ │ BSH   █████ ████  ████  ████  ████   ███              │  │
│ │ MB    ███   ████  ██    ██    █      ████             │  │
│ │ BB    █     ██    █     -     -      ███              │  │
│ └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ Students Requiring Attention                                │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ⚠ Budi Santoso - 2 aspects below average (FM, SNI)    │  │
│ │   Last assessment: 5 days ago                          │  │
│ │   [View Profile] [Add Assessment]                      │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ ⚠ Ani Wijaya - Missing assessments for 3 aspects      │  │
│ │   Last assessment: 10 days ago                         │  │
│ │   [View Profile] [Add Assessment]                      │  │
│ └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ All Students Progress Matrix                                │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Student     │ NAM │ FM  │ KOG │ BHS │ SE  │ SNI │ Avg │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ Ahmad       │ BSH │ MB  │ BSH │ BSH │ BSB │ MB  │ 2.8 │  │
│ │ Siti        │ BSB │ BSH │ BSB │ BSB │ BSB │ BSH │ 3.7 │  │
│ │ Budi        │ BSH │ BB  │ BSH │ BSH │ BSH │ BB  │ 2.3 │  │
│ │ ...         │ ... │ ... │ ... │ ... │ ... │ ... │ ... │  │
│ └────────────────────────────────────────────────────────┘  │
│ [Export to Excel]                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Page 5: Report Generation & PDF

### Route

- List: `/paud/reports`
- Generate: `/paud/reports/generate`
- View: `/paud/reports/:id`

### Report Template (Raport Narasi PAUD)

```
┌─────────────────────────────────────────────────────────────┐
│                 YAYASAN PESANTREN CIPANSOR                  │
│                      PAUD CIPANSOR                          │
│                 LAPORAN PERKEMBANGAN ANAK                   │
│                   SEMESTER GANJIL 2024/2025                 │
├─────────────────────────────────────────────────────────────┤
│ IDENTITAS ANAK                                              │
│ Nama           : Ahmad Rizky                                │
│ Kelas          : PAUD A1                                    │
│ Tanggal Lahir  : 15 Mei 2020 (5 tahun 7 bulan)            │
│ Nama Orang Tua : Bapak Rizky / Ibu Siti                   │
├─────────────────────────────────────────────────────────────┤
│ PERKEMBANGAN PER ASPEK                                      │
│                                                             │
│ 1. NILAI AGAMA DAN MORAL (NAM) - BSH ★★★☆                 │
│    Ahmad menunjukkan perkembangan yang baik dalam aspek    │
│    nilai agama dan moral. Ia sudah hafal doa-doa harian   │
│    seperti doa sebelum makan, doa sebelum tidur, dan doa  │
│    setelah bangun tidur. Ahmad juga mulai memahami        │
│    pentingnya berbagi dengan teman dan menghormati orang  │
│    yang lebih tua. Dalam kegiatan sholat dhuha bersama,   │
│    Ahmad mengikuti dengan khusyuk meskipun masih perlu    │
│    bimbingan untuk gerakan yang sempurna.                  │
│                                                             │
│ 2. FISIK MOTORIK (FM) - MB ★★☆☆                           │
│    Perkembangan motorik kasar Ahmad mulai menunjukkan     │
│    kemajuan. Ia dapat berlari dengan stabil dan melompat  │
│    dengan dua kaki. Namun, untuk melompat dengan satu     │
│    kaki masih memerlukan latihan lebih lanjut. Motorik    │
│    halusnya cukup baik, Ahmad dapat memegang pensil       │
│    dengan tepat dan mulai belajar menulis huruf-huruf     │
│    sederhana. Koordinasi mata dan tangan terus berkembang │
│    melalui kegiatan menggunting dan menempel.              │
│                                                             │
│ [... similar for KOG, BHS, SE, SNI ...]                    │
├─────────────────────────────────────────────────────────────┤
│ KEKUATAN & PRESTASI                                         │
│ • Sangat antusias dalam kegiatan keagamaan                 │
│ • Memiliki kemampuan sosial yang baik dengan teman        │
│ • Kreatif dalam kegiatan seni dan bernyanyi               │
├─────────────────────────────────────────────────────────────┤
│ AREA YANG PERLU DIKEMBANGKAN                                │
│ • Motorik kasar (melompat satu kaki)                       │
│ • Konsentrasi dalam kegiatan yang membutuhkan fokus lama  │
│ • Keberanian untuk tampil di depan kelas                   │
├─────────────────────────────────────────────────────────────┤
│ REKOMENDASI UNTUK ORANG TUA                                 │
│ 1. Lakukan aktivitas fisik bersama di rumah (berlari,     │
│    melompat, bermain bola)                                 │
│ 2. Biasakan membaca buku cerita setiap malam sebelum tidur│
│ 3. Libatkan Ahmad dalam kegiatan rumah tangga sederhana   │
│ 4. Terus dukung kegiatan keagamaan dengan memberi contoh  │
│                                                             │
│ Catatan Wali Kelas:                                        │
│ Ahmad adalah anak yang ceria dan mudah bergaul. Terus     │
│ berikan dukungan dan semangat untuk perkembangannya.      │
├─────────────────────────────────────────────────────────────┤
│ DOKUMENTASI KEGIATAN SEMESTER INI                           │
│ [Photo 1] [Photo 2] [Photo 3] [Photo 4]                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Jakarta, 20 Desember 2025                                  │
│                                                             │
│ Mengetahui,                    Wali Kelas,                 │
│ Kepala Sekolah PAUD           Guru Pendamping              │
│                                                             │
│                                                             │
│ (Ibu Siti Nurhaliza)          (Ibu Rina Wijaya)          │
│ TTD & Cap                      TTD                         │
└─────────────────────────────────────────────────────────────┘
```

### PDF Generation Component

```typescript
import { jsPDF } from "jspdf";
import "jspdf-autotable";

async function generateReportPDF(reportData: PAUDReport) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(16);
  doc.text("YAYASAN PESANTREN CIPANSOR", 105, 20, { align: "center" });
  doc.setFontSize(14);
  doc.text("LAPORAN PERKEMBANGAN ANAK", 105, 30, { align: "center" });

  // Student info
  doc.setFontSize(12);
  doc.text(`Nama: ${reportData.student.name}`, 20, 50);
  doc.text(`Kelas: ${reportData.class.name}`, 20, 60);

  // Aspects (loop through 6 aspects)
  let y = 80;
  for (const aspect of reportData.aspects) {
    doc.setFontSize(11);
    doc.setFont("bold");
    doc.text(`${aspect.number}. ${aspect.name} - ${aspect.level}`, 20, y);
    y += 10;

    doc.setFont("normal");
    const splitText = doc.splitTextToSize(aspect.narrative, 170);
    doc.text(splitText, 20, y);
    y += splitText.length * 7 + 10;
  }

  // Add photos
  if (reportData.photos?.length > 0) {
    doc.addPage();
    doc.text("DOKUMENTASI KEGIATAN", 20, 20);
    // Add image grid
  }

  // Signatures
  doc.addPage();
  doc.text("Jakarta, " + formatDate(reportData.issueDate), 20, 20);
  doc.text("Kepala Sekolah", 40, 60);
  doc.text("Wali Kelas", 140, 60);

  return doc.output("blob");
}
```

---

## State Management

### Zustand Store for PAUD Module

```typescript
import { create } from "zustand";

interface PAUDStore {
  // Filters state
  filters: AssessmentFilters;
  setFilters: (filters: AssessmentFilters) => void;

  // Current assessment form state (multi-step)
  currentAssessment: Partial<AssessmentFormData>;
  updateCurrentAssessment: (data: Partial<AssessmentFormData>) => void;
  resetCurrentAssessment: () => void;

  // UI state
  selectedAspect: PAUDAspect | null;
  setSelectedAspect: (aspect: PAUDAspect | null) => void;
}

export const usePAUDStore = create<PAUDStore>((set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),

  currentAssessment: {},
  updateCurrentAssessment: (data) =>
    set((state) => ({
      currentAssessment: { ...state.currentAssessment, ...data },
    })),
  resetCurrentAssessment: () => set({ currentAssessment: {} }),

  selectedAspect: null,
  setSelectedAspect: (aspect) => set({ selectedAspect: aspect }),
}));
```

---

## Mobile Responsive Considerations

### Breakpoints

- **Mobile**: < 640px - Single column, stacked forms
- **Tablet**: 640px - 1024px - Two columns, simplified charts
- **Desktop**: > 1024px - Full layout

### Mobile-specific Components

```typescript
// Mobile view for assessment list (card-based)
function AssessmentListMobile({ data }: Props) {
  return (
    <div className="space-y-4">
      {data.map(assessment => (
        <Card key={assessment.id} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{assessment.student.name}</h3>
              <Badge>{assessment.aspect}</Badge>
              <Badge variant="outline">{assessment.level}</Badge>
            </div>
            <Button size="sm" variant="ghost">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {assessment.narrativeText.substring(0, 100)}...
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline">View</Button>
            <Button size="sm" variant="outline">Edit</Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
```

---

## Performance Optimization

### React Query Configuration

```typescript
export const paudQueryConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: true,
};

// Prefetch strategy
export function usePrefetchPAUD() {
  const queryClient = useQueryClient();

  const prefetchAssessments = (studentId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["paud-assessments", studentId],
      queryFn: () => api.paud.getAssessments({ studentId }),
      ...paudQueryConfig,
    });
  };

  return { prefetchAssessments };
}
```

### Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image'

function EvidenceImage({ src, alt }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      width={200}
      height={200}
      className="rounded-lg object-cover"
      loading="lazy"
      placeholder="blur"
      blurDataURL="/placeholder.jpg"
    />
  )
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// Example: AspectCard component test
import { render, screen } from '@testing-library/react'
import { AspectCard } from './AspectCard'

describe('AspectCard', () => {
  it('renders aspect name and level', () => {
    render(
      <AspectCard
        aspect="NAM"
        level="BSH"
        count={8}
      />
    )

    expect(screen.getByText('NAM')).toBeInTheDocument()
    expect(screen.getByText('BSH')).toBeInTheDocument()
    expect(screen.getByText('8 assessments')).toBeInTheDocument()
  })
})
```

### Integration Tests (Playwright)

```typescript
// Example: Assessment creation flow
import { test, expect } from "@playwright/test";

test("create PAUD assessment", async ({ page }) => {
  await page.goto("/paud/assessment/new");

  // Step 1: Student Info
  await page.selectOption('[name="studentId"]', "student-123");
  await page.click('button:has-text("Next")');

  // Step 2: Assessment
  await page.click('input[value="FM"]');
  await page.click('input[value="MB"]');
  await page.fill('textarea[name="narrativeText"]', "Test narrative");
  await page.click('button:has-text("Next")');

  // Step 3: Evidence (skip)
  await page.click('button:has-text("Next")');

  // Step 4: Review & Submit
  await page.click('button:has-text("Submit")');

  await expect(page).toHaveURL("/paud/assessment");
  await expect(page.locator(".toast")).toContainText("Success");
});
```

---

## Accessibility (WCAG 2.1 AA)

### Key Requirements

1. **Keyboard Navigation**: All interactive elements accessible via Tab
2. **Screen Reader**: Proper ARIA labels and roles
3. **Color Contrast**: Minimum 4.5:1 for text
4. **Form Labels**: All inputs have associated labels
5. **Error Messages**: Clear and descriptive

### Implementation Example

```typescript
// Accessible form field
<FormField
  control={form.control}
  name="aspect"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Aspect of Development</FormLabel>
      <Select
        onValueChange={field.onChange}
        defaultValue={field.value}
        aria-label="Select development aspect"
        aria-required="true"
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select aspect" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="NAM">NAM - Nilai Agama & Moral</SelectItem>
          <SelectItem value="FM">FM - Fisik Motorik</SelectItem>
          {/* ... */}
        </SelectContent>
      </Select>
      <FormDescription>
        Choose which aspect you are assessing
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Implementation Timeline

| Page/Feature               | Complexity | Estimated Hours |
| -------------------------- | ---------- | --------------- |
| Assessment List            | Medium     | 8h              |
| Assessment Create/Edit     | High       | 16h             |
| Student Progress Dashboard | High       | 20h             |
| Class Dashboard            | Medium     | 12h             |
| Report Generation          | High       | 16h             |
| Report PDF Export          | Medium     | 8h              |
| Daily Report Integration   | Medium     | 8h              |
| Mobile Responsive          | Medium     | 12h             |
| Testing                    | -          | 16h             |
| **TOTAL**                  | -          | **116 hours**   |

---

_End of PAUD Module Frontend Design_
_Next: Chunk 3 - Tahfidz & Dashboard Enhancement_
