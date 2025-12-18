# Frontend Design - Tahfidz Enhancement & Multi-Unit Dashboard

**Version:** 1.0.0  
**Date:** December 11, 2025  
**References:** enhancement-overview.md, requirements.md  
**Status:** Design Specification

---

## Module Overview - Tahfidz Enhancement

### Target Users
- **Santri/Siswa**: View personal progress, schedule
- **Muhafidz**: Input murojaah, manage simaan exams
- **Musyrif**: Monitor halaqoh performance
- **Admin**: Sanad management, certificate generation

### Pages Summary - Tahfidz
| Page | Route | Priority | Complexity |
|------|-------|----------|------------|
| Murojaah Dashboard | `/tahfidz/murojaah` | P2 | High |
| Murojaah Create | `/tahfidz/murojaah/new` | P2 | Medium |
| Murojaah Analytics | `/tahfidz/murojaah/analytics` | P2 | High |
| Simaan Schedule | `/tahfidz/simaan/schedule` | P2 | Medium |
| Simaan Exam Create | `/tahfidz/simaan/exam/new` | P2 | High |
| Simaan Exam Detail | `/tahfidz/simaan/exam/:id` | P2 | Medium |
| Sanad Management | `/tahfidz/sanad` | P2 | Medium |
| Certificate Generate | `/tahfidz/sanad/certificate/new` | P2 | High |
| Student Tahfidz Profile | `/tahfidz/student/:id` | P2 | High |

---

## Page 1: Murojaah Analytics Dashboard

### Route
`/tahfidz/murojaah/analytics`

### User Stories
- **As a muhafidz**, I want to see murojaah quality trends across halaqoh
- **As a musyrif**, I want to identify students needing extra support
- **As an admin**, I want to see overall murojaah statistics

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Murojaah Analytics Dashboard                     [Export]   │
├─────────────────────────────────────────────────────────────┤
│ Filters: [Halaqoh ▼] [Murojaah Type ▼] [Date Range]       │
├─────────────────────────────────────────────────────────────┤
│ Overview Statistics                                         │
│ ┌─────────────┬─────────────┬─────────────┬──────────────┐ │
│ │ 485 Total   │ 3,256 Pages │ 82% Avg     │ 4.2 Days     │ │
│ │ Records     │ Reviewed    │ Quality     │ Avg Streak   │ │
│ └─────────────┴─────────────┴─────────────┴──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Quality Score Distribution                                  │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Count                                                  │  │
│ │  60 │     ▄▄▄▄                                        │  │
│ │  50 │    ██████▄▄                                     │  │
│ │  40 │   ████████████▄                                 │  │
│ │  30 │  ████████████████▄▄                             │  │
│ │  20 │ ████████████████████▄▄                          │  │
│ │  10 │████████████████████████                         │  │
│ │   0 └──┬───┬───┬───┬───┬───┬───┬───┬───┬───┬──      │  │
│ │      0  10  20  30  40  50  60  70  80  90  100      │  │
│ │                    Quality Score                      │  │
│ └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ Mistake Type Analysis                                       │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Lahin Jali (Obvious)     ███████████████  156 (42%)   │  │
│ │ Lahin Khafi (Hidden)     ████████████      98 (26%)   │  │
│ │ Tajwid Rules             ██████████        85 (23%)   │  │
│ │ Makharij (Articulation)  ████              32 (9%)    │  │
│ └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ Consistency Tracking (Weekly Streak)                        │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Students │                                             │  │
│ │   20+    │ ████ (4 students)                          │  │
│ │  15-20   │ ███████████ (11 students)                  │  │
│ │  10-15   │ ███████████████████ (19 students)          │  │
│ │   5-10   │ ███████████████ (15 students)              │  │
│ │   1-5    │ ████████ (8 students)                      │  │
│ │    0     │ ███ (3 students) ⚠                         │  │
│ └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ Murojaah Type Breakdown                                     │
│ ┌────────────────────────────────────────────────────────┐  │
│ │              Records  Pages   Avg Quality  Avg Time   │  │
│ │ Yaumiyah     215      1,245   85%         20 min      │  │
│ │ Usbu'iyah    185      1,523   80%         35 min      │  │
│ │ Syahriyah     85       488    78%         45 min      │  │
│ └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ Top Performers (Last 30 Days)                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 🥇 Ahmad Fauzi      | 28 sessions | 95% avg quality   │  │
│ │    Halaqoh A        | 245 pages   | 15 day streak     │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ 🥈 Muhammad Ali     | 25 sessions | 92% avg quality   │  │
│ │    Halaqoh B        | 220 pages   | 12 day streak     │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ 🥉 Fatimah Zahra    | 24 sessions | 90% avg quality   │  │
│ │    Halaqoh A        | 215 pages   | 11 day streak     │  │
│ └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ Students Requiring Attention                                │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ⚠ Budi Santoso - No murojaah for 7 days               │  │
│ │   Last: Yaumiyah, Quality: 65%                         │  │
│ │   [View Profile] [Send Reminder]                       │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ ⚠ Siti Aminah - Quality declining (78% → 65%)         │  │
│ │   Common mistakes: Lahin Jali (15 in last 5 sessions) │  │
│ │   [View Profile] [Schedule Extra Session]              │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Implementation
```typescript
export default function MurojaahAnalyticsPage() {
  const { data: overview } = useQuery({
    queryKey: ['murojaah-analytics-overview'],
    queryFn: api.murojaah.getAnalyticsOverview
  })
  
  const { data: qualityDistribution } = useQuery({
    queryKey: ['murojaah-quality-distribution'],
    queryFn: api.murojaah.getQualityDistribution
  })
  
  const { data: mistakePatterns } = useQuery({
    queryKey: ['murojaah-mistake-patterns'],
    queryFn: api.murojaah.getMistakePatterns
  })
  
  return (
    <div className="space-y-6">
      <PageHeader title="Murojaah Analytics" />
      <AnalyticsFilters />
      <OverviewCards data={overview} />
      <QualityDistributionChart data={qualityDistribution} />
      <MistakeAnalysisChart data={mistakePatterns} />
      <ConsistencyTracker data={overview?.streaks} />
      <MurojaahTypeBreakdown data={overview?.byType} />
      <TopPerformers data={overview?.topPerformers} />
      <AttentionRequired data={overview?.needsAttention} />
    </div>
  )
}
```

