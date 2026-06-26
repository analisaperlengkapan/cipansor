import { test, expect } from '@playwright/test';
import { setupAuthenticatedPage } from './helpers/auth';

test.describe('Marketing ROI & Boarding Command Center', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page, 'SUPER_ADMIN');
  });

  test('should display Boarding Command Center metrics', async ({ page }) => {
    await page.route('**/api/dormitories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 'd1', name: 'Asrama Al-Fatih', code: 'AF1', gender: 'MALE', _count: { rooms: 10 } }
          ]
        })
      });
    });

    await page.goto('/musyrif/boarding-center');

    await expect(page.getByText('Boarding Command Center')).toBeVisible();
    await expect(page.getByText('All Zones Active')).toBeVisible();
    await expect(page.getByText('Asrama Al-Fatih')).toBeVisible();
    await expect(page.getByText('Social Harmony Score', { exact: true })).toBeVisible();
  });
});
