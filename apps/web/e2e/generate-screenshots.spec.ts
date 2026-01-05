import { test, expect, Page } from '@playwright/test';
import * as path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), '../../docs/images');

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

const MOCK_LEGACY_LIST = {
    success: true,
    data: [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' }
    ],
    meta: { total: 2, page: 1, limit: 10, totalPages: 1 }
};

const MOCK_NEW_LIST = {
    success: true,
    data: {
        data: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' }
        ],
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 }
    }
};

const MOCK_STUDENTS_LIST = {
    success: true,
    data: [
      { id: '1', name: 'Ahmad Fulan', nis: '12345', gender: 'MALE', status: 'ACTIVE', unit: { name: 'SMP IT' }, class: { name: '7A' } },
      { id: '2', name: 'Siti Fulanah', nis: '12346', gender: 'FEMALE', status: 'ACTIVE', unit: { name: 'SMA IT' }, class: { name: '10B' } },
    ],
    meta: { total: 2, page: 1, limit: 10, totalPages: 1 }
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

async function setupMocks(page: Page) {
  // Catch-all: return NEW structure by default
  await page.route('**/api/**', async (route) => {
      await route.fulfill({ json: MOCK_NEW_LIST });
  });

  // Auth
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ json: { success: true, data: MOCK_USER } });
  });

  // Health Status
  await page.route('**/api/health', async (route) => {
    await route.fulfill({ status: 200 });
  });

  // Dashboard
  await page.route('**/api/dashboard/**', async (route) => route.fulfill({ json: MOCK_DASHBOARD_STATS }));
  await page.route('**/api/analytics/**', async (route) => route.fulfill({ json: MOCK_DASHBOARD_STATS }));

  // SHARED RESOURCES (Legacy)
  await page.route('**/api/units*', async (route) => route.fulfill({ json: MOCK_LEGACY_LIST }));
  await page.route('**/api/academic-years*', async (route) => route.fulfill({ json: MOCK_LEGACY_LIST }));
  await page.route('**/api/curriculum/subjects*', async (route) => route.fulfill({ json: MOCK_LEGACY_LIST }));

  // LEGACY MODULES
  await page.route('**/api/students*', async (route) => route.fulfill({ json: MOCK_STUDENTS_LIST }));
  await page.route('**/api/classes*', async (route) => route.fulfill({ json: MOCK_LEGACY_LIST }));
  await page.route('**/api/assessment/exams*', async (route) => route.fulfill({ json: MOCK_LEGACY_LIST }));
  await page.route('**/api/assessment/grades*', async (route) => route.fulfill({ json: MOCK_LEGACY_LIST }));
  await page.route('**/api/assessment/report-cards*', async (route) => route.fulfill({ json: MOCK_LEGACY_LIST }));

  // NEW MODULES
  await page.route('**/api/tahfidz*', async (route) => route.fulfill({ json: MOCK_NEW_LIST }));
  await page.route('**/api/attendance*', async (route) => route.fulfill({ json: MOCK_NEW_LIST }));
  await page.route('**/api/health/records*', async (route) => route.fulfill({ json: MOCK_NEW_LIST }));
  await page.route('**/api/library*', async (route) => route.fulfill({ json: MOCK_NEW_LIST }));
  await page.route('**/api/psb*', async (route) => route.fulfill({ json: MOCK_NEW_LIST }));

  // Finance
  // Stats -> Object
  await page.route('**/api/finance/stats', async (route) => route.fulfill({ json: MOCK_DASHBOARD_STATS }));
  // Transactions -> New List
  await page.route('**/api/finance/transactions*', async (route) => route.fulfill({ json: MOCK_NEW_LIST }));
  // Root finance -> Legacy List (if using legacy hook)
  await page.route('**/api/finance', async (route) => route.fulfill({ json: MOCK_LEGACY_LIST }));
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
    });
  }
});
