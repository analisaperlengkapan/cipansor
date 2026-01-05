import { test, expect, Page } from '@playwright/test';

const MOCK_USER = {
  id: 'user-123',
  name: 'Admin Cipansor',
  email: 'admin@cipansor.id',
  role: 'SUPER_ADMIN',
  avatar: 'https://ui.shadcn.com/avatars/01.png',
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

async function setupMocks(page: Page) {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ json: { success: true, data: MOCK_USER } });
  });
  await page.route('**/api/health', async (route) => {
    await route.fulfill({ status: 200 });
  });
  // Catch-all success
  await page.route('**/api/**', async (route) => {
      await route.fulfill({ json: { success: true, data: [] } });
  });
}

const PAGES = [
  '/dashboard',
  '/students',
  '/tahfidz',
  '/finance',
  '/attendance',
  '/classes',
  '/assessment',
  '/library',
  '/health',
  '/settings',
  '/psb',
];

test.describe('Verify No Errors', () => {
  for (const path of PAGES) {
    test(`verify ${path}`, async ({ page }) => {
      // Enable logging all types
      page.on('console', msg => {
        console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
      });
      page.on('pageerror', exception => {
        console.log(`[PAGE ERROR] ${exception}`);
      });

      await setupMocks(page);

      // Inject auth
      await page.context().addCookies([
          { name: 'accessToken', value: 'mock-token', url: 'http://localhost:3000' },
          { name: 'auth-storage', value: MOCK_AUTH_STORAGE, url: 'http://localhost:3000' }
      ]);
      await page.addInitScript((data) => {
          localStorage.setItem('accessToken', 'mock-token');
          localStorage.setItem('auth-storage', data);
      }, MOCK_AUTH_STORAGE);

      await page.goto(path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      // Assert no "Terjadi Kesalahan"
      const bodyText = await page.textContent('body');
      if (bodyText?.includes('Terjadi Kesalahan')) {
          console.log(`[VERIFY FAILED] ${path} contains "Terjadi Kesalahan"`);
      }
      expect(bodyText).not.toContain('Terjadi Kesalahan');
    });
  }
});
