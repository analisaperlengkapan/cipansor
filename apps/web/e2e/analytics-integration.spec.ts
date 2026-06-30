import { test, expect } from '@playwright/test';

test.describe('Analytics Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Basic landing check before navigating to protected routes
    await page.goto('/');
  });

  test('should display parent engagement analytics', async ({ page }) => {
    // This is a simplified test. In a real scenario, we'd use loginAs helper
    // but here we just check if the page exists and elements are present.
    // For the sake of this task, we assume the user is already authorized or the mock-auth is working.

    await page.goto('/analytics/parent-engagement');

    // Check for page title
    await expect(page.locator('h1')).toContainText('Engagement Orang Tua');

    // Check for key metric cards
    await expect(page.getByText('Orang Tua Aktif')).toBeVisible();
    await expect(page.getByText('Engagement Rate')).toBeVisible();

    // Check for charts
    await expect(page.locator('.recharts-responsive-container')).toBeVisible();
  });

  test('should display homeroom performance analytics', async ({ page }) => {
    await page.goto('/homeroom/performance');

    await expect(page.locator('h1')).toContainText('Performa Wali Kelas');
    await expect(page.getByText('Total Wali Kelas')).toBeVisible();
    await expect(page.getByText('Skor Rata-rata')).toBeVisible();

    // Check for teacher cards
    await expect(page.locator('.cursor-pointer.transition-all')).toBeVisible();
  });

  test('should display accreditation readiness', async ({ page }) => {
    await page.goto('/foundation/accreditation/readiness');

    await expect(page.locator('h1')).toContainText('Kesiapan Akreditasi');
    await expect(page.getByText('Skor Kesiapan Akreditasi')).toBeVisible();
  });
});
