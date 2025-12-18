# Integration Workflows & Testing Plan

**Version:** 1.0.0  
**Date:** December 11, 2025  
**References:** All enhancement documents  
**Status:** Integration Specification

---

## 1. End-to-End Integration Workflows

### Workflow 1: PAUD Daily Assessment & Report to Parent

**Actors:** Guru PAUD, System, Parent  
**Frequency:** Daily  
**Priority:** P1 (Critical)

#### Flow Diagram
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Guru    │    │  System  │    │  Parent  │    │ External │
│  PAUD    │    │  Backend │    │  Portal  │    │ Services │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ 1. Input      │               │               │
     │  Assessment   │               │               │
     ├──────────────>│               │               │
     │               │ 2. Validate   │               │
     │               │  & Save       │               │
     │               ├───────┐       │               │
     │               │       │       │               │
     │               │<──────┘       │               │
     │               │               │               │
     │               │ 3. Trigger    │               │
     │               │  Daily Report │               │
     │               ├───────────────┤               │
     │               │               │               │
     │ 4. Input      │               │               │
     │  Daily Report │               │               │
     ├──────────────>│               │               │
     │               │ 5. Generate   │               │
     │               │  Notification │               │
     │               ├───────────────┼──────────────>│
     │               │               │  6. WhatsApp  │
     │               │               │  Push, Email  │
     │               │               │               │
     │               │ 7. Notify     │               │
     │               │  Parent       │               │
     │               ├──────────────>│               │
     │               │               │ 8. View       │
     │               │               │  Report       │
     │               │               ├──────┐        │
     │               │               │      │        │
     │               │               │<─────┘        │
     │               │               │               │
     │               │ 9. Confirm    │               │
     │               │  Read         │               │
     │               │<──────────────┤               │
     │               │               │               │
     │ 10. View      │               │               │
     │  Confirmation │               │               │
     │<──────────────┤               │               │
     └───────────────┴───────────────┴───────────────┘
