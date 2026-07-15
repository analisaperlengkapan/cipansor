import { test, expect } from '@playwright/test';
import { primeAuthCookies } from './helpers/auth';

test.describe('Academic Integrated Flow', () => {
  test.beforeEach(async ({ page }) => {
    await primeAuthCookies(page);
    // Mock auth and user data BEFORE navigation to prevent redirects
    await page.addInitScript(() => {
      window.localStorage.setItem('accessToken', 'mock-token');
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: {
            id: '1',
            name: 'Admin',
            role: 'SUPER_ADMIN',
            unitId: 'unit-1'
          },
          isAuthenticated: true
        }
      }));
    });

    // Mock initial check profile request
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: '1', name: 'Admin', role: 'SUPER_ADMIN', unitId: 'unit-1' }
        })
      });
    });
  });

  test('should display Tahfidz Progress Chart on Takhosus Dashboard', async ({ page }) => {
    // Extensive mocking for all possible calls in Takhosus page
    await page.route('**/api/units', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [] }) });
    });
    await page.route('**/api/takhosus/stats', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: { total: 10, active: 8, completed: 2, averageProgress: 45 } }) });
    });
    await page.route('**/api/takhosus/dashboard-stats*', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: { recentSanads: [], topHalaqohs: [] } }) });
    });
    await page.route('**/api/takhosus/halaqoh*', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } }) });
    });
    await page.route('**/api/takhosus/enrollment*', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } }) });
    });

    // Mock analytics for tahfidz progress (fields must match TahfidzProgress.monthlyProgress type)
    await page.route(/.*\/api\/analytics\/tahfidz.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            monthlyProgress: [
              { month: '2024-01', newMemorization: 60, murajaah: 40 },
              { month: '2024-02', newMemorization: 150, murajaah: 100 },
              { month: '2024-03', newMemorization: 250, murajaah: 150 }
            ]
          }
        })
      });
    });

    // Set a long timeout for the entire test
    test.setTimeout(60000);

    await page.goto('/takhosus', { waitUntil: 'domcontentloaded' });

    // Ensure we are not redirected to login
    // If we get redirected, this will fail
    await expect(page).not.toHaveURL(/.*login.*/, { timeout: 15000 });

    // Check if we are on the right page
    // Use getByRole for better selection and avoid strict mode violations if multiple h1 exist
    const heading = page.getByRole('heading', { name: 'Program Takhosus' });
    await expect(heading).toBeVisible({ timeout: 30000 });

    // The chart is in the dashboard tab.
    // Let's check for its presence specifically.
    const chartTitle = page.getByText('Kurva Capaian Tahfidz');
    await expect(chartTitle).toBeVisible({ timeout: 45000 });

    const chartContainer = page.locator('.recharts-responsive-container');
    await expect(chartContainer).toBeVisible();
  });

  test('should display Succession Planning recommendations in HR module', async ({ page }) => {
     // Mock talent analytics
     await page.route('**/api/talenta/analytics', async (route) => {
        await route.fulfill({
           status: 200,
           contentType: 'application/json',
           body: JSON.stringify({
              success: true,
              data: {
                 total: 50,
                 distribution: {
                    HIGH_POTENTIAL: 5,
                    KEY_TALENT: 10,
                    EMERGING: 15,
                    SOLID_PERFORMER: 15,
                    NEEDS_DEVELOPMENT: 5
                 },
                 profiles: []
              }
           })
        });
     });

     // Mock succession suggestions API
     await page.route('**/api/talenta/successions/suggest*', async (route) => {
        await route.fulfill({
           status: 200,
           contentType: 'application/json',
           body: JSON.stringify({
              success: true,
              data: [
                 {
                    talentProfileId: 'tp-1',
                    name: 'Ustadz Mansur',
                    currentRole: 'Wakil Kepala Sekolah',
                    category: 'HIGH_POTENTIAL',
                    readiness: 'READY_NOW',
                    matchScore: 95
                 }
              ]
           })
        });
     });

     await page.goto('/hr/talenta');

     // Click Succession Planning tab (Radix trigger — force past the
     // WebKit "not stable" animation gate).
     await page.locator('text=Succession Planning').first().waitFor({ state: 'visible' });
     await page.locator('text=Succession Planning').first().click({ force: true });

     // Verify the search UI is visible
     await expect(page.locator('text=AI-Driven Succession Recommendations')).toBeVisible();

     // Search for a position
     await page.fill('input[placeholder*="Masukkan nama jabatan"]', 'Kepala Sekolah');
     await page.keyboard.press('Enter');

     // Verify recommendation from API
     await expect(page.locator('text=Ustadz Mansur')).toBeVisible();
     await expect(page.locator('text=Match: 95%')).toBeVisible();
  });
});
