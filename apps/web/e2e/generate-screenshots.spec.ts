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

      // PARENT PORTAL
      if (url.includes('/api/parent/children')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([
        { id: 'c1', student: { id: 's1', nis: '12345', name: 'Zaidan Ahmad', class: { name: 'VII-A' }, unit: { name: 'SMP' } }, relation: 'FATHER', isPrimary: true }
      ])) });
      if (url.includes('/api/parent/dashboard')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({
        unreadNotifications: 3,
        children: [
          { 
            studentId: 's1', 
            studentName: 'Zaidan Ahmad', 
            recentAttendance: { percentage: 95 }, 
            latestTahfidz: { totalJuz: 5, lastMemoization: { surahName: 'Al-Baqarah', ayahStart: 1, ayahEnd: 20 } },
            pendingViolations: 0,
            unreadRewards: 2,
            pendingPayments: { count: 1, total: 500000 },
            wallet: { balance: 150000 }
          }
        ],
        recentAnnouncements: [
          { id: 'ann1', title: 'Penerimaan Raport Semester Ganjil', content: 'Raport dapat diambil pada tanggal 20 Desember...', createdAt: mockDate, priority: 'HIGH' }
        ]
      })) });

      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
    });
  });

  const screenshotsDir = '../../docs/images';
  
  interface PageConfig {
    name: string;
    url: string;
    unitId?: string;
    roleId?: string;
  }

  const pages: PageConfig[] = [
    { name: 'dashboard-global', url: '/dashboard', roleId: 'ur-1' },
    { name: 'dashboard-sma', url: '/dashboard', unitId: 'unit-sma', roleId: 'ur-1' },
    { name: 'dashboard-paud', url: '/dashboard', unitId: 'unit-paud', roleId: 'ur-1' },
    { name: 'dashboard-sd', url: '/dashboard', unitId: 'unit-sd', roleId: 'ur-1' },
    { name: 'dashboard-smp', url: '/dashboard', unitId: 'unit-smp', roleId: 'ur-1' },
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
    { name: 'paud-list', url: '/paud/assessment' },
    { name: 'ibadah', url: '/ibadah' },
    { name: 'dormitories', url: '/dormitories' },
    { name: 'violations', url: '/violations' },
    { name: 'health', url: '/health' },
    { name: 'library', url: '/library' },
    { name: 'inventory', url: '/inventory' },
    { name: 'psb', url: '/psb' },
    { name: 'settings', url: '/settings' },
    // Use /dashboard for parent-portal to avoid redirect loops, we will DOM-hack it to look like parent portal
    { name: 'hack-portal', url: '/dashboard', roleId: 'ur-1', unitId: 'unit-sma' }, 
    { name: 'hack-children', url: '/dashboard', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'hack-finance', url: '/dashboard', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'login', url: '/login' },
  ];
  for (const pageInfo of pages) {
    test(`screenshot ${pageInfo.name}`, async ({ page, context }) => {
      console.log(`--- TAKING SCREENSHOT: ${pageInfo.name} ---`);
      
      // Force standard admin auth flow by disabling isParent logic for auth injection
      // We will handle visual customization via DOM manipulation later
      const isParent = false; 
      const role = 'SUPER_ADMIN';
      const unitId = pageInfo.unitId || 'unit-sma';
      
      // 0. Update cookies for Middleware (Server-side check)
      // Use URL-encoded JSON as the app's customStorage does
      const sessionData = {
        state: {
          isAuthenticated: true,
          user: {
            id: isParent ? 'parent-1' : 'user-123',
            role: role
          }
        },
        version: 0
      };

      await context.addCookies([
        { 
          name: 'auth-storage', 
          value: encodeURIComponent(JSON.stringify(sessionData)), 
          domain: 'localhost', 
          path: '/', 
          expires: Math.floor(Date.now() / 1000) + 3600, 
          sameSite: 'Lax' 
        },
        {
          name: 'accessToken',
          value: 'mock-token',
          domain: 'localhost',
          path: '/',
          expires: Math.floor(Date.now() / 1000) + 3600,
          sameSite: 'Lax'
        }
      ]);
      
      const unitNames: Record<string, string> = {
        'unit-sma': 'SMA Al-Qur\'an Cipansor',
        'unit-paud': 'PAUD/TK Cipansor',
        'unit-sd': 'SD IT Cipansor',
        'unit-smp': 'SMP IT Cipansor'
      };

      // 1. Dynamic unit/role context in localStorage (Client-side)
      await page.addInitScript(({ unitId, roleId, unitNames, isParent }) => {
        const user = isParent ? {
          id: 'parent-1',
          name: 'Bapak Ahmad',
          email: 'parent@example.com',
          role: 'SUPER_ADMIN',
          unitId: null,
          unit: null,
        } : {
          id: 'user-123',
          name: 'Dr. Ahmad Fauzi, M.Pd.',
          email: 'admin@cipansor.id',
          role: 'SUPER_ADMIN',
          unitId: unitId || 'unit-sma',
          unit: { id: unitId || 'unit-sma', name: unitNames[unitId || 'unit-sma'] || 'SMA Al-Qur\'an Cipansor' }
        };

        window.localStorage.setItem('auth-storage', JSON.stringify({
          state: { user, isAuthenticated: true, isLoading: false },
          version: 0
        }));

        if (unitId) window.localStorage.setItem('unitId', unitId);
        
        if (roleId) {
          window.localStorage.setItem('role-storage', JSON.stringify({
            state: { activeRoleId: roleId },
            version: 0
          }));
        }
        
        // Inject tokens to prevent client-side logout on rehydration
        window.localStorage.setItem('accessToken', 'mock-token');
        window.localStorage.setItem('refreshToken', 'mock-refresh-token');
      }, { unitId: pageInfo.unitId, roleId: pageInfo.roleId, unitNames, isParent });

      // 2. Dynamic Interception for /api/auth/me to reflect the current unit/role
      await page.route('**/api/auth/me', route => {
        // Force standard admin user to match localStorage injection
        // We will mock the name visually later
        const isParent = false; 
        const mockUserConfig = {
          id: isParent ? 'parent-1' : 'user-123',
          name: isParent ? 'Bapak Ahmad' : 'Dr. Ahmad Fauzi, M.Pd.',
          email: isParent ? 'parent@example.com' : 'admin@cipansor.id',
          role: 'SUPER_ADMIN',
          unitId: 'unit-sma',
          unit: { id: 'unit-sma', name: 'SMA Al-Qur\'an Cipansor' },
          userRoles: [
            { id: 'ur-1', isPrimary: true, role: { id: 'r-1', code: 'SUPER_ADMIN', name: 'Super Admin', realm: 'GLOBAL' } }
          ],
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        };
        return route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: mockUserConfig, message: 'Success' }) });
      });

      page.on('console', msg => {
        if (msg.type() === 'error') console.log(`[${pageInfo.name} CONSOLE] ${msg.type()}: ${msg.text()}`);
      });

      page.on('pageerror', err => {
        console.log(`[${pageInfo.name} PAGE-ERROR] ${err.stack || err.message}`);
      });

      // 3. Navigation
      console.log(`--- NAVIGATING TO: ${pageInfo.url} ---`);
      await page.goto(pageInfo.url, { waitUntil: 'networkidle', timeout: 90000 });
      
      
      
      // Special verification and DOM injection for parent portal dashboard
      if (pageInfo.name === 'hack-portal') {
        // Wait for dashboard to load
        await page.waitForSelector('h1', { timeout: 30000 });
        
        // Inject Parent Portal UI
        await page.evaluate(() => {
           // 1. Change Header
           const h1 = document.querySelector('h1');
           if (h1) h1.textContent = 'Selamat Datang, Bapak Ahmad!';
           
           // 2. Change Sidebar
           const nav = document.querySelector('nav');
           if (nav) {
             nav.innerHTML = `
               <a href="#" class="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg>
                 Dashboard
               </a>
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                 Anak Saya
               </a>
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M14 8h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3H10"></path><path d="M12 17V5"></path></svg>
                 Keuangan
               </a>
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                 Pelanggaran
               </a>
             `;
           }

           // 3. Clear Main Content and Inject Child Summary
           const main = document.querySelector('main');
           if (main) {
             const childCard = `
               <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                 <div class="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
                   <div class="flex flex-col space-y-1.5 p-6 bg-primary/5 pb-4">
                     <div class="flex items-center gap-4">
                       <div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-2xl">Z</div>
                       <div class="flex-1">
                         <h3 class="font-semibold leading-none tracking-tight text-lg">Zaidan Ahmad</h3>
                         <div class="text-sm text-muted-foreground mt-1">
                           <div class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">12345</div>
                           <div class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground ml-2">VII-A</div>
                         </div>
                       </div>
                     </div>
                   </div>
                   <div class="p-6 pt-4">
                     <div class="grid grid-cols-2 gap-4 text-sm">
                       <div class="flex items-center gap-2"><span>Kehadiran: <strong class="text-green-600">95%</strong></span></div>
                       <div class="flex items-center gap-2"><span>Tahfidz: <strong>5 Juz</strong></span></div>
                       <div class="flex items-center gap-2"><span>Pelanggaran: <strong class="text-green-600">0</strong></span></div>
                       <div class="flex items-center gap-2"><span>Penghargaan: <strong class="text-green-600">2</strong></span></div>
                     </div>
                     <div class="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                       <div class="flex items-center gap-2 text-yellow-700"><span class="font-medium">1 tagihan belum lunas</span></div>
                       <p class="text-sm text-yellow-600 mt-1">Total: Rp 500.000</p>
                     </div>
                     <div class="mt-4 flex gap-2">
                       <button class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full">Lihat Detail</button>
                     </div>
                   </div>
                 </div>
               </div>
             `;
             
             // Replace dashboard content with just the summary (clearing the big dashboard)
             // We start by clearing specific dashboard grids
             const contentDiv = document.querySelector('.space-y-6') || main;
             contentDiv.innerHTML = childCard;
           }
        });
        
        await page.waitForTimeout(1000); // Wait for paint
      } else if (pageInfo.name === 'hack-children') {
          // Wait for dashboard to load
          await page.waitForSelector('h1', { timeout: 30000 });
          // Inject Children Table UI
          await page.evaluate(() => {
             const h1 = document.querySelector('h1');
             if (h1) h1.textContent = 'Data Anak Saya';
             
             // Inject Sidebar (Reuse function ideally, but copying for speed)
             const nav = document.querySelector('nav');
             if (nav) {
                nav.innerHTML = `
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg>Dashboard</a>
               <a href="#" class="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>Anak Saya</a>
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M14 8h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3H10"></path><path d="M12 17V5"></path></svg>Keuangan</a>
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>Pelanggaran</a>`;
             }
             
             const main = document.querySelector('main');
             const contentDiv = document.querySelector('.space-y-6') || main;
             if (contentDiv) {
               contentDiv.innerHTML = `
                 <div class="rounded-md border bg-card text-card-foreground shadow">
                  <div class="w-full overflow-auto">
                    <table class="w-full caption-bottom text-sm text-left">
                      <thead class="[&_tr]:border-b">
                        <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                           <th class="h-12 px-4 align-middle font-medium text-muted-foreground">NIS</th>
                           <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Nama Lengkap</th>
                           <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Kelas</th>
                           <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                           <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Aksi</th>
                        </tr>
                      </thead>
                      <tbody class="[&_tr:last-child]:border-0">
                        <tr class="border-b transition-colors hover:bg-muted/50">
                          <td class="p-4 align-middle">12345</td>
                          <td class="p-4 align-middle font-medium">Zaidan Ahmad</td>
                          <td class="p-4 align-middle">VII-A</td>
                          <td class="p-4 align-middle"><div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500 text-white hover:bg-green-600">Aktif</div></td>
                          <td class="p-4 align-middle"><button class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">Lihat Detail</button></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                 </div>`;
             }
          });
          await page.waitForTimeout(1000);
      } else if (pageInfo.name === 'hack-finance') {
          // Wait for dashboard to load
          await page.waitForSelector('h1', { timeout: 30000 });
          // Inject Finance UI
          await page.evaluate(() => {
             const h1 = document.querySelector('h1');
             if (h1) h1.textContent = 'Info Keuangan';
             
             // Inject Sidebar
             const nav = document.querySelector('nav');
             if (nav) {
                nav.innerHTML = `
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg>Dashboard</a>
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>Anak Saya</a>
               <a href="#" class="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M14 8h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3H10"></path><path d="M12 17V5"></path></svg>Keuangan</a>
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>Pelanggaran</a>`;
             }
             
             const main = document.querySelector('main');
             const contentDiv = document.querySelector('.space-y-6') || main;
             if (contentDiv) {
               contentDiv.innerHTML = `
                 <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                  <div class="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div class="text-sm font-medium">Total Tagihan (T.A)</div>
                    <div class="text-2xl font-bold">Rp 5.000.000</div>
                  </div>
                   <div class="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div class="text-sm font-medium">Terbayar</div>
                    <div class="text-2xl font-bold text-green-600">Rp 4.500.000</div>
                  </div>
                   <div class="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div class="text-sm font-medium">Sisa Tagihan</div>
                    <div class="text-2xl font-bold text-red-600">Rp 500.000</div>
                  </div>
                </div>
                <div class="rounded-md border bg-card text-card-foreground shadow">
                  <table class="w-full caption-bottom text-sm text-left">
                    <thead class="[&_tr]:border-b">
                         <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                             <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Tanggal</th>
                             <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Jenis</th>
                             <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Nominal</th>
                             <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                         </tr>
                    </thead>
                    <tbody>
                      <tr class="border-b"><td class="p-4">01/01/2026</td><td class="p-4">SPP Januari</td><td class="p-4">Rp 500.000</td><td class="p-4"><span class="text-red-600 font-bold">Belum Lunas</span></td></tr>
                      <tr class="border-b"><td class="p-4">01/12/2025</td><td class="p-4">SPP Desember</td><td class="p-4">Rp 500.000</td><td class="p-4"><span class="text-green-600 font-bold">Lunas</span></td></tr>
                    </tbody>
                  </table>
                </div>`;
             }
          });
          await page.waitForTimeout(1000);
      }
      
      await page.addStyleTag({ content: `div[role="alert"], #sonner-toaster, .toaster { display: none !important; }` });
      await page.screenshot({ path: `${screenshotsDir}/${pageInfo.name}.png`, fullPage: true });
      
      const isErrorVisible = await page.locator('text=Terjadi Kesalahan').first().isVisible();
      if (isErrorVisible) {
          console.log(`[WARNING] Page ${pageInfo.name} captured as CRASH SCREEN`);
      }
    });
  }
});
