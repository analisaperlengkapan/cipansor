import { test, expect, Page } from '@playwright/test';
import * as path from 'path';

// Adjusted path to point to root docs/images from apps/web
const SCREENSHOT_DIR = path.join(process.cwd(), '../../docs/images');

// Mock Data
const MOCK_USER = {
  id: 'user-123',
  name: 'Admin Cipansor',
  email: 'admin@cipansor.id',
  role: 'SUPER_ADMIN',
  avatar: 'https://ui.shadcn.com/avatars/01.png',
  username: 'admin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  unit: {
    id: 'unit-1',
    name: 'SMA IT Cipansor',
    type: 'SMA_IT'
  },
  userRoles: [
      {
          id: 'ur-1',
          isPrimary: true,
          role: {
              id: 'r-1',
              code: 'SUPER_ADMIN',
              name: 'Super Admin',
              realm: 'GLOBAL'
          },
          unit: null
      }
  ]
};

const MOCK_AUTH_STORAGE = JSON.stringify({
    state: {
        user: MOCK_USER,
        isAuthenticated: true
    },
    version: 0
});

// Universal mock response that satisfies lists, stats, summaries
const MOCK_UNIVERSAL_RESPONSE = {
    success: true,
    data: {
        // List response structure
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 1 },

        // Stats/Summary structure
        summary: { total: 0, count: 0 },
        stats: { total: 0, count: 0 },
        totalRecords: 0,

        // Fallback properties to prevent undefined access
        length: 0,
    }
};

const MOCK_DASHBOARD_STATS = {
  success: true,
  data: {
    totalStudents: 450,
    totalTeachers: 35,
    totalClasses: 12,
    activeStudents: 448,
    attendanceRate: 98.5,
    averageGrade: 85.4,
    studentsGrowth: 5.2,
    totalUnits: 4,
    activeAcademicYear: { name: '2023/2024', startDate: '2023-07-01', endDate: '2024-06-30' },
    financialSummary: {
      income: 150000000,
      expense: 45000000,
      balance: 105000000,
    },
    tahfidzSummary: {
      completed30Juz: 12,
      activeMemorizing: 300,
      averageJuz: 5.5,
    },
  },
};

const MOCK_STUDENTS = {
  success: true,
  data: {
    data: [
      { id: '1', name: 'Ahmad Fulan', nis: '12345', gender: 'MALE', status: 'ACTIVE', unit: { name: 'SMP IT' }, class: { name: '7A' } },
      { id: '2', name: 'Siti Fulanah', nis: '12346', gender: 'FEMALE', status: 'ACTIVE', unit: { name: 'SMA IT' }, class: { name: '10B' } },
      { id: '3', name: 'Budi Santoso', nis: '12347', gender: 'MALE', status: 'ACTIVE', unit: { name: 'SD IT' }, class: { name: '5C' } },
      { id: '4', name: 'Dewi Sartika', nis: '12348', gender: 'FEMALE', status: 'ACTIVE', unit: { name: 'TK' }, class: { name: 'B1' } },
    ],
    meta: { total: 4, page: 1, limit: 10, totalPages: 1 },
  },
};

const MOCK_TAHFIDZ = {
  success: true,
  data: {
    summary: { totalHafalan: 1200, averageHafalan: 5, targetAchieved: 85 },
    recentRecords: [
       { id: '1', student: { name: 'Ahmad Fulan' }, type: 'ZIYADAH', juz: 30, page: 1, surah: 'An-Naba', verses: '1-10', score: 90, date: new Date().toISOString() },
       { id: '2', student: { name: 'Siti Fulanah' }, type: 'MUROJAAH', juz: 29, page: 2, surah: 'Al-Mulk', verses: '1-30', score: 85, date: new Date().toISOString() },
    ],
    dashboardStats: {
        totalStudents: 150,
        activeStudents: 145,
        averageJuz: 3.5,
        completed30Juz: 10,
        recentActivity: []
    }
  },
};

const MOCK_FINANCE = {
  success: true,
  data: {
    totalBilled: 50000000,
    totalPaid: 35000000,
    totalUnpaid: 15000000,
    summary: { totalRevenue: 50000000, totalExpense: 20000000, netIncome: 30000000 },
    transactions: [
      { id: '1', type: 'INCOME', amount: 500000, description: 'SPP Bulan Ini - Ahmad', date: new Date().toISOString(), status: 'COMPLETED' },
      { id: '2', type: 'EXPENSE', amount: 150000, description: 'Beli ATK', date: new Date().toISOString(), status: 'COMPLETED' },
    ],
  },
};

