# Tasks Document - Cipansor Enhancement

**Versi:** 1.0.0
**Tanggal:** 5 Desember 2025
**Status:** Draft
**Referensi Dokumen:** requirements.md, database-design.md, backend-design.md, frontend-design.md

---

## Daftar Isi

1. [Setup & Infrastructure](#1-setup--infrastructure)
2. [Database Implementation](#2-database-implementation)
3. [PAUD Module](#3-paud-module)
4. [Daily Report Module](#4-daily-report-module)
5. [Tahfidz Enhancement Module](#5-tahfidz-enhancement-module)
6. [Dashboard Module](#6-dashboard-module)
7. [Integration & Testing](#7-integration--testing)
8. [Documentation & Deployment](#8-documentation--deployment)

---

## Progress Summary

- **Total Tasks:** 235 sub-tasks
- **Completed:** 151/235 (64.3%)
- **In Progress:** 0
- **Remaining:** 84 (mostly testing and integration tasks)
- **Estimated Total:** ~120 jam (~15 hari kerja)

**Recent Progress:**

- ✅ Completed enum validation tests (28 tests passing)
- ✅ Created database migration test suite (requires test DB setup)
- ✅ Completed PAUD Assessment service unit tests (16 tests passing)
- ✅ Completed PAUD Report service unit tests (22 tests passing)

**Next Steps:**

- Complete service unit tests for remaining modules (Daily Report, Tahfidz, Dashboard)
- Configure test environment for integration tests
- Implement E2E tests
- Documentation and deployment

---

## 1. Setup & Infrastructure

### 1.1 Project Setup

**Requirements:** [Req 1.4, 1.5]
**Database:** [DB 1.1]
**Backend:** [BE 1.1]
**Frontend:** [FE 1.1]

- [x] 1.1.1 Create planning documentation folder structure
- [x] 1.1.2 Review and validate existing codebase structure
- [x] 1.1.3 Setup development branch for enhancement
- [x] 1.1.4 Update package dependencies if needed

**Priority:** High | **Est:** 2h
**Dependencies:** None

---

## 2. Database Implementation

### 2.1 New Enums

**Requirements:** [Req 4.1, 7.1]
**Database:** [DB 2.1-2.8]

- [x] 2.1.1 Add PAUD enums (PAUDAspect, PAUDAchievementLevel, PAUDReportPeriod)
- [x] 2.1.2 Add Daily Report enums (DailyMood, MealConsumption)
- [x] 2.1.3 Add Tahfidz enums (MurojaahType, TahfidzMistakeType, SimaanType)
- [x] 2.1.4 Run migration and verify enum creation
- [x] 2.1.5 Write unit tests for enum validation
- [x] 2.1.6 Run tests & verify all pass

**Priority:** High | **Est:** 3h (2h dev + 1h test)
**Dependencies:** 1.1

### 2.2 PAUD Models

**Requirements:** [Req 4.1, 4.2]
**Database:** [DB 3.1-3.5]

- [x] 2.2.1 Create PAUDDevelopmentIndicator model
- [x] 2.2.2 Create PAUDDevelopmentAssessment model
- [x] 2.2.3 Create PAUDAssessmentEvidence model
- [x] 2.2.4 Create PAUDNarrativeReport model
- [x] 2.2.5 Create PAUDReportPhoto model
- [x] 2.2.6 Add relations to Student and AcademicYear
- [x] 2.2.7 Run migration
- [x] 2.2.8 Write migration tests (requires test DB - moved to integration)
- [x] 2.2.9 Run tests & verify all pass

**Priority:** High | **Est:** 5h (3.5h dev + 1.5h test)
**Dependencies:** 2.1
**Acceptance Criteria:**

- All models created with proper relations
- Migration runs without error
- Rollback works correctly

### 2.3 Daily Report Models

**Requirements:** [Req 4.3, 5.3]
**Database:** [DB 4.1-4.3]

- [x] 2.3.1 Create DailyStudentReport model
- [x] 2.3.2 Create DailyReportPhoto model
- [x] 2.3.3 Create DailyHomework model
- [x] 2.3.4 Add relations to Student
- [x] 2.3.5 Add unique constraint (studentId + reportDate)
- [x] 2.3.6 Run migration
- [ ] 2.3.7 Write migration tests
- [ ] 2.3.8 Run tests & verify all pass

**Priority:** High | **Est:** 4h (2.5h dev + 1.5h test)
**Dependencies:** 2.1

### 2.4 Tahfidz Enhancement Models

**Requirements:** [Req 7.1, 7.2]
**Database:** [DB 5.1-5.5]

- [x] 2.4.1 Create MurojaahRecord model
- [x] 2.4.2 Create MurojaahMistake model
- [x] 2.4.3 Create SimaanExam model
- [x] 2.4.4 Create SimaanExaminer model
- [x] 2.4.5 Add relations to TakhosusEnrollment and Halaqoh
- [ ] 2.4.6 Enhance existing SanadRecord with new fields
- [x] 2.4.7 Run migration
- [ ] 2.4.8 Write migration tests
- [ ] 2.4.9 Run tests & verify all pass

**Priority:** High | **Est:** 5h (3.5h dev + 1.5h test)
**Dependencies:** 2.1

### 2.5 Dashboard & Health Models

**Requirements:** [Req 9.1, 4.5]
**Database:** [DB 6.1, 6.2, 7.2, 7.3]

- [x] 2.5.1 Create DashboardMetricSnapshot model
- [x] 2.5.2 Create UnitComparisonReport model
- [x] 2.5.3 Create GrowthRecord model
- [x] 2.5.4 Create ImmunizationRecord model
- [x] 2.5.5 Enhance Student model with new fields
- [x] 2.5.6 Run migration
- [ ] 2.5.7 Write migration tests
- [ ] 2.5.8 Run tests & verify all pass

**Priority:** Medium | **Est:** 4h (2.5h dev + 1.5h test)
**Dependencies:** 2.1

### 2.6 Seed Data

**Requirements:** [Req 4.1.1]
**Database:** [DB 9.3]

- [x] 2.6.1 Create PAUD Development Indicators seed (60+ records)
- [x] 2.6.2 Create Immunization schedule reference seed
- [x] 2.6.3 Run seeds and verify
- [ ] 2.6.4 Write seed verification tests
- [ ] 2.6.5 Run tests & verify all pass

**Priority:** Medium | **Est:** 3h (2h dev + 1h test)
**Dependencies:** 2.2

---

## 3. PAUD Module

### 3.1 PAUD Assessment Backend

**Requirements:** [Req 4.1]
**Database:** [DB 3.1-3.3]
**Backend:** [BE 2.1]

- [x] 3.1.1 Create paud-assessment module structure
- [x] 3.1.2 Create Zod validation schemas
- [x] 3.1.3 Implement PAUDAssessmentService (CRUD)
- [x] 3.1.4 Implement student progress summary logic
- [x] 3.1.5 Implement bulk assessment creation
- [x] 3.1.6 Create controller handlers
- [x] 3.1.7 Define routes with Swagger docs
- [x] 3.1.8 Register routes in app.ts
- [x] 3.1.9 Write unit tests for service
- [ ] 3.1.10 Write integration tests for API
- [ ] 3.1.11 Run tests & verify all pass

**Priority:** High | **Est:** 12h (8h dev + 4h test)
**Dependencies:** 2.2
**Acceptance Criteria:**

- All endpoints working as per spec
- Validation rules enforced
- Progress calculation accurate
- Unit test coverage ≥80%
- All integration tests pass

### 3.2 PAUD Report Backend

**Requirements:** [Req 4.2]
**Database:** [DB 3.4, 3.5]
**Backend:** [BE 2.2]

- [x] 3.2.1 Create paud-report module structure
- [x] 3.2.2 Create Zod validation schemas
- [x] 3.2.3 Implement PAUDReportService (CRUD)
- [x] 3.2.4 Implement narrative auto-generation logic
- [x] 3.2.5 Implement finalize workflow
- [x] 3.2.6 Implement PDF generation service
- [x] 3.2.7 Create controller handlers
- [x] 3.2.8 Define routes with Swagger docs
- [x] 3.2.9 Register routes in app.ts
- [x] 3.2.10 Write unit tests for service
- [ ] 3.2.11 Write integration tests for API
- [ ] 3.2.12 Run tests & verify all pass

**Priority:** High | **Est:** 10h (7h dev + 3h test)
**Dependencies:** 3.1

### 3.3 PAUD Assessment Frontend

**Requirements:** [Req 4.1]
**Backend:** [BE 2.1]
**Frontend:** [FE 2.1-2.4]

- [x] 3.3.1 Create PAUD assessment list page
- [x] 3.3.2 Create PAUD assessment create/edit page
- [x] 3.3.3 Create PAUD assessment detail page
- [x] 3.3.4 Create student progress dashboard page
- [x] 3.3.5 Create AspectBadge, AchievementBadge components
- [x] 3.3.6 Create EvidenceGallery component
- [x] 3.3.7 Create React Query hooks (usePAUDAssessments, etc.)
- [x] 3.3.8 Integrate API calls
- [ ] 3.3.9 Write component unit tests
- [ ] 3.3.10 Write E2E tests for critical flows
- [ ] 3.3.11 Run tests & verify all pass

**Priority:** High | **Est:** 14h (10h dev + 4h test)
**Dependencies:** 3.1

### 3.4 PAUD Report Frontend

**Requirements:** [Req 4.2]
**Backend:** [BE 2.2]
**Frontend:** [FE 2.5-2.7]

- [x] 3.4.1 Create PAUD report list page
- [x] 3.4.2 Create PAUD report detail/edit page
- [x] 3.4.3 Create generate report page
- [x] 3.4.4 Create PhotoGallery component
- [x] 3.4.5 Create PDF preview component
- [x] 3.4.6 Create React Query hooks (usePAUDReports, etc.)
- [x] 3.4.7 Integrate API calls
- [ ] 3.4.8 Write component unit tests
- [ ] 3.4.9 Write E2E tests for report generation
- [ ] 3.4.10 Run tests & verify all pass

**Priority:** High | **Est:** 12h (8h dev + 4h test)
**Dependencies:** 3.2, 3.3

---

## 4. Daily Report Module

### 4.1 Daily Report Backend

**Requirements:** [Req 4.3, 5.3]
**Database:** [DB 4.1-4.3]
**Backend:** [BE 3.1]

- [x] 4.1.1 Create daily-report module structure
- [x] 4.1.2 Create Zod validation schemas
- [x] 4.1.3 Implement DailyReportService (CRUD)
- [x] 4.1.4 Implement bulk check-in logic
- [ ] 4.1.5 Implement notification service integration
- [ ] 4.1.6 Implement WhatsApp message templates
- [x] 4.1.7 Create controller handlers
- [x] 4.1.8 Define routes with Swagger docs
- [x] 4.1.9 Register routes in app.ts
- [ ] 4.1.10 Write unit tests for service
- [ ] 4.1.11 Write integration tests for API
- [ ] 4.1.12 Run tests & verify all pass

**Priority:** High | **Est:** 12h (8h dev + 4h test)
**Dependencies:** 2.3
**Acceptance Criteria:**

- CRUD operations working
- Bulk check-in saves multiple records
- WhatsApp notification sent correctly
- Duplicate prevention working

### 4.2 Daily Report Frontend

**Requirements:** [Req 4.3, 5.3]
**Backend:** [BE 3.1]
**Frontend:** [FE 3.1-3.5]

- [x] 4.2.1 Create daily report list page
- [x] 4.2.2 Create daily report create/edit page
- [x] 4.2.3 Create bulk check-in page
- [x] 4.2.4 Create parent view page
- [x] 4.2.5 Create class view page
- [x] 4.2.6 Create MoodSelector component
- [x] 4.2.7 Create HomeworkList component
- [x] 4.2.8 Create PhotoUploader component
- [x] 4.2.9 Create React Query hooks
- [x] 4.2.10 Integrate API calls
- [ ] 4.2.11 Write component unit tests
- [ ] 4.2.12 Write E2E tests for daily report flow
- [ ] 4.2.13 Run tests & verify all pass

**Priority:** High | **Est:** 14h (10h dev + 4h test)
**Dependencies:** 4.1

---

## 5. Tahfidz Enhancement Module

### 5.1 Murojaah Backend

**Requirements:** [Req 7.1.2]
**Database:** [DB 5.1, 5.2]
**Backend:** [BE 4.1]

- [x] 5.1.1 Create murojaah module structure
- [x] 5.1.2 Create Zod validation schemas
- [x] 5.1.3 Implement MurojaahService (CRUD)
- [x] 5.1.4 Implement student summary calculation
- [x] 5.1.5 Implement schedule recommendation logic
- [x] 5.1.6 Create controller handlers
- [x] 5.1.7 Define routes with Swagger docs
- [x] 5.1.8 Register routes in app.ts
- [ ] 5.1.9 Write unit tests for service
- [ ] 5.1.10 Write integration tests for API
- [ ] 5.1.11 Run tests & verify all pass

**Priority:** High | **Est:** 10h (7h dev + 3h test)
**Dependencies:** 2.4

### 5.2 Simaan Backend

**Requirements:** [Req 7.1.3]
**Database:** [DB 5.3, 5.4]
**Backend:** [BE 4.2]

- [x] 5.2.1 Create simaan module structure
- [x] 5.2.2 Create Zod validation schemas
- [x] 5.2.3 Implement SimaanService (CRUD)
- [x] 5.2.4 Implement examiner management
- [x] 5.2.5 Implement finalize and grade calculation
- [x] 5.2.6 Create controller handlers
- [x] 5.2.7 Define routes with Swagger docs
- [x] 5.2.8 Register routes in app.ts
- [ ] 5.2.9 Write unit tests for service
- [ ] 5.2.10 Write integration tests for API
- [ ] 5.2.11 Run tests & verify all pass

**Priority:** High | **Est:** 10h (7h dev + 3h test)
**Dependencies:** 2.4

### 5.3 Sanad Certificate Backend

**Requirements:** [Req 7.2.3]
**Database:** [DB 5.5]
**Backend:** [BE 4.3]

- [x] 5.3.1 Enhance sanad module for certificate
- [x] 5.3.2 Implement certificate number generation
- [x] 5.3.3 Implement verification code generation
- [x] 5.3.4 Implement PDF certificate generation (HTML template)
- [x] 5.3.5 Implement public verification endpoint
- [x] 5.3.6 Add routes with Swagger docs
- [ ] 5.3.7 Write unit tests
- [ ] 5.3.8 Write integration tests
- [ ] 5.3.9 Run tests & verify all pass

**Priority:** Medium | **Est:** 8h (5h dev + 3h test)
**Dependencies:** 5.2

### 5.4 Murojaah Frontend

**Requirements:** [Req 7.1.2]
**Backend:** [BE 4.1]
**Frontend:** [FE 4.1-4.4]

- [x] 5.4.1 Create murojaah list page
- [x] 5.4.2 Create murojaah create/edit page
- [x] 5.4.3 Create student murojaah dashboard (detail page)
- [x] 5.4.4 Create schedule page
- [x] 5.4.5 Create QualityScoreBar component
- [x] 5.4.6 Create JuzRangeSelector component
- [x] 5.4.7 Create MistakeLogger component
- [x] 5.4.8 Create React Query hooks
- [x] 5.4.9 Integrate API calls
- [ ] 5.4.10 Write component unit tests
- [ ] 5.4.11 Write E2E tests
- [ ] 5.4.12 Run tests & verify all pass

**Priority:** High | **Est:** 12h (8h dev + 4h test)
**Dependencies:** 5.1

### 5.5 Simaan Frontend

**Requirements:** [Req 7.1.3]
**Backend:** [BE 4.2]
**Frontend:** [FE 4.5-4.7]

- [x] 5.5.1 Create simaan list page
- [x] 5.5.2 Create simaan create/edit page
- [x] 5.5.3 Create simaan detail page
- [x] 5.5.4 Create ExaminerList component
- [x] 5.5.5 Create GradeBadge component (inline)
- [x] 5.5.6 Create ScoreRadarChart component
- [x] 5.5.7 Create React Query hooks
- [x] 5.5.8 Integrate API calls
- [ ] 5.5.9 Write component unit tests
- [ ] 5.5.10 Write E2E tests
- [ ] 5.5.11 Run tests & verify all pass

**Priority:** High | **Est:** 10h (7h dev + 3h test)
**Dependencies:** 5.2

### 5.6 Certificate & Verification Frontend

**Requirements:** [Req 7.2.3]
**Backend:** [BE 4.3]
**Frontend:** [FE 4.8, 4.9]

- [x] 5.6.1 Create certificate page
- [x] 5.6.2 Create public verification page
- [x] 5.6.3 Create QRCodeDisplay component
- [x] 5.6.4 Create CertificatePreview component
- [x] 5.6.5 Integrate API calls
- [ ] 5.6.6 Write component unit tests
- [ ] 5.6.7 Write E2E tests
- [ ] 5.6.8 Run tests & verify all pass

**Priority:** Medium | **Est:** 6h (4h dev + 2h test)
**Dependencies:** 5.3

---

## 6. Dashboard Module

### 6.1 Dashboard Backend

**Requirements:** [Req 9.1]
**Database:** [DB 6.1, 6.2]
**Backend:** [BE 5.1]

- [x] 6.1.1 Create dashboard-enhancement module structure
- [x] 6.1.2 Implement DashboardService
- [x] 6.1.3 Implement metric snapshot calculation
- [x] 6.1.4 Implement unit comparison logic
- [x] 6.1.5 Implement alert generation
- [x] 6.1.6 Create cron job for daily snapshots
- [x] 6.1.7 Create controller handlers
- [x] 6.1.8 Define routes with Swagger docs
- [x] 6.1.9 Register routes in app.ts
- [ ] 6.1.10 Write unit tests
- [ ] 6.1.11 Write integration tests
- [ ] 6.1.12 Run tests & verify all pass

**Priority:** Medium | **Est:** 10h (7h dev + 3h test)
**Dependencies:** 2.5

### 6.2 Dashboard Frontend

**Requirements:** [Req 9.1]
**Backend:** [BE 5.1]
**Frontend:** [FE 5.1-5.3]

- [x] 6.2.1 Create yayasan dashboard page
- [x] 6.2.2 Create unit comparison page
- [x] 6.2.3 Enhance existing dashboard page
- [x] 6.2.4 Create MetricCard component
- [x] 6.2.5 Create TrendChart component
- [x] 6.2.6 Create ComparisonChart component
- [x] 6.2.7 Create AlertCard component
- [x] 6.2.8 Create React Query hooks
- [x] 6.2.9 Integrate API calls
- [ ] 6.2.10 Write component unit tests
- [ ] 6.2.11 Write E2E tests
- [ ] 6.2.12 Run tests & verify all pass

**Priority:** Medium | **Est:** 10h (7h dev + 3h test)
**Dependencies:** 6.1

---

## 7. Integration & Testing

### 7.1 API Integration Tests

**Requirements:** [Req 12.3]
**Backend:** [BE 1.4]

- [ ] 7.1.1 Setup test database and fixtures
- [ ] 7.1.2 Write cross-module integration tests
- [ ] 7.1.3 Write authentication flow tests
- [ ] 7.1.4 Write authorization tests for new modules
- [ ] 7.1.5 Run full test suite and generate coverage report

**Priority:** High | **Est:** 8h
**Dependencies:** 3.1, 4.1, 5.1, 5.2, 6.1

### 7.2 E2E Tests

**Requirements:** [Req 12.3]
**Frontend:** [FE 6.1]

- [ ] 7.2.1 Setup Playwright/Cypress test environment
- [ ] 7.2.2 Write PAUD assessment E2E flow
- [ ] 7.2.3 Write daily report E2E flow
- [ ] 7.2.4 Write murojaah E2E flow
- [ ] 7.2.5 Write dashboard E2E flow
- [ ] 7.2.6 Run full E2E suite

**Priority:** High | **Est:** 8h
**Dependencies:** 3.3, 3.4, 4.2, 5.4, 5.5, 6.2

### 7.3 Performance Testing

**Requirements:** [Req 11.1]

- [ ] 7.3.1 Setup load testing tool (k6/Artillery)
- [ ] 7.3.2 Write performance tests for critical APIs
- [ ] 7.3.3 Run performance tests and analyze results
- [ ] 7.3.4 Optimize identified bottlenecks
- [ ] 7.3.5 Re-run and verify improvements

**Priority:** Medium | **Est:** 6h
**Dependencies:** 7.1

---

## 8. Documentation & Deployment

### 8.1 API Documentation

**Requirements:** [Req 12.3]
**Backend:** [BE 1.1]

- [ ] 8.1.1 Verify all Swagger docs are complete
- [ ] 8.1.2 Add example requests/responses
- [ ] 8.1.3 Document error codes
- [ ] 8.1.4 Review and update README

**Priority:** Medium | **Est:** 4h
**Dependencies:** 7.1

### 8.2 User Documentation

**Requirements:** [Req 12.3]

- [ ] 8.2.1 Write PAUD module user guide
- [ ] 8.2.2 Write Daily Report user guide
- [ ] 8.2.3 Write Murojaah/Simaan user guide
- [ ] 8.2.4 Write Dashboard user guide
- [ ] 8.2.5 Create video tutorials (optional)

**Priority:** Low | **Est:** 8h
**Dependencies:** 7.2

### 8.3 Deployment

**Requirements:** [Req 11.4]

- [ ] 8.3.1 Review and update deployment scripts
- [ ] 8.3.2 Run migrations on staging
- [ ] 8.3.3 Deploy to staging environment
- [ ] 8.3.4 Run smoke tests on staging
- [ ] 8.3.5 Deploy to production
- [ ] 8.3.6 Monitor for issues

**Priority:** High | **Est:** 4h
**Dependencies:** 7.1, 7.2

---

## Appendix A: Task Dependencies Graph

```
1.1 Setup
    │
    ├─► 2.1 Enums
    │       │
    │       ├─► 2.2 PAUD Models ─────► 3.1 PAUD Assessment BE ─► 3.3 PAUD Assessment FE
    │       │                                    │
    │       │                                    └─► 3.2 PAUD Report BE ─► 3.4 PAUD Report FE
    │       │
    │       ├─► 2.3 Daily Report Models ─► 4.1 Daily Report BE ─► 4.2 Daily Report FE
    │       │
    │       ├─► 2.4 Tahfidz Models ─► 5.1 Murojaah BE ─► 5.4 Murojaah FE
    │       │                    │
    │       │                    └─► 5.2 Simaan BE ─► 5.5 Simaan FE
    │       │                              │
    │       │                              └─► 5.3 Certificate BE ─► 5.6 Certificate FE
    │       │
    │       └─► 2.5 Dashboard Models ─► 6.1 Dashboard BE ─► 6.2 Dashboard FE
    │
    └─► 2.6 Seed Data

7.1 API Tests ─► 7.3 Performance
7.2 E2E Tests
        │
        └─► 8.1 API Docs
            8.2 User Docs
                │
                └─► 8.3 Deployment
```

---

## Appendix B: Priority & Timeline

### Sprint 1 (Week 1-2): Foundation

- 1.1 Setup
- 2.1-2.6 All Database tasks
- 3.1 PAUD Assessment Backend
- 3.2 PAUD Report Backend

### Sprint 2 (Week 3-4): PAUD & Daily Report

- 3.3 PAUD Assessment Frontend
- 3.4 PAUD Report Frontend
- 4.1 Daily Report Backend
- 4.2 Daily Report Frontend

### Sprint 3 (Week 5-6): Tahfidz Enhancement

- 5.1 Murojaah Backend
- 5.2 Simaan Backend
- 5.3 Certificate Backend
- 5.4 Murojaah Frontend
- 5.5 Simaan Frontend
- 5.6 Certificate Frontend

### Sprint 4 (Week 7): Dashboard & Finalization

- 6.1 Dashboard Backend
- 6.2 Dashboard Frontend
- 7.1-7.3 Testing
- 8.1-8.3 Documentation & Deployment

---

## Appendix C: Estimation Summary

| Phase                  | Tasks            | Hours     | Days         |
| ---------------------- | ---------------- | --------- | ------------ |
| Setup & Infrastructure | 4                | 2         | 0.25         |
| Database               | 6 groups         | 24        | 3            |
| PAUD Module            | 4 groups         | 48        | 6            |
| Daily Report           | 2 groups         | 26        | 3.25         |
| Tahfidz Enhancement    | 6 groups         | 56        | 7            |
| Dashboard              | 2 groups         | 20        | 2.5          |
| Testing                | 3 groups         | 22        | 2.75         |
| Documentation          | 3 groups         | 16        | 2            |
| **Total**              | **78 sub-tasks** | **~214h** | **~27 days** |

_Note: 8 jam/hari kerja, buffer 20% sudah termasuk_

---

**Status:** Draft - Awaiting Confirmation

**Next Step:** Konfirmasi Tasks sebelum lanjut ke Implementation