```

#### Implementation Steps

**Step 1: Assessment Input (Frontend)**
```typescript
// Component: /paud/assessment/new
async function handleAssessmentSubmit(data: AssessmentInput) {
  try {
    // 1. Create assessment
    const assessment = await api.paud.createAssessment(data)
    
    // 2. Upload evidence files
    if (data.evidences.length > 0) {
      await api.paud.uploadEvidence(assessment.id, data.evidences)
    }
    
    // 3. Trigger daily report check
    await api.daily.checkTodayReport(data.studentId)
    
    toast.success('Assessment saved')
    router.push('/paud/assessment')
  } catch (error) {
    toast.error('Failed to save assessment')
  }
}
```

**Step 2: Backend Validation & Save**
```typescript
// apps/api/src/modules/paud-assessment/paud-assessment.service.ts
async function createAssessment(input: CreateAssessmentInput) {
  // Validate student exists and is active
  const student = await prisma.student.findUnique({
    where: { id: input.studentId, status: 'active' }
  })
  
  if (!student) throw new Error('Student not found or inactive')
  
  // Check for duplicate assessment today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const existing = await prisma.pAUDAssessment.findFirst({
    where: {
      studentId: input.studentId,
      aspect: input.aspect,
      assessmentDate: { gte: today }
    }
  })
  
  if (existing) {
    throw new Error('Assessment for this aspect already exists today')
  }
  
  // Create assessment
  const assessment = await prisma.pAUDAssessment.create({
    data: {
      studentId: input.studentId,
      aspect: input.aspect,
      achievementLevel: input.achievementLevel,
      narrativeText: input.narrativeText,
      teacherNotes: input.teacherNotes,
      recommendations: input.recommendations,
      recordedById: input.recordedById,
      assessmentDate: new Date()
    }
  })
  
  // Emit event for daily report trigger
  eventEmitter.emit('assessment:created', {
    studentId: input.studentId,
    assessmentId: assessment.id
  })
  
  return assessment
}
```

**Step 3: Daily Report Auto-Generation Trigger**
```typescript
// apps/api/src/jobs/daily-report-trigger.job.ts
eventEmitter.on('assessment:created', async ({ studentId }) => {
  // Check if daily report exists for today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const report = await prisma.dailyStudentReport.findFirst({
    where: {
      studentId,
      reportDate: { gte: today }
    }
  })
  
  if (!report) {
    // Auto-create draft report
    await prisma.dailyStudentReport.create({
      data: {
        studentId,
        reportDate: new Date(),
        status: 'DRAFT',
        unitId: student.unitId,
        academicYearId: student.academicYearId
      }
    })
  }
})
```

**Step 4: Notification to Parent**
```typescript
// apps/api/src/modules/daily-report/daily-report.service.ts
async function finalizeReport(reportId: string) {
  const report = await prisma.dailyStudentReport.update({
    where: { id: reportId },
    data: { status: 'FINALIZED' },
    include: {
      student: {
        include: {
          parent: { include: { user: true } }
        }
      }
    }
  })
  
  // Send notifications in parallel
  await Promise.all([
    // Push notification
    notificationService.sendPush({
      userId: report.student.parent.userId,
      title: 'Daily Report Available',
      body: `Laporan harian ${report.student.user.name}`,
      data: { reportId: report.id }
    }),
    
    // WhatsApp
    whatsappService.sendMessage({
      to: report.student.parent.phoneNumber,
      template: 'daily_report',
      params: {
        studentName: report.student.user.name,
        date: formatDate(report.reportDate),
        link: `${config.frontendUrl}/parent/daily-report/${report.id}`
      }
    }),
    
    // Email (optional)
    emailService.send({
      to: report.student.parent.user.email,
      subject: `Laporan Harian ${report.student.user.name}`,
      template: 'daily-report-email',
      data: report
    })
  ])
  
  return report
}
```

**Step 5: Parent Confirmation**
```typescript
// Parent Portal Component
function DailyReportView({ reportId }: Props) {
  const { data: report } = useQuery({
    queryKey: ['daily-report', reportId],
    queryFn: () => api.daily.getReport(reportId)
  })
  
  const { mutate: confirmRead } = useMutation({
    mutationFn: () => api.daily.confirmRead(reportId),
    onSuccess: () => {
      toast.success('Terima kasih sudah membaca laporan')
    }
  })
  
  useEffect(() => {
    // Auto-confirm after 3 seconds viewing
    const timer = setTimeout(() => {
      if (!report?.parentReadAt) {
        confirmRead()
      }
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [report])
  
  return <ReportDisplay report={report} />
}
```

---

### Workflow 2: Tahfidz Murojaah → Simaan → Sanad

**Actors:** Santri, Muhafidz, System, Admin  
**Frequency:** Continuous → Milestone  
**Priority:** P2

#### Flow Diagram
```
PHASE 1: Daily Murojaah
  Muhafidz → Input Murojaah Record
            ↓
  System → Calculate Quality Trend
            ↓
  System → Check Readiness for Simaan
            ↓
  System → Alert when quality threshold met

PHASE 2: Simaan Exam
  Admin → Schedule Simaan (Marathon or Standard)
            ↓
  System → Notify Santri & Examiners
            ↓
  Examiners → Conduct Exam & Score
            ↓
  System → Aggregate Scores
            ↓
  System → Determine Pass/Fail
            ↓
  [IF PASS] → Trigger Sanad Flow
  [IF FAIL] → Schedule Remedial

PHASE 3: Sanad & Certificate
  Admin → Verify Simaan Results
            ↓
  Admin → Input Sanad Chain
            ↓
  System → Generate Certificate
            ↓
  System → Store PDF & QR Code
            ↓
  System → Notify Santri & Parent
            ↓
  Print & Ceremonial Distribution
```

#### Implementation Steps

**Step 1: Murojaah Quality Tracking**
```typescript
// apps/api/src/modules/murojaah/murojaah.service.ts
async function analyzeMurojaahReadiness(studentId: string) {
  // Get last 30 murojaah records
  const records = await prisma.murojaahRecord.findMany({
    where: { studentId },
    orderBy: { murojaahDate: 'desc' },
    take: 30
  })
  
  if (records.length < 20) {
    return {
      ready: false,
      reason: 'Insufficient murojaah records (min 20)',
      progress: records.length / 20
    }
  }
  
  // Calculate metrics
  const avgQuality = records.reduce((sum, r) => sum + r.qualityScore, 0) / records.length
  const consistency = calculateConsistencyScore(records)
  const mistakeRate = calculateMistakeRate(records)
  
  // Readiness criteria
  const ready = avgQuality >= 80 && consistency >= 0.7 && mistakeRate < 0.1
  
  return {
    ready,
    avgQuality,
    consistency,
    mistakeRate,
    recommendation: ready 
      ? 'Ready for Simaan exam'
      : 'Continue daily murojaah, focus on consistency'
  }
}
```

**Step 2: Auto-Alert for Simaan Readiness**
```typescript
// Background job (daily)
async function checkSimaanReadiness() {
  // Get all active tahfidz students
  const students = await prisma.tahfidzEnrollment.findMany({
    where: { status: 'ACTIVE' },
    include: { student: true }
  })
  
  for (const enrollment of students) {
    const readiness = await murojaahService.analyzeMurojaahReadiness(
      enrollment.studentId
    )
    
    if (readiness.ready) {
      // Check if already has pending simaan
      const pendingSimaan = await prisma.simaanSchedule.findFirst({
        where: {
          studentId: enrollment.studentId,
          status: { in: ['SCHEDULED', 'CONFIRMED'] }
        }
      })
      
      if (!pendingSimaan) {
        // Create alert for admin
        await prisma.dashboardAlert.create({
          data: {
            metricType: 'SIMAAN_READINESS',
            message: `${enrollment.student.user.name} ready for Simaan`,
            severity: 'INFO',
            recipients: [enrollment.halaqoh?.muhafidz_id]
          }
        })
      }
    }
  }
}
```

**Step 3: Simaan Scheduling & Notification**
```typescript
async function scheduleSimaanExam(input: ScheduleSimaanInput) {
  // Create schedule record
  const schedule = await prisma.simaanSchedule.create({
    data: {
      studentId: input.studentId,
      simaanType: input.simaanType,
      scheduledDate: input.scheduledDate,
      status: 'SCHEDULED'
    },
    include: {
      student: { include: { user: true, parent: true } }
    }
  })
  
  // Assign examiners
  for (const examinerId of input.examinerIds) {
    await prisma.simaanScheduleExaminer.create({
      data: {
        scheduleId: schedule.id,
        examinerId
      }
    })
  }
  
  // Send notifications
  await Promise.all([
    // Notify student
    notificationService.sendPush({
      userId: schedule.student.userId,
      title: 'Simaan Exam Scheduled',
      body: `Your simaan exam is scheduled for ${formatDate(schedule.scheduledDate)}`
    }),
    
    // Notify parent
    whatsappService.sendMessage({
      to: schedule.student.parent.phoneNumber,
      template: 'simaan_scheduled',
      params: {
        studentName: schedule.student.user.name,
        date: formatDate(schedule.scheduledDate),
        type: schedule.simaanType
      }
    }),
    
    // Notify examiners
    ...input.examinerIds.map(id => 
      notificationService.sendPush({
        userId: id,
        title: 'New Simaan Assignment',
        body: `You are assigned as examiner for ${schedule.student.user.name}`
      })
    )
  ])
  
  return schedule
}
```

**Step 4: Simaan Scoring & Pass Determination**
```typescript
async function submitSimaanScores(examId: string, scores: SimaanScores) {
  const exam = await prisma.simaanExam.update({
    where: { id: examId },
    data: {
      overallScore: scores.overall,
      tajwidScore: scores.tajwid,
      fashohaScore: scores.fashohah,
      fluencyScore: scores.fluency,
      makhrijScore: scores.makhrij,
      examinerNotes: scores.notes,
      passed: scores.overall >= 75, // Pass threshold
      status: 'COMPLETED'
    },
    include: {
      student: { include: { user: true } }
    }
  })
  
  // If passed and is khatam 30 juz exam, trigger sanad flow
  if (exam.passed && exam.simaanType === 'MARATHON') {
    await triggerSanadCertificateFlow(exam)
  }
  
  // Send result notification
  await notificationService.sendPush({
    userId: exam.student.userId,
    title: exam.passed ? 'Simaan Passed! 🎉' : 'Simaan Result Available',
    body: `Your score: ${exam.overallScore}/100`
  })
  
  return exam
}
```

**Step 5: Sanad Certificate Generation**
```typescript
async function generateSanadCertificate(input: CertificateInput) {
  // Generate certificate number
  const certificateNumber = await generateCertificateNumber('KT', input.studentId)
  
  // Create certificate record
  const certificate = await prisma.sanadCertificate.create({
    data: {
      certificateNumber,
      certificateType: input.certificateType,
      studentId: input.studentId,
      sanadRecordId: input.sanadRecordId,
      simaanExamId: input.simaanExamId,
      issuedDate: new Date(),
      issuerName: input.issuerName,
      issuerTitle: input.issuerTitle,
      riwayat: input.riwayat
    },
    include: {
      student: { include: { user: true } },
      simaanExam: true
    }
  })
  
  // Generate PDF
  const pdfBuffer = await generateCertificatePDF(certificate)
  
  // Upload to storage
  const pdfUrl = await storageService.upload({
    filename: `sanad-${certificateNumber}.pdf`,
    buffer: pdfBuffer,
    contentType: 'application/pdf'
  })
  
  // Generate QR code for verification
  const qrCodeData = JSON.stringify({
    number: certificateNumber,
    type: certificate.certificateType,
    student: certificate.student.user.name,
    date: certificate.issuedDate
  })
  
  // Update certificate with PDF URL and QR data
  await prisma.sanadCertificate.update({
    where: { id: certificate.id },
    data: {
      certificatePdfUrl: pdfUrl,
      qrCodeData
    }
  })
  
  // Notify student and parent
  await Promise.all([
    notificationService.sendPush({
      userId: certificate.student.userId,
      title: 'Certificate Ready! 🎓',
      body: 'Your Sanad certificate is ready for download'
    }),
    
    emailService.send({
      to: certificate.student.user.email,
      subject: 'Sanad Certificate - Yayasan Pesantren Cipansor',
      template: 'sanad-certificate',
      attachments: [{
        filename: `certificate-${certificateNumber}.pdf`,
        path: pdfUrl
      }]
    })
  ])
  
  return certificate
}
```

---

### Workflow 3: Multi-Unit Dashboard Real-time Updates

**Actors:** Yayasan Admin, System  
**Frequency:** Real-time (< 1 min latency)  
**Priority:** P3

#### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │ Executive        │      │ Unit Comparison  │            │
│  │ Dashboard        │      │ Dashboard        │            │
│  └────────┬─────────┘      └────────┬─────────┘            │
│           │ WebSocket/SSE           │                       │
└───────────┼─────────────────────────┼───────────────────────┘
            │                         │
            ↓                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Server (Express)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ WebSocket/SSE Handler                                 │  │
│  │ - Maintain client connections                         │  │
│  │ - Subscribe to Redis Pub/Sub                          │  │
│  │ - Broadcast updates to clients                        │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Redis Pub/Sub                            │
│  Channels:                                                  │
│  - dashboard:metrics:update                                 │
│  - dashboard:alert:new                                      │
│  - dashboard:unit:${unitId}:update                          │
└───────────────────────────┬─────────────────────────────────┘
                            ↑
                            │ Publish events
┌───────────────────────────┴─────────────────────────────────┐
│                    Background Jobs                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Metric Aggregation Job (every 1 minute)              │  │
│  │ - Aggregate student count, attendance, etc.          │  │
│  │ - Calculate KPIs                                      │  │
│  │ - Publish to Redis                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Alert Checker Job (every 30 seconds)                 │  │
│  │ - Check thresholds                                    │  │
│  │ - Create alerts if needed                             │  │
│  │ - Publish to Redis                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Implementation

**Server-Side WebSocket Handler**
```typescript
// apps/api/src/lib/websocket.ts
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'

export function setupWebSocket(httpServer: Server) {
  const io = new Server(httpServer, {
    cors: { origin: config.frontendUrl }
  })
  
  // Redis adapter for multi-server scaling
  const pubClient = createClient({ url: config.redisUrl })
  const subClient = pubClient.duplicate()
  
  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient))
  })
  
  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token
    try {
      const user = await verifyJWT(token)
      socket.data.user = user
      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })
  
  // Connection handler
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.data.user.id)
    
    // Join room based on user role
    if (socket.data.user.role === 'YAYASAN_ADMIN') {
      socket.join('yayasan:dashboard')
    } else if (socket.data.user.unitId) {
      socket.join(`unit:${socket.data.user.unitId}:dashboard`)
    }
    
    // Subscribe to dashboard updates
    socket.on('dashboard:subscribe', (options) => {
      const { unitIds, metrics } = options
      
      unitIds?.forEach(unitId => {
        socket.join(`unit:${unitId}:dashboard`)
      })
    })
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.data.user.id)
    })
  })
  
  // Listen to Redis pub/sub for broadcasting
  const subscriber = createClient({ url: config.redisUrl })
  await subscriber.connect()
  
  await subscriber.subscribe('dashboard:*', (message, channel) => {
    const data = JSON.parse(message)
    
    if (channel === 'dashboard:metrics:update') {
      io.to('yayasan:dashboard').emit('metrics:update', data)
    } else if (channel.startsWith('dashboard:unit:')) {
      const unitId = channel.split(':')[2]
      io.to(`unit:${unitId}:dashboard`).emit('metrics:update', data)
    } else if (channel === 'dashboard:alert:new') {
      io.to('yayasan:dashboard').emit('alert:new', data)
    }
  })
  
  return io
}
```

**Background Job: Metric Aggregation**
```typescript
// apps/api/src/jobs/dashboard-aggregation.job.ts
import { schedule } from 'node-cron'
import { createClient } from 'redis'

