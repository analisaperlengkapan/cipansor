# Screenshots Directory

This directory contains screenshots of the CIPANSOR application to showcase its features and user interfaces.

## Directory Structure

```
screenshots/
├── main/           # Main pages (landing, login, homepage)
├── dashboard/      # Dashboard views for different roles
├── units/          # Education unit pages (SD IT, SMP IT, SMA Quran, etc.)
├── modules/        # Module-specific screenshots (Tahfidz, Finance, Academic, etc.)
└── features/       # Featured functionality (Reports, Analytics, etc.)
```

## Screenshot Guidelines

When adding screenshots to this directory:

1. **File Naming Convention**: Use lowercase with hyphens
   - Example: `dashboard-super-admin.png`, `sd-it-overview.png`

2. **Image Format**: Prefer PNG for UI screenshots (better quality for text)
   - PNG for static UI screenshots
   - JPEG for photos
   - WebP for optimized web delivery (optional)

3. **Image Size**: 
   - Desktop screenshots: 1920x1080 or 1280x720
   - Mobile screenshots: 375x667 or 414x896
   - Keep file size under 500KB per image (use compression if needed)

4. **Content Guidelines**:
   - Use sample/dummy data (no real personal information)
   - Show the interface in a clean, professional state
   - Include key features and UI elements visible
   - Use consistent theme/styling across screenshots

## Required Screenshots

### Main Pages
- [ ] `main/landing-page.png` - Application landing page
- [ ] `main/login-page.png` - Login interface
- [ ] `main/home-page.png` - Main homepage after login

### Dashboard
- [ ] `dashboard/super-admin-dashboard.png` - Super Admin dashboard overview
- [ ] `dashboard/unit-admin-dashboard.png` - Unit Admin dashboard
- [ ] `dashboard/teacher-dashboard.png` - Teacher dashboard
- [ ] `dashboard/student-dashboard.png` - Student dashboard
- [ ] `dashboard/parent-dashboard.png` - Parent portal dashboard

### Education Units
- [ ] `units/sd-it-overview.png` - SD IT (Islamic Elementary) overview
- [ ] `units/smp-it-overview.png` - SMP IT (Islamic Junior High) overview
- [ ] `units/sma-quran-overview.png` - SMA Quran (Islamic Senior High) overview
- [ ] `units/tk-quran-overview.png` - TK Quran (Islamic Kindergarten) overview
- [ ] `units/unit-management.png` - Unit management interface

### Foundation/Yayasan
- [ ] `modules/yayasan-overview.png` - Foundation/Yayasan overview
- [ ] `modules/yayasan-board-members.png` - Board members management
- [ ] `modules/yayasan-documents.png` - Foundation documents

### Featured Modules
- [ ] `modules/tahfidz-tracking.png` - Tahfidz (Quran memorization) tracking
- [ ] `modules/tahfidz-assessment.png` - Tahfidz assessment interface
- [ ] `modules/finance-overview.png` - Finance management overview
- [ ] `modules/finance-payments.png` - Payment processing
- [ ] `modules/academic-management.png` - Academic management
- [ ] `modules/student-management.png` - Student management
- [ ] `modules/attendance-system.png` - Attendance system
- [ ] `modules/class-management.png` - Class management

### Pesantren Features
- [ ] `features/dormitory-management.png` - Dormitory/Asrama management
- [ ] `features/permit-system.png` - Student permit system (Perizinan)
- [ ] `features/violations-rewards.png` - Violations and rewards system

### Additional Features
- [ ] `features/psb-registration.png` - Student admission (PSB)
- [ ] `features/library-system.png` - Library management
- [ ] `features/health-uks.png` - Health/UKS management
- [ ] `features/curriculum-management.png` - Curriculum management
- [ ] `features/assessment-reports.png` - Assessment and report cards
- [ ] `features/analytics-dashboard.png` - Analytics and statistics
- [ ] `features/alumni-management.png` - Alumni management
- [ ] `features/parent-portal.png` - Parent portal interface

## How to Capture Screenshots

1. **For Desktop Application**:
   - Start the development server: `pnpm dev`
   - Navigate to http://localhost:3000
   - Login with appropriate test credentials
   - Navigate to the relevant page
   - Use browser's screenshot tool or OS screenshot utility
   - Crop and optimize the image
   - Save to the appropriate directory

2. **For API/Backend**:
   - If showcasing API responses, use tools like Postman or Insomnia
   - Take screenshots of request/response examples
   - Save to `modules/api-examples/`

3. **For Mobile Responsive Views**:
   - Use browser DevTools to switch to mobile view
   - Capture screenshots at standard mobile resolutions
   - Save with `-mobile` suffix (e.g., `dashboard-mobile.png`)

## Image Optimization

Before committing screenshots, optimize them:

```bash
# Using ImageOptim (Mac)
# Using TinyPNG (Web)
# Using squoosh.app (Web)
# Or any image optimization tool
```

## Updating README.md

After adding screenshots, update the main README.md file:

1. Add screenshot paths in the Screenshots section
2. Include descriptive captions
3. Organize by feature category
4. Link to relevant documentation sections

## Notes

- Screenshots should be updated when major UI changes are made
- Keep screenshots up-to-date with the latest version
- Remove outdated screenshots to avoid confusion
- Consider adding a "Last Updated" date for each screenshot section
