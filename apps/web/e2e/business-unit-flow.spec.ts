import { test, expect } from '@playwright/test';
import { setupAuthenticatedPage } from './helpers/auth';

test.describe('Business Unit & Integrated Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses to prevent timeouts and handle unavailable backend
    await page.route('**/api/business-units*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 'bu-1', name: 'Kantin Al-Fatih', code: 'BU-KNT-01', type: 'CANTEEN', isActive: true, unit: { name: 'Unit 1' } }
          ]
        })
      });
    });

    await page.route('**/api/perencanaan*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'plan-1',
              title: 'Rencana Strategis 2025',
              objectives: [
                { id: 'obj-1', title: 'Meningkatkan Kualitas Tahfidz', perspective: 'LEARNING', progress: 65 },
                { id: 'obj-2', title: 'Optimalisasi Unit Usaha', perspective: 'PROCESS', progress: 40 },
                { id: 'obj-3', title: 'Kepuasan Orang Tua', perspective: 'CUSTOMER', progress: 80 },
                { id: 'obj-4', title: 'Kemandirian Finansial', perspective: 'FINANCIAL', progress: 30 }
              ]
            }
          ]
        })
      });
    });

    await page.route('**/api/announcements/recent*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: '1', title: 'Selamat Datang', createdAt: new Date().toISOString() }]
        })
      });
    });

    await setupAuthenticatedPage(page, 'SUPER_ADMIN');
  });

  test('should manage business units and show in canteen', async ({ page }) => {
    // 1. Visit Business Unit management
    await page.goto('/unit-usaha', { waitUntil: 'domcontentloaded' });
    // Use more robust selectors for components that might be behind auth/loading
    const heading = page.locator('h1:has-text("Unit Usaha")');
    await expect(heading).toBeVisible({ timeout: 15000 });

    // 2. Visit Canteen POS
    await page.goto('/canteen', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("Kantin")')).toBeVisible({ timeout: 15000 });
  });

  test('should show Strategy Map in Perencanaan', async ({ page }) => {
    await page.goto('/perencanaan/strategy-map', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("Strategy Map")')).toBeVisible({ timeout: 15000 });
  });

  test('should show Executive Dashboard with consolidated data', async ({ page }) => {
    await page.goto('/foundation/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("Executive Dashboard")')).toBeVisible({ timeout: 15000 });
  });
});