### Quality Distribution Chart
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

function QualityDistributionChart({ data }: Props) {
  // Group quality scores into bins
  const bins = [
    { range: '0-10', count: 0 },
    { range: '11-20', count: 0 },
    // ... up to 91-100
  ]
  
  data.forEach(score => {
    const binIndex = Math.floor(score / 10)
    bins[binIndex].count++
  })
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quality Score Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart width={600} height={300} data={bins}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="range" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </CardContent>
    </Card>
  )
}
```

---

## Page 2: Murojaah Quick Input

### Route
`/tahfidz/murojaah/new`

### User Stories
- **As a muhafidz**, I want to quickly record murojaah after session
- **As a muhafidz**, I want to log mistakes efficiently

### Layout (Optimized for Mobile)
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back                Quick Murojaah Input          [Save]  │
├─────────────────────────────────────────────────────────────┤
│ Student *                                                   │
│ [Search student.................................]            │
│ 📋 Recent: Ahmad (last session: 2h ago)                    │
│           Fatimah (last session: 1 day ago)                │
├─────────────────────────────────────────────────────────────┤
│ Murojaah Type *                                            │
│ [●] Yaumiyah (Daily)                                       │
│ [ ] Usbu'iyah (Weekly)                                     │
│ [ ] Syahriyah (Monthly)                                    │
├─────────────────────────────────────────────────────────────┤
│ Juz Range *                                                │
│ From: [Juz 29 ▼] [Page 1 ▼]                              │
│ To:   [Juz 30 ▼] [Page 20 ▼]                             │
│ → 40 pages                                                 │
├─────────────────────────────────────────────────────────────┤
│ Duration                                                    │
│ [Start: 08:00] [End: 08:25] → 25 minutes                  │
├─────────────────────────────────────────────────────────────┤
│ Quality Assessment                                          │
│ Overall Quality: [●●●●○] 80%                              │
│ ──────────────────────────────────────                    │
│ 0    20    40    60    80   100                            │
├─────────────────────────────────────────────────────────────┤
│ Mistakes (Optional)                                         │
│ [+ Add Mistake]                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ✗ Lahin Jali | Juz 29:5 | "wa" → "waw"        [×]     │ │
│ │ ✗ Tajwid     | Juz 29:12 | Mad Lazim Mukhaffaf[×]     │ │
│ └────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Notes (Optional)                                            │
│ [...................................................]        │
│ Suggestions:                                                │
│ - Perlu latihan lebih untuk mad lazim                      │
│ - Makhraj huruf "ح" masih perlu perbaikan                  │
│ [Use Suggestion]                                           │
├─────────────────────────────────────────────────────────────┤
│ [Cancel]                                      [Save Record]│
└─────────────────────────────────────────────────────────────┘
```

