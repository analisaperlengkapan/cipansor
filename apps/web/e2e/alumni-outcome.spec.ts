import { test, expect } from '@playwright/test';

test.describe('Alumni Outcome & Tracer Study', () => {
  test.beforeEach(async ({ page }) => {
    // Standard login flow or session restoration
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@cipansor.sch.id');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display tracer study analytics with outcome score', async ({ page }) => {
    await page.goto('/alumni');

    // Check if the tracer study section exists
    await expect(page.locator('text=Tracer Study')).toBeVisible();

    // Check for the new outcome score metric
    // Note: In a real E2E we would check for specific data, here we check for UI presence
    const outcomeCard = page.locator('div:has-text("Outcome Score")');
    await expect(outcomeCard).toBeVisible();
  });

  test('should show career and education integration in alumni profile', async ({ page }) => {
    await page.goto('/alumni');

    // Click on the first alumni in the list
    await page.locator('table tbody tr').first().click();

    // Verify tabs for Career and Education
    await expect(page.locator('button:has-text("Riwayat Karir")')).toBeVisible();
    await expect(page.locator('button:has-text("Riwayat Pendidikan")')).toBeVisible();
  });
});
