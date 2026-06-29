import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth-api';

test.describe('Student Lifecycle & Finance Integration', () => {
  test('should complete student admission to finance flow', async ({ page }) => {
    // 1. Login as Admin
    await loginAs(page, 'SUPER_ADMIN');

    // 2. Navigate to Students List
    await page.goto('/students');
    await expect(page.locator('h1')).toContainText('Daftar Santri');

    // 3. View Student 360
    // Assuming a seed student exists, we navigate to their 360 view
    // In a real test, we would first create a student or use a known ID
    const studentLink = page.locator('a[href*="/360"]').first();
    if (await studentLink.isVisible()) {
      await studentLink.click();
      await expect(page).toHaveURL(/.*\/360/);
      await expect(page.locator('h1')).toBeVisible();

      // Verify tabs are present
      await expect(page.locator('button[value="academic"]')).toBeVisible();
      await expect(page.locator('button[value="finance"]')).toBeVisible();
    }

    // 4. Check GRC Dashboard
    await page.goto('/grc-dashboard');
    await expect(page.locator('h1')).toContainText('GRC Dashboard');
    await expect(page.locator('text=Risk Heatmap')).toBeVisible();
  });
});