const redis = createClient({ url: config.redisUrl })

// Run every minute
schedule('*/1 * * * *', async () => {
  await aggregateAndPublishMetrics()
})

async function aggregateAndPublishMetrics() {
  // Aggregate global metrics
  const globalMetrics = await aggregateGlobalMetrics()
  
  // Publish to Redis
  await redis.publish(
    'dashboard:metrics:update',
    JSON.stringify(globalMetrics)
  )
  
  // Aggregate per-unit metrics
  const units = await prisma.unit.findMany({ where: { isActive: true } })
  
  for (const unit of units) {
    const unitMetrics = await aggregateUnitMetrics(unit.id)
    
    await redis.publish(
      `dashboard:unit:${unit.id}:update`,
      JSON.stringify(unitMetrics)
    )
  }
}

async function aggregateGlobalMetrics() {
  const [
    totalStudents,
    activeStudents,
    totalTeachers,
    attendanceToday
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: 'active' } }),
    prisma.teacher.count(),
    getAttendanceRate(new Date())
  ])
  
  return {
    timestamp: new Date().toISOString(),
    students: { total: totalStudents, active: activeStudents },
    teachers: { total: totalTeachers },
    attendance: attendanceToday
  }
}
```

**Frontend WebSocket Hook**
```typescript
// apps/web/src/hooks/useRealtimeDashboard.ts
import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'