const MOCK_ATTENDANCE = {
  success: true,
  data: {
    summary: { present: 400, sick: 5, permission: 2, alpha: 1 },
    records: [
       { id: '1', student: { name: 'Ahmad Fulan' }, status: 'PRESENT', date: new Date().toISOString(), time: '07:00' },
       { id: '2', student: { name: 'Siti Fulanah' }, status: 'SICK', date: new Date().toISOString(), time: null },
    ],
    stats: [
        { date: new Date().toISOString(), present: 40, sick: 1, excused: 1, absent: 0 }
    ]
  },
};

async function setupMocks(page: Page) {
  // Catch-all for other API calls (Register FIRST)
  await page.route('**/api/**', async (route) => {
      // console.log(`[CATCH-ALL] Handled unmocked request: ${route.request().url()}`);
      await route.fulfill({ json: MOCK_UNIVERSAL_RESPONSE });
  });

  // Mock Auth
  await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ json: { success: true, data: MOCK_USER } });
  });

  // Mock Health check for Online Status
  await page.route('**/api/health', async (route) => {
      await route.fulfill({ status: 200 });
  });

  // Mock Dashboard
  await page.route('**/api/dashboard/**', async (route) => route.fulfill({ json: MOCK_DASHBOARD_STATS }));
  await page.route('**/api/analytics/**', async (route) => route.fulfill({ json: MOCK_DASHBOARD_STATS }));

  // Students & Classes
  await page.route('**/api/students*', async (route) => route.fulfill({ json: MOCK_STUDENTS }));
  await page.route('**/api/classes*', async (route) => route.fulfill({ json: { success: true, data: { data: [], meta: { total: 0 } } } }));

  // Tahfidz
  await page.route('**/api/tahfidz*', async (route) => route.fulfill({ json: MOCK_TAHFIDZ }));

  // Finance
  await page.route('**/api/finance*', async (route) => route.fulfill({ json: MOCK_FINANCE }));
  await page.route('**/api/transactions*', async (route) => route.fulfill({ json: MOCK_FINANCE }));

  // Attendance
  await page.route('**/api/attendance*', async (route) => route.fulfill({ json: MOCK_ATTENDANCE }));

  // Health
  await page.route('**/api/health*', async (route) => route.fulfill({ json: MOCK_UNIVERSAL_RESPONSE }));

  // Library
  await page.route('**/api/library*', async (route) => route.fulfill({ json: MOCK_UNIVERSAL_RESPONSE }));

  // PSB
  await page.route('**/api/psb*', async (route) => route.fulfill({ json: MOCK_UNIVERSAL_RESPONSE }));
}

const PAGES_TO_SCREENSHOT = [
  { path: '/login', name: 'login', fullPage: true },
  { path: '/dashboard', name: 'dashboard', fullPage: false },
  { path: '/students', name: 'students', fullPage: true },
  { path: '/tahfidz', name: 'tahfidz', fullPage: true },
  { path: '/finance', name: 'finance', fullPage: true },
  { path: '/attendance', name: 'attendance', fullPage: true },
  { path: '/classes', name: 'classes', fullPage: true },
  { path: '/assessment', name: 'assessment', fullPage: true },
  { path: '/library', name: 'library', fullPage: true },
  { path: '/health', name: 'health', fullPage: true },
  { path: '/settings', name: 'settings', fullPage: true },
  { path: '/psb', name: 'psb', fullPage: true },
];

test.describe('Generate Screenshots', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const pageConfig of PAGES_TO_SCREENSHOT) {
    test(`screenshot ${pageConfig.name}`, async ({ page }) => {
      console.log(`Navigating to ${pageConfig.path}...`);

      await setupMocks(page);

      if (pageConfig.name !== 'login') {
         await page.context().addCookies([
             { name: 'accessToken', value: 'mock-token', url: 'http://localhost:3000' },
             { name: 'auth-storage', value: MOCK_AUTH_STORAGE, url: 'http://localhost:3000' }
         ]);
         await page.addInitScript((data) => {
             localStorage.setItem('accessToken', 'mock-token');
             localStorage.setItem('auth-storage', data);
         }, MOCK_AUTH_STORAGE);
      } else {
         await page.context().clearCookies();
         await page.addInitScript(() => {
             localStorage.clear();
         });
      }

      await page.goto(pageConfig.path, { waitUntil: 'networkidle' });

      await page.addStyleTag({
          content: `
            div[role="alert"].bg-yellow-500 { display: none !important; }
            .fixed.bottom-4.right-4 { display: none !important; }
          `
      });

      await page.waitForTimeout(2000);

      const screenshotPath = path.join(SCREENSHOT_DIR, `${pageConfig.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: pageConfig.fullPage });
      console.log(`Saved screenshot to ${screenshotPath}`);
    });
  }
});
