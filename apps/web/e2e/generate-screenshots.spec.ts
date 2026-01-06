import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Generate Screenshots Expanded', () => {
  test.use({
    viewport: { width: 1280, height: 1200 },
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
  });

  test.beforeEach(async ({ page, context }) => {
    // 1. Mock Authentication
    const mockUser = {
      id: 'user-123',
      name: 'Dr. Ahmad Fauzi, M.Pd.',
      email: 'admin@cipansor.id',
      role: 'SUPER_ADMIN',
      unitId: 'unit-sma',
      unit: { id: 'unit-sma', name: 'SMA Al-Qur\'an Cipansor' },
      userRoles: [
        {
          id: 'ur-1',
          isPrimary: true,
          role: { id: 'r-1', code: 'SUPER_ADMIN', name: 'Super Admin', realm: 'GLOBAL' }
        }
      ],
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    };

    await context.addCookies([
      { name: 'accessToken', value: 'mock-jwt-token', domain: 'localhost', path: '/', expires: Math.floor(Date.now() / 1000) + 3600, sameSite: 'Lax' }
    ]);

    // Set initial state in localStorage
    await page.addInitScript(({ user }) => {
      window.localStorage.setItem('accessToken', 'mock-jwt-token');
      window.localStorage.setItem('unitId', 'unit-sma'); // Set unitId for components that need it
      window.localStorage.setItem('auth-storage', JSON.stringify({ 
        state: { 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        }, 
        version: 0 
      }));
      window.localStorage.setItem('role-storage', JSON.stringify({
        state: {
          activeRoleId: 'ur-1'
        },
        version: 0
      }));
      Object.defineProperty(navigator, 'onLine', { get: () => true });
    }, { user: mockUser });

    // 2. Helpers
    const paginated = (data: any[]) => ({
      success: true,
      data,
      meta: { total: data.length, page: 1, limit: 20, totalPages: 1, pagination: { total: data.length, page: 1, limit: 20, totalPages: 1 } }
    });

    const apiResponse = (data: any) => ({ success: true, data, message: 'Success' });
    const mockDate = "2024-01-01T00:00:00.000Z";
    const startDate = "2024-07-01T00:00:00.000Z";
    const endDate = "2025-06-30T23:59:59.000Z";

    // 3. API Interception
    await page.route('**/api/**', async route => {
      const url = route.request().url();
      
      // FOUNDATION 
      if (url.includes('/api/foundation/documents')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: '1', name: 'Akta Pendirian', type: 'AKTA_PENDIRIAN', expiryDate: '2030-01-01T00:00:00Z', fileUrl: '#' }, { id: '2', name: 'SK Kemenkumham', type: 'SK_KEMENKUMHAM', expiryDate: '2030-01-01T00:00:00Z', fileUrl: '#' }])) });
      if (url.includes('/api/foundation/board-members')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: '1', name: 'KH. Abdullah', position: 'Ketua Umum', isActive: true, startDate: mockDate }, { id: '2', name: 'Ust. Yusuf', position: 'Sekretaris', isActive: true, startDate: mockDate }])) });
      if (url.includes('/api/foundation')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ id: 'f1', name: 'Yayasan Pesantren Cipansor', legalName: 'Yayasan Pendidikan Cipansor Sejahtera', address: 'Jl. Raya Cipansor KM 12, Tasikmalaya', phone: '(0265) 1234567', email: 'yayasan@cipansor.id', website: 'https://cipansor.id', foundedDate: '1995-05-15T00:00:00.000Z', vision: 'Mewujudkan generasi Rabbani yang unggul dalam ilmu dan adab.', mission: '1. Menyelenggarakan pendidikan berkualitas.\n2. Membina hafalan Al-Qur\'an.\n3. Mengembangkan kemandirian santri.' })) });

      // UNITS
      if (url.includes('/api/units')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([
        { id: 'unit-sma', name: 'SMA Al-Qur\'an Cipansor', code: 'SMA', type: 'SMA' },
        { id: 'unit-smp', name: 'SMP IT Cipansor', code: 'SMP', type: 'SMP' },
        { id: 'unit-sd', name: 'SD IT Cipansor', code: 'SD', type: 'SD' },
        { id: 'unit-paud', name: 'PAUD/TK Cipansor', code: 'TK', type: 'PAUD' }
      ])) });

      // HR & EMPLOYEES - Deep mock for tables
      if (url.includes('/api/hr/employees')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { 
          id: 'e1', 
          nip: '198501012010011001', 
          fullName: 'Ust. Dr. Hamzah, M.Pd.', 
          position: 'Kepala Sekolah', 
          status: 'ACTIVE', 
          unit: { id: 'unit-sma', name: 'SMA Al-Qur\'an' }, 
          employeeType: 'PERMANENT', 
          joinDate: mockDate, 
          email: 'hamzah@cipansor.id' 
        }
      ])) });
      if (url.includes('/api/hr/departments')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: 'd1', name: 'Divisi Kurikulum', code: 'KUR' }, { id: 'd2', name: 'Divisi Kesantrian', code: 'KSN' }])) });
      if (url.includes('/api/hr/leaves')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        {
          id: 'l1',
          employee: { id: 'e1', fullName: 'Ust. Dr. Hamzah, M.Pd.', position: 'Kepala Sekolah' },
          leaveType: 'ANNUAL',
          startDate: '2024-05-20T00:00:00Z',
          endDate: '2024-05-22T00:00:00Z',
          totalDays: 3,
          reason: 'Keperluan Keluarga',
          status: 'APPROVED'
        }
      ])) });

      // USERS & ROLES - Deep mock for UserRolesBadges component
      if (url.includes('/api/roles')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: 'r1', name: 'Super Admin', code: 'SUPER_ADMIN', realm: 'GLOBAL' }, { id: 'r2', name: 'Unit Admin', code: 'UNIT_ADMIN', realm: 'SMA_QURAN' }])) });
      if (url.includes('/api/users')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { 
          id: 'u1', 
          name: 'System Admin', 
          email: 'admin@cipansor.id', 
          isActive: true, 
          createdAt: mockDate,
          userRoles: [
            { id: 'ur1', isPrimary: true, role: { id: 'r1', name: 'Super Admin', code: 'SUPER_ADMIN', realm: 'GLOBAL' } }
          ],
          unit: null 
        },
        { 
          id: 'u2', 
          name: 'Operator SMA', 
          email: 'sma@cipansor.id', 
          isActive: true, 
          createdAt: mockDate,
          userRoles: [
            { id: 'ur2', isPrimary: true, role: { id: 'r2', name: 'Unit Admin', code: 'UNIT_ADMIN', realm: 'SMA_QURAN' }, unit: { id: 'unit-sma', name: 'SMA Al-Qur\'an' } }
          ],
          unit: { id: 'unit-sma', name: 'SMA Al-Qur\'an' }
        }
      ])) });

      // PAUD - Ensure correct structures
      if (url.includes('/api/paud-assessment/assessments')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'a1', periodDate: mockDate, periodType: 'HARIAN', student: { user: { name: 'Daffa Al-Fatih' }, nis: 'P001', class: { name: 'Kelas Bintang' } }, aspect: 'NAM', achievementLevel: 'BSB', narrativeText: 'Menunjukkan adab yang baik dalam berdoa.' }
      ])) });
      if (url.includes('/api/paud-assessment/indicators')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: 'i1', name: 'Mengenal tuhan melalui ciptaan-Nya', aspect: 'NAM' }, { id: 'i2', name: 'Mempraktikkan gerakan ibadah', aspect: 'NAM' }])) });

      // IBADAH - Ensure correct structures
      if (url.includes('/api/ibadah/records')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
         { id: 'r1', date: mockDate, student: { name: 'Ahmad', nis: '123', class: { name: 'X-1' } }, target: { name: 'Sholat', category: 'SHOLAT' }, isCompleted: true, pointsEarned: 10, bonusEarned: 0, actualCount: 5, verificationStatus: 'VERIFIED' }
      ])) });
      if (url.includes('/api/ibadah/stats/student')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ totalPoints: 1250, totalBonusPoints: 150, currentStreak: 15, longestStreak: 25, completionRate: 95, totalRecords: 450, verifiedRecords: 420 })) });
      if (url.includes('/api/ibadah/targets')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 't1', name: 'Sholat Jamaah 5 Waktu', category: 'SHOLAT', points: 20, targetType: 'DAILY', targetCount: 5, targetUnit: 'TIMES', bonusPoints: 10 }])) });
      if (url.includes('/api/ibadah/leaderboard')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([
         { id: 'l1', student: { name: 'Ahmad', class: { name: 'X-1' }, nis: '123' }, totalPoints: 1000, streakDays: 10, completionRate: 90, rank: 1 }
      ])) });

      // DORMITORIES - Deep mock for unit and supervisor
      if (url.includes('/api/dormitories')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { 
          id: 'dorm1', 
          name: 'Gedung Abu Bakar', 
          code: 'AS-01', 
          type: 'MALE', 
          capacity: 100, 
          currentOccupancy: 85, 
          unit: { id: 'unit-sma', name: 'SMA Al-Qur\'an' }, 
          supervisor: { id: 'e2', name: 'Ust. Zainal' } 
        }
      ])) });
      if (url.includes('/api/rooms')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 'room1', name: 'Kamar Ikhlas 101', floor: 1, capacity: 4, currentOccupancy: 4 }])) });

      // VIOLATIONS - Deep mock for violationType
      if (url.includes('/api/violation-summary')) return route.fulfill({ status: 200, body: JSON.stringify({ totalViolations: 12, byCategory: [{ category: 'LIGHT', count: 10 }, { category: 'MEDIUM', count: 2 }], topViolationTypes: [], topStudents: [] }) });
      if (url.includes('/api/violations')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { 
          id: 'v1', 
          date: mockDate, 
          student: { id: 's1', name: 'Budi Santoso', nis: '123456' }, 
          violationType: { id: 'vt1', name: 'Terlambat Berjamaah', category: 'LIGHT', points: 5 }, 
          actionTaken: 'Nasehat', 
          reportedBy: { name: 'Ust. Keamanan' } 
        }
      ])) });
      if (url.includes('/api/violation-types')) return route.fulfill({ status: 200, body: JSON.stringify([
        { id: 'vt1', name: 'Terlambat Berjamaah', category: 'LIGHT', points: 5, isActive: true }
      ]) });

      // INVENTORY
      if (url.includes('/api/inventory/assets')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 'inv1', name: 'Laptop Dell Latitude', code: 'AST-SMA-001', category: 'ELECTRONIC', status: 'AVAILABLE', unit: { name: 'SMA' } }])) });

      // DASHBOARD & COMMON
      if (url.includes('/api/dashboard/stats')) return route.fulfill({ status: 200, body: JSON.stringify({ totalStudents: 1250, totalTeachers: 85, totalClasses: 32, totalUnits: 5, studentsGrowth: 5.4, attendanceRate: 98.7, activeAcademicYear: { name: '2024/2025', startDate, endDate } }) });
      if (url.includes('/api/dashboard/finance')) return route.fulfill({ status: 200, body: JSON.stringify({ totalBilled: 750000000, totalPaid: 620000000, totalUnpaid: 130000000, recentPayments: [] }) });
      if (url.includes('/api/health/summary')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ medications: { total: 45, lowStock: 5, expired: 0 }, thisMonthRecords: 120, recordsByType: [{ type: 'CHECKUP', count: 80 }, { type: 'ILLNESS', count: 40 }] })) });
      if (url.includes('/api/health')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 'h1', visitDate: mockDate, student: { name: 'Ahmad' }, type: 'CHECKUP', diagnosis: 'Sehat', status: 'HEALTHY' }])) });
      if (url.includes('/api/psb/stats')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ total: 156, enrolled: 85, accepted: 110, byStatus: { SUBMITTED: 20, INTERVIEW: 15, ACCEPTED: 110, REJECTED: 11 } })) });
      if (url.includes('/api/auth/me')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse(mockUser)) });
      if (url.includes('/api/academic-years')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 'ay1', name: '2024/2025', isActive: true, startDate, endDate }])) });
      if (url.includes('/api/students')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 's1', name: 'Ahmad Fauzi', nis: '12345', status: 'ACTIVE', currentClass: { name: 'X IPA 1' }, enrollmentDate: mockDate, user: { name: 'Ahmad Fauzi' } }])) });
      if (url.includes('/api/tahfidz/dashboard')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ totalRecords: 2840, totalStudents: 450, avgQuality: 'MUMTAZ' })) });
      if (url.includes('/api/psb/registrations')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 'p1', registrationNumber: 'REG-2024-001', fullName: 'Calon Santri Baru', status: 'SUBMITTED', createdAt: mockDate }])) });

      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
    });
  });

  const screenshotsDir = '../../docs/images';

  const pages = [
    { name: 'dashboard', url: '/dashboard' },
    { name: 'foundation', url: '/foundation' },
    { name: 'units', url: '/units' },
    { name: 'users', url: '/users' },
    { name: 'hr', url: '/hr' },
    { name: 'students', url: '/students' },
    { name: 'classes', url: '/classes' },
    { name: 'tahfidz', url: '/tahfidz' },
    { name: 'finance', url: '/finance' },
    { name: 'attendance', url: '/attendance' },
    { name: 'assessment', url: '/assessment' },
    { name: 'paud', url: '/paud/assessment' },
    { name: 'ibadah', url: '/ibadah' },
    { name: 'dormitories', url: '/dormitories' },
    { name: 'violations', url: '/violations' },
    { name: 'health', url: '/health' },
    { name: 'library', url: '/library' },
    { name: 'inventory', url: '/inventory' },
    { name: 'psb', url: '/psb' },
    { name: 'settings', url: '/settings' },
    { name: 'parent-portal', url: '/parent-portal' }, 
    { name: 'login', url: '/login' },
  ];

  for (const pageInfo of pages) {
    test(`screenshot ${pageInfo.name}`, async ({ page }) => {
      console.log(`--- TAKING SCREENSHOT: ${pageInfo.name} ---`);
      
      page.on('console', msg => {
        if (msg.type() === 'error') console.log(`[${pageInfo.name} CONSOLE] ${msg.type()}: ${msg.text()}`);
      });

      page.on('pageerror', err => {
        console.log(`[${pageInfo.name} PAGE-ERROR] ${err.stack || err.message}`);
      });

      // Use networkidle and longer timeout for dev server compilation
      await page.goto(pageInfo.url, { waitUntil: 'networkidle', timeout: 90000 });
      await page.waitForTimeout(8000); 
      
      await page.addStyleTag({ content: `div[role="alert"], #sonner-toaster, .toaster { display: none !important; }` });
      await page.screenshot({ path: `${screenshotsDir}/${pageInfo.name}.png`, fullPage: true });
      
      const isErrorVisible = await page.locator('text=Terjadi Kesalahan').first().isVisible();
      if (isErrorVisible) {
          console.log(`[WARNING] Page ${pageInfo.name} captured as CRASH SCREEN`);
      }
    });
  }
});