export function useRealtimeDashboard(enabled = true) {
  const queryClient = useQueryClient()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    if (!enabled) return
    
    const token = getAccessToken()
    
    const newSocket = io(config.wsUrl, {
      auth: { token }
    })
    
    newSocket.on('connect', () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      
      // Subscribe to dashboard updates
      newSocket.emit('dashboard:subscribe', {
        unitIds: ['all'], // or specific units
        metrics: ['students', 'attendance', 'tahfidz']
      })
    })
    
    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    })
    
    newSocket.on('metrics:update', (data) => {
      // Update React Query cache
      queryClient.setQueryData(['dashboard-metrics'], (old: any) => ({
        ...old,
        ...data
      }))
    })
    
    newSocket.on('alert:new', (alert) => {
      // Add new alert to cache
      queryClient.setQueryData(['dashboard-alerts'], (old: any[]) => 
        [alert, ...(old || [])]
      )
      
      // Show toast notification
      toast.warning(alert.message)
    })
    
    setSocket(newSocket)
    
    return () => {
      newSocket.close()
    }
  }, [enabled, queryClient])
  
  return { socket, isConnected }
}
```

---

## 2. Testing Strategy

### Unit Tests

#### Backend API Tests
```typescript
// apps/api/tests/unit/paud-assessment.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { paudAssessmentService } from '@/modules/paud-assessment/paud-assessment.service'
import { prisma } from '@/lib/prisma'

