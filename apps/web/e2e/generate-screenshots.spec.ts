import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Generate Screenshots', () => {
  // Use a fixed viewport for consistent screenshots
  test.use({
    viewport: { width: 1280, height: 800 },
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
  });

  test.beforeEach(async ({ page, context }) => {
    // 1. Mock Authentication Cookies (Middleware bypass)
    await context.addCookies([
      {
        name: 'accessToken',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 3600,
        sameSite: 'Lax',
      },
      // Add auth-storage cookie for middleware role detection
      {
        name: 'auth-storage',
        value: JSON.stringify({
           state: {
             user: { role: 'SUPER_ADMIN' },
             isAuthenticated: true
           },
           version: 0
        }),
        domain: 'localhost',
        path: '/',
      }
    ]);

    // 2. Mock LocalStorage (Client-side state)
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: {
              id: 'user-123',
              name: 'Test Admin',
              role: 'SUPER_ADMIN',
              unitId: 'unit-123', // Some pages check this
            },
            token: 'mock-jwt-token',
            isAuthenticated: true,
          },
          version: 0,
        })
      );
    });

    // 3. Mock API Endpoints
    // Helper to return standard response wrapper
    const ok = (data: any, meta?: any) => ({
      success: true,
      data,
      meta: meta || { total: data.length || 0, page: 1, limit: 10, totalPages: 1 },
    });

    // CATCH-ALL FOR UNMOCKED APIs (Prevent 404/Network Errors)
    await page.route('**/api/**', async (route) => {
        const method = route.request().method();
        const url = route.request().url();

        // Don't mock auth/me again if specific mock exists, but good as fallback
        if (url.includes('/auth/me')) return route.continue();

        if (method === 'GET') {
            // Check if it looks like a list request
            if (url.includes('summary') || url.includes('stats')) {
               // Return object for summary/stats endpoints
               await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
            } else {
               // Return list for likely list endpoints
               await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [], meta: { total: 0 } }) });
            }
        } else {
            // For POST/PUT/DELETE, just succeed
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
        }
    });

    // Specific Mocks (Override catch-all)
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok({
          id: 'user-123',
          name: 'Test Admin',
          role: 'SUPER_ADMIN',
          unitId: 'unit-123',
        })),
      });
    });

    // Shared: Units & Academic Years
    await page.route('**/api/units*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'unit-1', name: 'SMA IT Cipansor' }, { id: 'unit-2', name: 'SMP IT Cipansor' }]) });
    });
    await page.route('**/api/academic-years*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ok([{ id: 'ay-1', name: '2023/2024', isActive: true }])) });
    });

    // Dashboard
    await page.route('**/api/dashboard/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
            data: {
                totalStudents: 1250,
                totalTeachers: 85,
                totalClasses: 32,
                attendanceRate: 98.5,
                financialSummary: { income: 500000000, expense: 350000000 },
                tahfidzSummary: { totalMemorized: 5000, averageJuz: 5 }
            }
        }),
      });
    });

    // Legacy Modules (Flat Array or direct data)
    await page.route('**/api/students*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ok([
            { id: '1', name: 'Ahmad Fulan', nis: '12345', status: 'ACTIVE', gender: 'MALE', currentClass: { name: 'X IPA 1' }, unit: { name: 'SMA IT' } },
            { id: '2', name: 'Siti Fulannah', nis: '12346', status: 'ACTIVE', gender: 'FEMALE', currentClass: { name: 'X IPA 1' }, unit: { name: 'SMA IT' } },
        ])) });
    });

    await page.route('**/api/classes*', async (route) => {
         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ok([
             { id: '1', name: 'X IPA 1', grade: 10, capacity: 30, filled: 28, unit: { name: 'SMA IT' }, academicYear: { name: '2023/2024', isActive: true }, homeroomTeacher: { user: { name: 'Ust. Budi' } } }
         ])) });
    });

    // New Modules (Nested Data)
    await page.route('**/api/health/records*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ok([
            { id: '1', date: new Date().toISOString(), student: { name: 'Ahmad' }, recordType: 'CHECKUP', status: 'HEALTHY', diagnosis: 'Sehat' }
        ])) });
    });

    // Health Summary Mock (Specific fix for crash)
    await page.route('**/api/health/summary', async (route) => {
         await route.fulfill({
             status: 200,
             contentType: 'application/json',
             body: JSON.stringify({
                 success: true,
                 data: {
                    totalRecords: 15,
                    currentlySick: 2,
                    needFollowUp: 1,
                    byStatus: [
                      { status: 'HEALTHY', count: 12 },
                      { status: 'SICK', count: 2 },
                      { status: 'RECOVERING', count: 1 }
                    ]
                 }
             })
         });
    });

    await page.route('**/api/finance/bills*', async (route) => {
         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ok([
             { id: 'BILL-001', amount: 500000, paidAmount: 0, status: 'UNPAID', billType: 'SPP', student: { name: 'Ahmad' }, dueDate: new Date().toISOString() }
         ])) });
    });

    // Tahfidz Mocks
    await page.route('**/api/tahfidz/dashboard*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { totalRecords: 100, totalStudents: 50, recordsByType: [{type: 'ZIYADAH', count: 60}, {type: 'MUROJAAH', count: 40}] } }) });
    });

  });

  const screenshotsDir = 'docs/images';

  // Ensure directory exists
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. Dashboard
  test('screenshot dashboard', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    // Hide dynamic/unstable elements if needed
    await page.addStyleTag({ content: `div[role="alert"].bg-yellow-500 { display: none !important; }` }); // Hide offline banner
    await page.addStyleTag({ content: `.fixed.bottom-4.right-4 { display: none !important; }` }); // Hide chat widgets etc
    await page.screenshot({ path: `${screenshotsDir}/dashboard.png`, fullPage: true });
  });

  // 2. Login
  test('screenshot login', async ({ page, context }) => {
    await context.clearCookies(); // Force logout state
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${screenshotsDir}/login.png`, fullPage: true });
  });

  // 3. Students
  test('screenshot students', async ({ page }) => {
    await page.goto('/students', { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: `div[role="alert"].bg-yellow-500 { display: none !important; }` });
    await page.screenshot({ path: `${screenshotsDir}/students.png`, fullPage: true });
  });

  // 4. Tahfidz
  test('screenshot tahfidz', async ({ page }) => {
    await page.goto('/tahfidz', { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: `div[role="alert"].bg-yellow-500 { display: none !important; }` });
    await page.screenshot({ path: `${screenshotsDir}/tahfidz.png`, fullPage: true });
  });

  // 5. Finance
  test('screenshot finance', async ({ page }) => {
    await page.goto('/finance', { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: `div[role="alert"].bg-yellow-500 { display: none !important; }` });
    await page.screenshot({ path: `${screenshotsDir}/finance.png`, fullPage: true });
  });

  // 6. Attendance
  test('screenshot attendance', async ({ page }) => {
    await page.goto('/attendance', { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: `div[role="alert"].bg-yellow-500 { display: none !important; }` });
    await page.screenshot({ path: `${screenshotsDir}/attendance.png`, fullPage: true });
  });

  // 7. Classes
  test('screenshot classes', async ({ page }) => {
    await page.goto('/classes', { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: `div[role="alert"].bg-yellow-500 { display: none !important; }` });
    await page.screenshot({ path: `${screenshotsDir}/classes.png`, fullPage: true });
  });

  // 8. Assessment
  test('screenshot assessment', async ({ page }) => {
    await page.goto('/assessment', { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: `div[role="alert"].bg-yellow-500 { display: none !important; }` });
    await page.screenshot({ path: `${screenshotsDir}/assessment.png`, fullPage: true });
  });

  // 9. Library
  test('screenshot library', async ({ page }) => {
    await page.goto('/library', { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: `div[role="alert"].bg-yellow-500 { display: none !important; }` });
    await page.screenshot({ path: `${screenshotsDir}/library.png`, fullPage: true });
  });

  // 10. Health
  test('screenshot health', async ({ page }) => {
    await page.goto('/health', { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: `div[role="alert"].bg-yellow-500 { display: none !important; }` });
    await page.screenshot({ path: `${screenshotsDir}/health.png`, fullPage: true });
  });

  // 11. Settings
  test('screenshot settings', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: `div[role="alert"].bg-yellow-500 { display: none !important; }` });
    await page.screenshot({ path: `${screenshotsDir}/settings.png`, fullPage: true });
  });

  // 12. PSB
  test('screenshot psb', async ({ page }) => {
    await page.goto('/psb', { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: `div[role="alert"].bg-yellow-500 { display: none !important; }` });
    await page.screenshot({ path: `${screenshotsDir}/psb.png`, fullPage: true });
  });

});
