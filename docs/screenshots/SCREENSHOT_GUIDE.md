# Screenshot Capture Guide for CIPANSOR

This guide provides step-by-step instructions for capturing all required screenshots for the README documentation.

## Prerequisites

1. **Application Running**: 
   ```bash
   pnpm dev
   ```
   - API should be running on http://localhost:3001
   - Web should be running on http://localhost:3000

2. **Test Credentials**: After running `pnpm db:seed`, use these credentials:

   | Role | Email | Password |
   |------|-------|----------|
   | Super Admin | superadmin@cipansor.id | SuperAdmin123! |
   | Unit Admin | admin@alhikmah.sch.id | Admin123! |
   | Teacher | ahmad@alhikmah.sch.id | Teacher123! |
   | Staff | bambang@cipansor.id | Staff123! |
   | Student | student1@alhikmah.sch.id | Student123! |

3. **Browser DevTools**: Use Chrome/Firefox DevTools for consistent screenshots
4. **Screenshot Tool**: Use browser's built-in screenshot or a tool like:
   - Mac: Cmd+Shift+4
   - Windows: Windows+Shift+S
   - Linux: Screenshot tool or Flameshot

## Screenshot Specifications

- **Resolution**: 1920x1080 (preferred) or 1280x720
- **Format**: PNG
- **Max Size**: 500KB per image (use compression if needed)
- **Content**: Use sample data, no real personal information

## Screenshot Checklist

### 1. Main Pages

#### 1.1 Login Page
- **Path**: `/docs/screenshots/main/login-page.png`
- **URL**: http://localhost:3000/login
- **Capture**: 
  - Full login form
  - Email and password fields visible
  - Login button
  - CIPANSOR branding

#### 1.2 Landing Page (if exists)
- **Path**: `/docs/screenshots/main/landing-page.png`
- **URL**: http://localhost:3000/
- **Capture**:
  - Hero section
  - Key features overview
  - Navigation menu

### 2. Dashboards

#### 2.1 Super Admin Dashboard
- **Path**: `/docs/screenshots/dashboard/super-admin-dashboard.png`
- **Login as**: superadmin@cipansor.id
- **URL**: http://localhost:3000/dashboard
- **Capture**:
  - Overview cards (total students, teachers, units, alumni)
  - Statistics charts
  - Recent activities
  - Quick actions menu

#### 2.2 Unit Admin Dashboard
- **Path**: `/docs/screenshots/dashboard/unit-admin-dashboard.png`
- **Login as**: admin@alhikmah.sch.id
- **URL**: http://localhost:3000/dashboard
- **Capture**:
  - Unit-specific statistics
  - Student enrollment data
  - Financial overview
  - Quick access to unit management

#### 2.3 Teacher Dashboard
- **Path**: `/docs/screenshots/dashboard/teacher-dashboard.png`
- **Login as**: ahmad@alhikmah.sch.id
- **URL**: http://localhost:3000/dashboard
- **Capture**:
  - Class assignments
  - Today's schedule
  - Attendance quick entry
  - Tahfidz tracking overview

#### 2.4 Student Dashboard
- **Path**: `/docs/screenshots/dashboard/student-dashboard.png`
- **Login as**: student1@alhikmah.sch.id
- **URL**: http://localhost:3000/dashboard
- **Capture**:
  - Academic progress
  - Tahfidz progress
  - Attendance summary
  - Payment status

#### 2.5 Parent Portal Dashboard
- **Path**: `/docs/screenshots/dashboard/parent-dashboard.png`
- **URL**: http://localhost:3000/parent
- **Capture**:
  - Children list/selector
  - Child progress overview
  - Attendance calendar
  - Payment information

### 3. Education Units

#### 3.1 SD IT Overview
- **Path**: `/docs/screenshots/units/sd-it-overview.png`
- **Login as**: Super Admin or Unit Admin
- **URL**: http://localhost:3000/units/[sd-it-unit-id]
- **Capture**:
  - Unit header with name and type
  - Statistics (students, classes, teachers)
  - Recent activities
  - Quick actions

#### 3.2 SMP IT Overview
- **Path**: `/docs/screenshots/units/smp-it-overview.png`
- **URL**: http://localhost:3000/units/[smp-it-unit-id]
- **Capture**: Similar to SD IT with SMP IT specific data

#### 3.3 SMA Quran Overview
- **Path**: `/docs/screenshots/units/sma-quran-overview.png`
- **URL**: http://localhost:3000/units/[sma-quran-unit-id]
- **Capture**:
  - Unit info with Tahfidz focus emphasis
  - 30 Juz tracking statistics
  - Sanad information

#### 3.4 TK Quran Overview
- **Path**: `/docs/screenshots/units/tk-quran-overview.png`
- **URL**: http://localhost:3000/units/[tk-quran-unit-id]
- **Capture**: TK Quran specific interface

#### 3.5 Unit Management
- **Path**: `/docs/screenshots/units/unit-management.png`
- **URL**: http://localhost:3000/units
- **Capture**:
  - List of all units
  - Unit cards with statistics
  - Create/Edit unit buttons
  - Filter and search options