describe('PAUD Assessment Service', () => {
  beforeEach(async () => {
    await prisma.$transaction([
      prisma.pAUDAssessment.deleteMany(),
      prisma.student.deleteMany()
    ])
  })
  
  describe('createAssessment', () => {
    it('should create assessment successfully', async () => {
      const student = await createTestStudent()
      
      const input = {
        studentId: student.id,
        aspect: 'NAM',
        achievementLevel: 'BSH',
        narrativeText: 'Test narrative',
        recordedById: 'teacher-1'
      }
      
      const result = await paudAssessmentService.createAssessment(input)
      
      expect(result.id).toBeDefined()
      expect(result.aspect).toBe('NAM')
      expect(result.achievementLevel).toBe('BSH')
    })
    
    it('should reject duplicate assessment for same aspect today', async () => {
      const student = await createTestStudent()
      
      const input = {
        studentId: student.id,
        aspect: 'NAM',
        achievementLevel: 'BSH',
        narrativeText: 'Test',
        recordedById: 'teacher-1'
      }
      
      await paudAssessmentService.createAssessment(input)
      
      await expect(
        paudAssessmentService.createAssessment(input)
      ).rejects.toThrow('Assessment for this aspect already exists today')
    })
  })
  
  describe('getStudentSummary', () => {
    it('should calculate aspect scores correctly', async () => {
      const student = await createTestStudent()
      
      // Create assessments for all aspects
      await Promise.all([
        createAssessment(student.id, 'NAM', 'BSH'),
        createAssessment(student.id, 'FM', 'MB'),
        createAssessment(student.id, 'KOG', 'BSB')
      ])
      
      const summary = await paudAssessmentService.getStudentSummary(student.id)
      
      expect(summary.aspects).toHaveLength(6)
      expect(summary.aspects.find(a => a.aspect === 'NAM')?.level).toBe('BSH')
      expect(summary.aspects.find(a => a.aspect === 'FM')?.level).toBe('MB')
    })
  })
})
```

#### Frontend Component Tests
```typescript
// apps/web/src/components/paud/AssessmentForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AssessmentForm } from './AssessmentForm'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