### Quick Input Component
```typescript
export default function MurojaahQuickInput() {
  const form = useForm<MurojaahInput>({
    resolver: zodResolver(murojaahSchema),
    defaultValues: {
      murojaahType: 'YAUMIYAH',
      qualityScore: 80,
      mistakes: []
    }
  })
  
  const { mutate: createMurojaah, isPending } = useMutation({
    mutationFn: api.murojaah.create,
    onSuccess: () => {
      toast.success('Murojaah recorded')
      router.push('/tahfidz/murojaah')
    }
  })
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(createMurojaah)}>
        <StudentSearch form={form} />
        <MurojaahTypeSelect form={form} />
        <JuzRangePicker form={form} />
        <DurationInput form={form} />
        <QualitySlider form={form} />
        <MistakeList form={form} />
        <NotesField form={form} />
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button">Cancel</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Record'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

---

## Page 3: Simaan Exam Management

### Route
`/tahfidz/simaan/exam/new`

### User Stories
- **As a muhafidz**, I want to schedule and conduct simaan exams
- **As a muhafidz**, I want to assign multiple examiners
- **As a santri**, I want to see my scheduled simaan

### Layout (Marathon Exam - Multi Session)
```
┌─────────────────────────────────────────────────────────────┐
│ New Simaan Exam                              [Save] [Cancel]│
├─────────────────────────────────────────────────────────────┤
│ Exam Type *                                                 │
│ [ ] Bi'n-Nazhr (With Mushaf)                               │
│ [ ] Bil-Ghaib (Pure Memory)                                │
│ [ ] Tahdir (Prepared Section)                              │
│ [ ] Tasmi' (Random Testing)                                │
│ [●] Marathon Khatam 30 Juz                                 │
├─────────────────────────────────────────────────────────────┤
│ Student *                                                   │
│ [Select student who will be examined.......▼]              │
├─────────────────────────────────────────────────────────────┤
│ Marathon Configuration                                      │
│ Total Sessions: [6] sessions                               │
│ Juz per Session: [5] juz                                   │
│                                                             │
│ Session Schedule:                                           │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Session 1: 2025-12-15 | Juz 1-5    | [Edit Schedule]  │ │
│ │ Session 2: 2025-12-16 | Juz 6-10   | [Edit Schedule]  │ │
│ │ Session 3: 2025-12-17 | Juz 11-15  | [Edit Schedule]  │ │
│ │ Session 4: 2025-12-18 | Juz 16-20  | [Edit Schedule]  │ │
│ │ Session 5: 2025-12-19 | Juz 21-25  | [Edit Schedule]  │ │
│ │ Session 6: 2025-12-20 | Juz 26-30  | [Edit Schedule]  │ │
│ └────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Examination Panel *                                         │
│ Primary Examiner: [Ustadz Muhammad Ali........▼]           │
│                                                             │
│ Additional Examiners:                                       │
│ [+ Add Examiner]                                           │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ • Ustadz Ahmad Fauzi                           [Remove]│ │
│ │ • Ustadz Abdullah                              [Remove]│ │
│ └────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Location & Notes                                            │
│ Location: [Musholla Utama...............................]   │
│ Notes:    [.................................................]│
│                                                             │
│ [Cancel]                            [Create Exam Schedule] │
└─────────────────────────────────────────────────────────────┘
```

### Simaan Scoring Interface (During Exam)
```
┌─────────────────────────────────────────────────────────────┐
│ Simaan Exam - Session 1/6                          [Submit] │
│ Ahmad Fauzi | Juz 1-5 | 15 December 2025                   │
├─────────────────────────────────────────────────────────────┤
│ Scoring Criteria                                            │
│                                                             │
│ Overall Score      [●●●●●●●●●○] 90/100                    │
│ Tajwid             [●●●●●●●●●○] 88/100                    │
│ Fashohah           [●●●●●●●●●●] 92/100                    │
│ Fluency            [●●●●●●●●○○] 85/100                    │
│ Makharij           [●●●●●●●●●○] 90/100                    │
├─────────────────────────────────────────────────────────────┤
│ Detailed Assessment per Juz                                 │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Juz 1  [●●●●●●●●●○] 90% | 2 mistakes    [View]        │ │
│ │ Juz 2  [●●●●●●●●●●] 95% | 1 mistake     [View]        │ │
│ │ Juz 3  [●●●●●●●●○○] 85% | 4 mistakes    [View]        │ │
│ │ Juz 4  [●●●●●●●●●○] 88% | 2 mistakes    [View]        │ │
│ │ Juz 5  [●●●●●●●●●●] 92% | 1 mistake     [View]        │ │
│ └────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Examiner Notes                                              │
│ [Examiner: Ustadz Muhammad Ali...........................]  │
│ Bacaan sangat baik, hanya sedikit kesalahan pada mad      │
│ lazim di Juz 3. Fashohah excellent, perlu perhatikan...   │
│                                                             │
│ Strengths:                                                  │
│ • Tajwid rules mastered                                    │
│ • Fluent recitation                                        │
│                                                             │
│ Areas for Improvement:                                      │
│ • Mad Lazim rules (Juz 3)                                  │
│ • Pause points (waqaf)                                     │
├─────────────────────────────────────────────────────────────┤
│ Session Result                                              │
│ [○] Pass    [○] Pass with Notes    [○] Need Improvement   │
│                                                             │
│ [Cancel]                              [Submit & Continue →]│
└─────────────────────────────────────────────────────────────┘
```

---

## Page 4: Sanad & Certificate Management

### Route
`/tahfidz/sanad/certificate/new`

### User Stories
- **As an admin**, I want to generate certificates after exam completion
- **As a student**, I want to download my certificate
- **As a verifier**, I want to verify certificate authenticity

### Certificate Generation Form
```
┌─────────────────────────────────────────────────────────────┐
│ Generate Sanad Certificate                  [Generate] [×]  │
├─────────────────────────────────────────────────────────────┤
│ Certificate Type *                                          │
│ [●] Khatam 30 Juz                                          │
│ [ ] Ijazah Sanad                                           │
│ [ ] Ijazah Qira'at                                         │
├─────────────────────────────────────────────────────────────┤
│ Student *                                                   │
│ [Select student................................▼]           │
│ → Verified: Completed Marathon Simaan (20 Dec 2025)       │
├─────────────────────────────────────────────────────────────┤
│ Simaan Exam Reference *                                     │
│ [Marathon Exam - 15-20 Dec 2025..............▼]            │
│ → Score: 90% | Status: PASSED ✓                           │
├─────────────────────────────────────────────────────────────┤
│ Certificate Details                                         │
│ Certificate Number: [Auto: KT-2025-12-001]                │
│ Issue Date: [20 December 2025..........📅]                │
│                                                             │
│ Riwayat: [Hafs 'an 'Ashim........▼]                       │
├─────────────────────────────────────────────────────────────┤
│ Issuer Information                                          │
│ Issuer Name:  [Ustadz Dr. Muhammad Ali, M.A............]  │
│ Issuer Title: [Muhafidz & Pengampu Tahfidz.............]  │
│                                                             │
│ Sanad Chain:                                                │
│ [+ Add Sanad Link]                                         │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 1. Ustadz Dr. Muhammad Ali ← Syaikh Abdullah Al-Azhar │ │
│ │ 2. Syaikh Abdullah ← Syaikh Muhammad Al-Husaini       │ │
│ │ 3. Syaikh Muhammad ← ... (chain continues)            │ │
│ │ [Edit Chain]                                           │ │
│ └────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Certificate Template                                        │
│ [Template: Official Khatam 30 Juz.........▼]              │
│ [Preview Template]                                         │
├─────────────────────────────────────────────────────────────┤
│ [Cancel]                    [Generate Certificate & PDF]   │
└─────────────────────────────────────────────────────────────┘
```

### Certificate Preview (PDF Output)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ             │
│                                                             │
│              YAYASAN PESANTREN CIPANSOR                     │
│                   SMA AL-QUR'AN CIPANSOR                    │
│                                                             │
│                  CERTIFICATE OF COMPLETION                  │
│                      KHATAM 30 JUZ                          │
│                                                             │
│        Certificate No: KT-2025-12-001                       │
│                                                             │
│   This is to certify that                                   │
│                                                             │
│                    AHMAD FAUZI                              │
│                                                             │
│   Has successfully completed the memorization of            │
│   the entire Holy Qur'an (30 Juz) with the riwayat        │
│   of Hafs 'an 'Ashim, demonstrating excellence in          │
│   Tajwid, Fashohah, and Makharij.                          │
│                                                             │
│   Examination conducted from 15-20 December 2025            │
│   Final Score: 90/100 - PASSED                             │
│                                                             │
│   Sanad Chain: Through Ustadz Dr. Muhammad Ali, M.A.       │
│                                                             │
│   May Allah preserve this noble achievement and            │
│   grant barakah in spreading the knowledge of Qur'an.      │
│                                                             │
│              Jakarta, 20 December 2025                      │
│                                                             │
│   ______________________    ______________________          │
│   Head of Institution       Chief Muhafidz                  │
│   (Dr. H. Abdullah, M.A.)   (Ustadz Muhammad Ali, M.A.)    │
│                                                             │
│   [QR Code]                 [Official Seal]                │
│   Scan to verify                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Overview - Multi-Unit Dashboard

### Target Users
- **Yayasan Admin**: Consolidated view across all units
- **Kepala Yayasan**: Executive KPIs and reports
- **Unit Admins**: Benchmark against other units

### Pages Summary - Dashboard
| Page | Route | Priority | Complexity |
|------|-------|----------|------------|
| Executive Dashboard | `/dashboard/executive` | P3 | High |
| Unit Comparison | `/dashboard/comparison` | P3 | High |
| Realtime Metrics | `/dashboard/realtime` | P3 | High |
| Reports Generator | `/dashboard/reports` | P3 | Medium |
| Alert Configuration | `/dashboard/alerts` | P3 | Medium |

---

## Page 5: Executive Dashboard (Yayasan Level)

### Route
`/dashboard/executive`

### User Stories
- **As yayasan admin**, I want consolidated metrics across all units
- **As kepala yayasan**, I want to see trends and comparisons
- **As board member**, I want exportable reports for meetings

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Yayasan Executive Dashboard          [Refresh] [Export PDF]│
│ Last Updated: 2 minutes ago                    Dec 11, 2025│
├─────────────────────────────────────────────────────────────┤
│ Quick Filters: [Academic Year: 2024/2025 ▼] [All Units ▼] │
├─────────────────────────────────────────────────────────────┤
│ Foundation Overview                                         │
│ ┌──────────────┬──────────────┬──────────────┬────────────┐│
│ │ 1,245        │ 5            │ 142          │ Rp 12.5 M  ││
│ │ Total        │ Units        │ Teachers     │ Monthly    ││
│ │ Students     │ Active       │ Active       │ Revenue    ││
│ └──────────────┴──────────────┴──────────────┴────────────┘│
├─────────────────────────────────────────────────────────────┤
│ Students per Unit (Live)                                    │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ PAUD           ████████████         125 (10%)          │  │
│ │ TK Qur'an      ██████████           98 (8%)            │  │
│ │ SD IT          ████████████████████ 385 (31%)          │  │
│ │ SMP IT         ██████████████████   342 (27%)          │  │
│ │ SMA Al-Qur'an  ██████████████       295 (24%)          │  │
│ └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ Key Performance Indicators                                  │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Attendance Rate (Last 30 Days)                         │  │
│ │ PAUD: 94% ████████████████████▌                        │  │
│ │ SD IT: 92% ███████████████████▍                        │  │
│ │ SMP IT: 89% █████████████████▊                         │  │
│ │ SMA: 91% ██████████████████▎                           │  │
│ │ → Trend: +2% from last month                           │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Tahfidz Progress (Cumulative)                          │  │
│ │ Total Hafalan: 2,456 Juz completed                     │  │
│ │ This Month: +124 Juz                                   │  │
│ │                                                         │  │
│ │ By Unit:                                                │  │
│ │ SMA Al-Qur'an: 1,245 Juz (51%) - Target: 30 Juz/santri│  │
│ │ SMP IT: 856 Juz (35%) - Target: 15 Juz/santri         │  │
│ │ SD IT: 355 Juz (14%) - Target: 3-5 Juz/siswa          │  │
│ └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ Financial Overview                                          │
│ ┌───────────┬───────────┬───────────┬───────────┐          │
│ │ Income    │ Expenses  │ Net       │ Collection││
│ │ Rp 12.5M  │ Rp 9.8M   │ Rp 2.7M   │ Rate 87%  ││
│ │ ▲ +8%     │ ▼ -3%     │ ▲ +15%    │ ▲ +5%     ││
│ └───────────┴───────────┴───────────┴───────────┘          │
├─────────────────────────────────────────────────────────────┤
│ Recent Activities & Alerts                                  │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 🔴 CRITICAL: SMP IT attendance below 90% for 3 days    │  │
│ │    [View Details] [Notify Admin]                       │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ 🟡 WARNING: PAUD A1 - 5 students missing assessments  │  │
│ │    [View Details]                                       │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ ✅ SUCCESS: December fee collection completed 95%      │  │
│ │    Target reached 5 days early                         │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Implementation
```typescript
'use client'

