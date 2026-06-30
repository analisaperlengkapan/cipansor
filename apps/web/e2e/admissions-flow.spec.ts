import { test, expect } from '@playwright/test';

test.describe('Admissions Flow - Payment Verification & Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@cipansor.sch.id');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should verify payment and advance registrant status', async ({ page }) => {
    // Navigate to PPDB registrations
    await page.goto('/ppdb/registrations');

    // Find a registrant in REGISTERED status
    const registrantRow = page.locator('tr:has-text("REGISTERED")').first();
    await registrantRow.click();

    // Check if we are on the detail page
    await expect(page).toHaveURL(/\/ppdb\/registrations\/.+/);

    // Verify initial status
    await expect(page.locator('text=Mendaftar')).toBeVisible();

    // Click verify payment
    await page.click('button:has-text("Cek Pembayaran Finance")');

    // Verification message
    await expect(page.locator('text=Verifikasi pembayaran diproses')).toBeVisible();
  });

  test('should show integrated admissions and CBT widgets on main dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for Admissions Widget
    await expect(page.locator('text=PPDB / PSB')).toBeVisible();
    await expect(page.locator('text=Statistik Pendaftaran Terpadu')).toBeVisible();

    // Check for CBT Widget
    await expect(page.locator('text=Online Exam (CBT)')).toBeVisible();
    await expect(page.locator('text=Monitoring Ujian Online Real-time')).toBeVisible();
  });
});