describe('AssessmentForm', () => {
  const queryClient = new QueryClient()
  
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
  
  it('should render all form fields', () => {
    render(<AssessmentForm />, { wrapper })
    
    expect(screen.getByLabelText(/student/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/aspect/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/achievement level/i)).toBeInTheDocument()
  })
  
  it('should validate required fields', async () => {
    render(<AssessmentForm />, { wrapper })
    
    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/student is required/i)).toBeInTheDocument()
      expect(screen.getByText(/aspect is required/i)).toBeInTheDocument()
    })
  })
  
  it('should submit form successfully', async () => {
    const onSuccess = vi.fn()
    render(<AssessmentForm onSuccess={onSuccess} />, { wrapper })
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/student/i), {
      target: { value: 'student-1' }
    })
    fireEvent.click(screen.getByLabelText(/NAM/i))
    fireEvent.click(screen.getByLabelText(/BSH/i))
    fireEvent.change(screen.getByLabelText(/narrative/i), {
      target: { value: 'Test narrative text' }
    })
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})
```

---

### Integration Tests

#### E2E Tests with Playwright
```typescript
// apps/web/e2e/paud-workflow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('PAUD Assessment Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as PAUD teacher
    await page.goto('/login')
    await page.fill('[name="email"]', 'guru.paud@cipansor.test')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })
  
  test('complete assessment creation flow', async ({ page }) => {
    // Navigate to assessment form
    await page.click('a[href="/paud/assessment"]')
    await page.click('button:has-text("New Assessment")')
    await expect(page).toHaveURL('/paud/assessment/new')
    
    // Step 1: Student Info
    await page.selectOption('[name="studentId"]', { label: 'Ahmad Rizky' })
    await page.selectOption('[name="periodType"]', 'MONTHLY')
    await page.click('button:has-text("Next")')
    
    // Step 2: Assessment Details
    await page.click('input[value="NAM"]')
    await page.click('input[value="BSH"]')
    await page.fill('textarea[name="narrativeText"]', 
      'Ahmad menunjukkan perkembangan baik dalam nilai agama dan moral.'
    )
    await page.click('button:has-text("Next")')
    
    // Step 3: Evidence (skip)
    await page.click('button:has-text("Next")')
    
    // Step 4: Review & Submit
    await page.click('button:has-text("Submit")')
    
    // Verify redirect and success message
    await expect(page).toHaveURL('/paud/assessment')
    await expect(page.locator('.toast')).toContainText('Assessment created successfully')
  })
  
  test('view student progress dashboard', async ({ page }) => {
    await page.goto('/paud/assessment')
    
    // Click on a student
    await page.click('button:has-text("Ahmad Rizky")')
    await page.click('a:has-text("View Progress")')
    
    // Verify dashboard elements
    await expect(page.locator('h1')).toContainText('Ahmad Rizky')
    await expect(page.locator('.radar-chart')).toBeVisible()
    await expect(page.locator('.aspect-card')).toHaveCount(6)
  })
})
```

#### API Integration Tests
```typescript
// apps/api/tests/integration/daily-report-workflow.test.ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '@/app'

