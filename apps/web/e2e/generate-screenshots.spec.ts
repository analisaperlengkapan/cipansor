import { test, expect, Page } from '@playwright/test';
import * as path from 'path';

// Adjusted path to point to root docs/images from apps/web
const SCREENSHOT_DIR = path.join(process.cwd(), '../../docs/images');

// Mock Data
const MOCK_SESSION = {
  user: {
    id: 'user-123',
    name: 'Admin Cipansor',
    email: 'admin@cipansor.id',
    role: 'SUPER_ADMIN',
    image: 'https://ui.shadcn.com/avatars/01.png',
  },
  expires: '2099-01-01T00:00:00.000Z',
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
  },
};

const MOCK_FINANCE = {
  success: true,
  data: {
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
  },
};

async function setupMocks(page: Page) {
  // Mock Auth Session
  await page.route('/api/auth/session', async (route) => {
    await route.fulfill({ json: MOCK_SESSION });
  });

  // Mock Common API endpoints
  // Note: These URLs are guesses based on standard conventions.
  // If the app uses different endpoints, the screenshot might show loading states, but often headers/layout will still render.

  // Dashboard
  await page.route('**/api/dashboard/**', async (route) => route.fulfill({ json: MOCK_DASHBOARD_STATS }));
  await page.route('**/api/analytics/**', async (route) => route.fulfill({ json: MOCK_DASHBOARD_STATS }));

  // Students
  await page.route('**/api/students*', async (route) => route.fulfill({ json: MOCK_STUDENTS }));

  // Tahfidz
  await page.route('**/api/tahfidz*', async (route) => route.fulfill({ json: MOCK_TAHFIDZ }));

  // Finance
  await page.route('**/api/finance*', async (route) => route.fulfill({ json: MOCK_FINANCE }));
  await page.route('**/api/transactions*', async (route) => route.fulfill({ json: MOCK_FINANCE }));

  // Attendance
  await page.route('**/api/attendance*', async (route) => route.fulfill({ json: MOCK_ATTENDANCE }));
}

const PAGES_TO_SCREENSHOT = [
  { path: '/login', name: 'login', fullPage: true },
  { path: '/dashboard', name: 'dashboard', fullPage: false }, // Dashboard usually fits or has scroll
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
  test.beforeEach(async ({ page }) => {
     // Set a nice desktop viewport
     await page.setViewportSize({ width: 1440, height: 900 });
     await setupMocks(page);
  });

  for (const pageConfig of PAGES_TO_SCREENSHOT) {
    test(`screenshot ${pageConfig.name}`, async ({ page }) => {
      console.log(`Navigating to ${pageConfig.path}...`);

      if (pageConfig.path === '/login') {
         // Ensure we are logged out for login page
         await page.route('/api/auth/session', async (route) => route.fulfill({ json: {} }));
      }

      await page.goto(pageConfig.path, { waitUntil: 'networkidle' });

      // Wait a bit for animations
      await page.waitForTimeout(1000);

      const screenshotPath = path.join(SCREENSHOT_DIR, `${pageConfig.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: pageConfig.fullPage });
      console.log(`Saved screenshot to ${screenshotPath}`);
    });
  }
});