export default function ExecutiveDashboard() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['executive-overview'],
    queryFn: api.dashboard.getExecutiveOverview,
    refetchInterval: 2 * 60 * 1000 // Refresh every 2 minutes
  })
  
  const { data: realtime } = useQuery({
    queryKey: ['realtime-metrics'],
    queryFn: api.dashboard.getRealtimeMetrics,
    refetchInterval: 30 * 1000 // Refresh every 30 seconds
  })
  
  // WebSocket for true real-time updates
  useWebSocket('/ws/dashboard', {
    onMessage: (data) => {
      queryClient.setQueryData(['realtime-metrics'], data)
    }
  })
  
  if (isLoading) return <DashboardSkeleton />
  
  return (
    <div className="space-y-6">
      <DashboardHeader />
      <QuickFilters />
      <FoundationOverview data={overview} />
      <StudentsDistribution data={overview?.studentsByUnit} />
      <KPICards data={overview?.kpis} />
      <FinancialOverview data={overview?.financial} />
      <RecentActivities data={overview?.activities} />
      <AlertsList data={overview?.alerts} />
    </div>
  )
}
```

### Real-time Update Hook
```typescript
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'

export function useRealtimeDashboard() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL!)
    
    socket.on('dashboard:update', (data) => {
      queryClient.setQueryData(['realtime-metrics'], data)
    })
    
    socket.on('alert:new', (alert) => {
      queryClient.setQueryData(['alerts'], (old: any[]) => 
        [alert, ...old]
      )
      
      // Show toast notification
      toast.info(alert.message, {
        action: {
          label: 'View',
          onClick: () => router.push(`/dashboard/alerts/${alert.id}`)
        }
      })
    })
    
    return () => {
      socket.disconnect()
    }
  }, [queryClient])
}
```

---

## Page 6: Unit Comparison Dashboard

### Route
`/dashboard/comparison`

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Unit Performance Comparison                      [Export]   │
├─────────────────────────────────────────────────────────────┤
│ Select Metrics: [☑ Attendance] [☑ Academic] [☑ Tahfidz]    │
│                [☑ Financial] [☐ Behavior]                   │
│ Compare Period: [This Month ▼] vs [Last Month ▼]          │
├─────────────────────────────────────────────────────────────┤
│ Attendance Comparison                                       │
│ ┌────────────────────────────────────────────────────────┐  │
│ │         PAUD   TK    SD IT  SMP IT  SMA    Foundation  │  │
│ │ 100%    ┊      ┊      ┊      ┊      ┊                 │  │
│ │  95%  ──┼────▲─┼────▲─┼────▲─┼───▲──┼────▲──         │  │
│ │  90%    ●      ●      ●      ●      ●      ●  Current │  │
│ │  85%    ○      ○      ○      ○      ○      ○  Previous│  │
│ │  80%    ┊      ┊      ┊      ┊      ┊                 │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│ Detailed Metrics Table                                      │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Unit    │Attend│Academic│Tahfidz│Finance│Overall Rank ││  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ SMA AQ  │ 91%  │ 85%    │ 92%   │ 95%   │ 🥇 1st      ││  │
│ │ PAUD    │ 94%  │ 88%    │ N/A   │ 89%   │ 🥈 2nd      ││  │
│ │ SD IT   │ 92%  │ 82%    │ 78%   │ 91%   │ 🥉 3rd      ││  │
│ │ SMP IT  │ 89%  │ 80%    │ 85%   │ 88%   │ 4th         ││  │
│ │ TK Qur  │ 93%  │ 85%    │ N/A   │ 85%   │ 5th         ││  │
│ └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ Best Practices & Insights                                   │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 💡 SMA Al-Qur'an leads in tahfidz (92%)                │  │
│ │    Strategy: Daily murojaah tracking + weekly rewards  │  │
│ │    [View Details] [Replicate to Other Units]           │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ 💡 PAUD highest attendance (94%)                       │  │
│ │    Strategy: Parent engagement via daily reports       │  │
│ │    [View Details] [Replicate to Other Units]           │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## State Management - Tahfidz & Dashboard

### Zustand Stores
```typescript
// Tahfidz Store
interface TahfidzStore {
  // Murojaah state
  selectedMurojaahType: MurojaahType
  setMurojaahType: (type: MurojaahType) => void
  