describe('Daily Report Workflow Integration', () => {
  let authToken: string
  let studentId: string
  let reportId: string
  
  beforeAll(async () => {
    // Login and get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'guru.paud@test.com',
        password: 'password'
      })
    
    authToken = loginResponse.body.token
    
    // Create test student
    const studentResponse = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Student',
        unitId: 'unit-paud-1'
      })
    
    studentId = studentResponse.body.data.id
  })
  
  it('should create daily report and send notification', async () => {
    // Create daily report
    const response = await request(app)
      .post('/api/daily-report/reports')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        studentId,
        reportDate: new Date().toISOString(),
        mood: 'HAPPY',
        mealStatus: 'FULL',
        activitiesSummary: 'Hari ini Ahmad belajar dengan baik',
        teacherNotes: 'Siswa aktif'
      })
    
    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data.id).toBeDefined()
    
    reportId = response.body.data.id
  })
  
  it('should finalize report and trigger notifications', async () => {
    const response = await request(app)
      .post(`/api/daily-report/reports/${reportId}/finalize`)
      .set('Authorization', `Bearer ${authToken}`)
    
    expect(response.status).toBe(200)
    expect(response.body.data.status).toBe('FINALIZED')
    
    // Verify notification was queued (check job queue or notification table)
    // This depends on your notification implementation
  })
  
  it('parent should be able to view and confirm report', async () => {
    // Login as parent
    const parentLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'parent@test.com',
        password: 'password'
      })
    
    const parentToken = parentLogin.body.token
    
    // Get report
    const getResponse = await request(app)
      .get(`/api/daily-report/reports/${reportId}`)
      .set('Authorization', `Bearer ${parentToken}`)
    
    expect(getResponse.status).toBe(200)
    expect(getResponse.body.data.id).toBe(reportId)
    
    // Confirm read
    const confirmResponse = await request(app)
      .post(`/api/daily-report/reports/${reportId}/confirm-by-parent`)
      .set('Authorization', `Bearer ${parentToken}`)
    
    expect(confirmResponse.status).toBe(200)
    expect(confirmResponse.body.data.parentReadAt).toBeTruthy()
  })
})
```

---

### Performance Tests

#### Load Testing with k6
```javascript
// tests/load/dashboard-metrics.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
  },
};