### 4. Foundation/Yayasan Management

#### 4.1 Yayasan Overview
- **Path**: `/docs/screenshots/modules/yayasan-overview.png`
- **URL**: http://localhost:3000/foundation
- **Capture**:
  - Foundation details
  - All units under foundation
  - Board members section
  - Documents section

#### 4.2 Board Members
- **Path**: `/docs/screenshots/modules/yayasan-board-members.png`
- **URL**: http://localhost:3000/foundation/board
- **Capture**:
  - List of board members
  - Positions and tenures
  - Add/Edit member interface

#### 4.3 Foundation Documents
- **Path**: `/docs/screenshots/modules/yayasan-documents.png`
- **URL**: http://localhost:3000/foundation/documents
- **Capture**:
  - Document list (legal documents, akta, etc.)
  - Upload interface
  - Document categories

### 5. Featured Modules

#### 5.1 Tahfidz Tracking
- **Path**: `/docs/screenshots/modules/tahfidz-tracking.png`
- **URL**: http://localhost:3000/tahfidz
- **Capture**:
  - Student list with hafalan progress
  - Juz/Surah progress bars
  - Filter by class/level
  - Recent setoran activities

#### 5.2 Tahfidz Assessment
- **Path**: `/docs/screenshots/modules/tahfidz-assessment.png`
- **URL**: http://localhost:3000/tahfidz/assessment
- **Capture**:
  - Assessment form (Ziyadah, Murojaah, Tasmi)
  - Surah/Ayat selector
  - Quality scoring interface
  - Assessment history

#### 5.3 Finance Overview
- **Path**: `/docs/screenshots/modules/finance-overview.png`
- **URL**: http://localhost:3000/finance
- **Capture**:
  - Revenue statistics
  - Payment status breakdown
  - Monthly trends chart
  - Quick stats (paid, pending, overdue)

#### 5.4 Payment Processing
- **Path**: `/docs/screenshots/modules/finance-payments.png`
- **URL**: http://localhost:3000/finance/payments
- **Capture**:
  - Payment form
  - Invoice details
  - Payment method selection
  - Partial payment support

#### 5.5 Academic Management
- **Path**: `/docs/screenshots/modules/academic-management.png`
- **URL**: http://localhost:3000/academic-years
- **Capture**:
  - Academic year list
  - Semester information
  - Active year indicator
  - Classes per year

#### 5.6 Student Management
- **Path**: `/docs/screenshots/modules/student-management.png`
- **URL**: http://localhost:3000/students
- **Capture**:
  - Student list with filters
  - Student cards with photos
  - Search and filter options
  - Enrollment status

#### 5.7 Attendance System
- **Path**: `/docs/screenshots/modules/attendance-system.png`
- **URL**: http://localhost:3000/attendance
- **Capture**:
  - Date and class selector
  - Student attendance grid
  - Status options (Present, Absent, Late, Sick, Permission)
  - Bulk action buttons
  - Attendance summary

#### 5.8 Class Management
- **Path**: `/docs/screenshots/modules/class-management.png`
- **URL**: http://localhost:3000/classes
- **Capture**:
  - Class list with levels
  - Homeroom teacher assignment
  - Student count per class
  - Academic year filter

### 6. Pesantren Features

#### 6.1 Dormitory Management
- **Path**: `/docs/screenshots/features/dormitory-management.png`
- **URL**: http://localhost:3000/dormitories
- **Capture**:
  - Dormitory list (Putra/Putri)
  - Room capacity and occupancy
  - Student assignments
  - Statistics dashboard

#### 6.2 Permit System
- **Path**: `/docs/screenshots/features/permit-system.png`
- **URL**: http://localhost:3000/permits
- **Capture**:
  - Permit request form
  - Permit types (Pulang, Keluar, Sakit, Keluarga)
  - Approval workflow
  - Active permits list

#### 6.3 Violations & Rewards
- **Path**: `/docs/screenshots/features/violations-rewards.png`
- **URL**: http://localhost:3000/violations or http://localhost:3000/rewards
- **Capture**:
  - Split view or tabs for violations and rewards
  - Point system display
  - Student behavior tracking
  - Leaderboard for rewards

### 7. Additional Features

#### 7.1 PSB (Student Admission)
- **Path**: `/docs/screenshots/features/psb-registration.png`
- **URL**: http://localhost:3000/psb
- **Capture**:
  - Registrant list
  - Status workflow (Registered → Document Check → Test → Accepted → Enrolled)
  - Document verification interface
  - Admission statistics

#### 7.2 Library System
- **Path**: `/docs/screenshots/features/library-system.png`
- **URL**: http://localhost:3000/library
- **Capture**:
  - Book catalog
  - Borrowing interface
  - Due dates and overdue tracking
  - Category filters

#### 7.3 Health/UKS
- **Path**: `/docs/screenshots/features/health-uks.png`
- **URL**: http://localhost:3000/health
- **Capture**:
  - Medical records list
  - Medication inventory
  - Patient visit form
  - Health statistics