  // Simaan state
  currentExam: Partial<SimaanExam>
  updateCurrentExam: (data: Partial<SimaanExam>) => void
  
  // Analytics filters
  analyticsFilters: AnalyticsFilters
  setAnalyticsFilters: (filters: AnalyticsFilters) => void
}

export const useTahfidzStore = create<TahfidzStore>((set) => ({
  selectedMurojaahType: 'YAUMIYAH',
  setMurojaahType: (type) => set({ selectedMurojaahType: type }),
  
  currentExam: {},
  updateCurrentExam: (data) => 
    set((state) => ({ 
      currentExam: { ...state.currentExam, ...data } 
    })),
  
  analyticsFilters: {},
  setAnalyticsFilters: (filters) => set({ analyticsFilters: filters }),
}))

// Dashboard Store
interface DashboardStore {
  // Unit selection
  selectedUnits: string[]
  toggleUnit: (unitId: string) => void
  
  // Time range
  dateRange: { from: Date; to: Date }
  setDateRange: (range: { from: Date; to: Date }) => void
  
  // Realtime connection
  isConnected: boolean
  setConnected: (connected: boolean) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  selectedUnits: [],
  toggleUnit: (unitId) => 
    set((state) => ({
      selectedUnits: state.selectedUnits.includes(unitId)
        ? state.selectedUnits.filter(id => id !== unitId)
        : [...state.selectedUnits, unitId]
    })),
  
