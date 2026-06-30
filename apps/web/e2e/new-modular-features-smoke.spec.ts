import { test, expect } from '@playwright/test';

test.describe('New Modular Features Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should navigate to Practicum dashboard', async ({ page }) => {
    await page.goto('/practicum');
    await expect(page.getByRole('heading', { name: /Practicum/i })).toBeVisible();
  });

  test('should navigate to Student Org dashboard', async ({ page }) => {
    await page.goto('/student-org');
    await expect(page.getByRole('heading', { name: /Governance/i })).toBeVisible();
  });

  test('should navigate to Research dashboard', async ({ page }) => {
    await page.goto('/research');
    await expect(page.getByRole('heading', { name: /Research/i })).toBeVisible();
  });
});