export default function () {
  const BASE_URL = 'http://localhost:3001';
  const token = 'your-test-token';
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Test dashboard metrics endpoint
  const metricsRes = http.get(
    `${BASE_URL}/api/dashboard-enhancement/overview`,
    { headers }
  );
  
  check(metricsRes, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has students data': (r) => JSON.parse(r.body).students !== undefined,
  });
  
  sleep(1);
}
```

---

### Test Coverage Goals

| Layer | Target Coverage | Priority |
|-------|----------------|----------|
| Backend Services | 80% | High |
| Backend Controllers | 70% | Medium |
| Frontend Components | 70% | Medium |
| Frontend Pages | 60% | Low |
| Integration Tests | Critical paths 100% | High |
| E2E Tests | User journeys 100% | High |

---

## 3. Deployment & DevOps

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run backend tests
        run: pnpm --filter api test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
  
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run frontend tests
        run: pnpm --filter web test
      
      - name: Run E2E tests
        run: pnpm --filter web test:e2e
  
  build-and-deploy:
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -t cipansor/api:latest -f apps/api/Dockerfile .
          docker build -t cipansor/web:latest -f apps/web/Dockerfile .
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push cipansor/api:latest
          docker push cipansor/web:latest
      
      - name: Deploy to production
        run: |
          # Deploy commands here (e.g., kubectl, docker-compose, etc.)
```

---

## 4. Monitoring & Observability

### Application Metrics
```typescript
// apps/api/src/lib/metrics.ts
import { register, Counter, Histogram } from 'prom-client'

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
})

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
})

export const businessMetrics = {
  assessmentsCreated: new Counter({
    name: 'assessments_created_total',
    help: 'Total PAUD assessments created',
    labelNames: ['aspect', 'level'],
  }),
  
  murojaahRecorded: new Counter({
    name: 'murojaah_recorded_total',
    help: 'Total murojaah records',
    labelNames: ['type'],
  }),
  
  simaanConducted: new Counter({
    name: 'simaan_conducted_total',
    help: 'Total simaan exams conducted',
    labelNames: ['type', 'passed'],
  }),
}

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})
```

### Error Tracking (Sentry)
```typescript
// apps/api/src/lib/sentry.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma({ client: prisma }),
  ],
  tracesSampleRate: 0.1,
})

// Error handler middleware
app.use(Sentry.Handlers.errorHandler())
```

---

## 5. Documentation

### API Documentation (OpenAPI/Swagger)
- Already implemented with Swagger UI at `/api/docs`
- Ensure all new endpoints documented

### User Guides
1. **Guru PAUD Manual**
   - How to input assessments
   - How to create daily reports
   - How to generate raport

2. **Parent Portal Guide**
   - How to view child progress
   - How to confirm daily reports
   - How to download certificates

3. **Muhafidz Manual**
   - Murojaah tracking workflow
   - Simaan exam procedures
   - Sanad certificate process

---

**Summary:**
- ✅ 3 Critical workflows documented
- ✅ Unit, integration, E2E tests planned
- ✅ CI/CD pipeline defined
- ✅ Monitoring strategy outlined
- ✅ Documentation requirements listed

*Next: Chunk 5 - Implementation Tasks Breakdown*