#### 7.4 Curriculum Management
- **Path**: `/docs/screenshots/features/curriculum-management.png`
- **URL**: http://localhost:3000/curriculum
- **Capture**:
  - Subject list
  - Teacher assignments
  - Schedule grid
  - Lesson plans

#### 7.5 Assessment & Reports
- **Path**: `/docs/screenshots/features/assessment-reports.png`
- **URL**: http://localhost:3000/assessment
- **Capture**:
  - Exam list
  - Grade entry interface
  - Report card preview
  - Grade distribution charts

#### 7.6 Analytics Dashboard
- **Path**: `/docs/screenshots/features/analytics-dashboard.png`
- **URL**: http://localhost:3000/analytics
- **Capture**:
  - Multiple charts and graphs
  - Student trends
  - Finance analytics
  - Tahfidz progress analytics
  - Attendance rates

#### 7.7 Alumni Management
- **Path**: `/docs/screenshots/features/alumni-management.png`
- **URL**: http://localhost:3000/alumni
- **Capture**:
  - Alumni directory
  - Career tracking
  - Alumni events
  - Donation records

#### 7.8 HR Management
- **Path**: `/docs/screenshots/features/hr-management.png`
- **URL**: http://localhost:3000/hr
- **Capture**:
  - Staff list
  - Attendance tracking
  - Leave requests
  - Staff statistics

#### 7.9 Inventory Management
- **Path**: `/docs/screenshots/features/inventory-management.png`
- **URL**: http://localhost:3000/inventory
- **Capture**:
  - Asset list with categories
  - Asset conditions
  - Maintenance logs
  - Depreciation tracking

#### 7.10 Communication System
- **Path**: `/docs/screenshots/features/communication-system.png`
- **URL**: http://localhost:3000/notifications or http://localhost:3000/announcements
- **Capture**:
  - Announcement list
  - Notification center
  - Broadcast interface
  - Read/Unread status

#### 7.11 BOS/BOP Reporting
- **Path**: `/docs/screenshots/features/bos-reporting.png`
- **URL**: http://localhost:3000/foundation/bos
- **Capture**:
  - BOS period list
  - 8 Standar BOS allocation
  - Realization tracking
  - Export options (Excel/PDF)

#### 7.12 EMIS Kemenag Integration
- **Path**: `/docs/screenshots/features/emis-integration.png`
- **URL**: http://localhost:3000/emis
- **Capture**:
  - Export options (Students, Teachers, Institution)
  - Data mapping interface
  - Format selection (EMIS/Dapodik)
  - Export preview

#### 7.13 Document Generator
- **Path**: `/docs/screenshots/features/document-generator.png`
- **URL**: http://localhost:3000/students/[id]/documents
- **Capture**:
  - Document type selection (ID Card, Certificate, Letter)
  - Template preview
  - Generation interface
  - Download options

#### 7.14 Accreditation Module
- **Path**: `/docs/screenshots/features/accreditation.png`
- **URL**: http://localhost:3000/reporting/accreditation
- **Capture**:
  - 8 Standar akreditasi list
  - Self-assessment forms
  - Progress tracking
  - Score calculation

## Post-Capture Tasks

After capturing all screenshots:

1. **Review Quality**:
   - Check clarity and readability
   - Ensure no sensitive data is visible
   - Verify proper resolution

2. **Optimize Images**:
   ```bash
   # Use online tools or CLI
   # - TinyPNG.com
   # - Squoosh.app
   # - ImageOptim (Mac)
   ```
   Target: < 500KB per image

3. **Rename & Organize**:
   - Follow the naming convention in this guide
   - Place in correct directories
   - Remove `.placeholder` files

4. **Update README**:
   - Verify all image paths are correct
   - Check that images display properly
   - Update captions if needed

5. **Commit Changes**:
   ```bash
   git add docs/screenshots/
   git commit -m "docs: add actual application screenshots"
   git push
   ```

## Tips for Better Screenshots

1. **Use Consistent Data**: Use the same seed data across screenshots for consistency
2. **Full Page**: Capture the full viewport, not just partial views
3. **Hide Sensitive Info**: Blur or remove any real personal data
4. **Good Lighting**: Use light mode or dark mode consistently
5. **Clean UI**: Close unnecessary browser tabs, hide bookmarks bar
6. **Responsive Views**: Capture desktop view (can add mobile later if needed)
7. **Annotations**: Add arrows or highlights to important features if needed (optional)

## Troubleshooting

### Application Not Starting
```bash
# Check dependencies
pnpm install

# Check database
pnpm db:push
pnpm db:seed

# Restart
pnpm dev
```

### Page Not Found
- Verify you're logged in with the correct role
- Check if the feature is implemented
- Check browser console for errors

### Poor Image Quality
- Increase browser zoom before capturing
- Use native screenshot tools instead of third-party
- Capture at higher resolution (1920x1080)

## Questions?

If you need help:
- Check the main README.md for application setup
- Review the API documentation
- Contact the development team

---

**Last Updated**: 2025-12-08