  dateRange: {
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  },
  setDateRange: (range) => set({ dateRange: range }),
  
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),
}))
```

---

## Performance Optimization

### Data Fetching Strategy
```typescript
// Prefetch related data
export function usePrefetchTahfidz() {
  const queryClient = useQueryClient()
  
  const prefetchStudentData = (studentId: string) => {
    // Prefetch related queries in parallel
    Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['murojaah-summary', studentId],
        queryFn: () => api.murojaah.getStudentSummary(studentId)
      }),
      queryClient.prefetchQuery({
        queryKey: ['simaan-history', studentId],
        queryFn: () => api.simaan.getStudentHistory(studentId)
      }),
      queryClient.prefetchQuery({
        queryKey: ['tahfidz-progress', studentId],
        queryFn: () => api.tahfidz.getProgress(studentId)
      })
    ])
  }
  
  return { prefetchStudentData }
}
```

### Chart Performance
```typescript
// Use React.memo for expensive chart components
export const MurojaahQualityChart = React.memo(({ data }: Props) => {
  // Memoize chart data transformation
  const chartData = useMemo(() => 
    transformDataForChart(data),
    [data]
  )
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        {/* Chart config */}
      </LineChart>
    </ResponsiveContainer>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return prevProps.data === nextProps.data
})
```

---

## Implementation Timeline

### Tahfidz Enhancement
| Feature | Complexity | Hours |
|---------|------------|-------|
| Murojaah Analytics Dashboard | High | 20h |
| Murojaah Quick Input | Medium | 8h |
| Simaan Exam Management | High | 24h |
| Simaan Scoring Interface | High | 16h |
| Sanad Management | Medium | 12h |
| Certificate Generation | High | 16h |
| Student Tahfidz Profile | High | 16h |
| **Subtotal** | - | **112h** |

### Multi-Unit Dashboard
| Feature | Complexity | Hours |
|---------|------------|-------|
| Executive Dashboard | High | 24h |
| Unit Comparison | High | 20h |
| Realtime Metrics (WebSocket) | High | 16h |
| Reports Generator | Medium | 12h |
| Alert Configuration | Medium | 8h |
| Export & PDF | Medium | 8h |
| **Subtotal** | - | **88h** |

### **Total Tahfidz + Dashboard**: **200 hours**

---

*End of Tahfidz Enhancement & Dashboard Design*
*Next: Chunk 4 - Integration Workflows & Testing*
