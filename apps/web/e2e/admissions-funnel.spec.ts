import { test, expect } from '@playwright/test';
import { setupAuthenticatedPage } from './helpers/auth';

test.describe('Unified Admissions Funnel', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page, 'SUPER_ADMIN');
  });

  test('should display unified admissions dashboard', async ({ page }) => {
    await page.route('**/api/admissions/periods**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'p1', name: 'PSB 2025/2026', isActive: true, unit: { name: 'SD IT' }, _count: { registrants: 5 }, quota: 100 }]
        })
      });
    });

    await page.route('**/api/admissions/registrants**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'r1', fullName: 'Calon Santri A', registrationNo: 'REG-001', status: 'REGISTERED', createdAt: new Date().toISOString() }],
          meta: { total: 1 }
        })
      });
    });

    await page.goto('/admissions');

    await expect(page.getByText('Unified Admissions Management')).toBeVisible();
    await expect(page.getByText('PSB 2025/2026')).toBeVisible();
    await expect(page.getByText('Calon Santri A')).toBeVisible();
  });
});
