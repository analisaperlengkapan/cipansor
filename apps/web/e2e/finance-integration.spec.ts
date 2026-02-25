import { test, expect } from '@playwright/test';
import { setupMockUser, login } from './utils/auth';

test.describe('Finance & Billing Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user as a BENDAHARA (Finance Admin)
    await setupMockUser(page, { role: 'BENDAHARA', unitId: 'unit-1' });
    await login(page);
  });

  test('Billing Management - Generate Auto-Billing', async ({ page }) => {
    await page.goto('/finance/billing');

    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Billing & Pembayaran' })).toBeVisible();

    // Verify Generate Tagihan bulk action exists
    const generateBtn = page.getByRole('button', { name: /Buat Tagihan/i });
    await expect(generateBtn).toBeVisible();

    // The actual bulk click to test backend integration
    // We mock/intercept or allow it to run depending on test DB setup.
    // Generally in this E2E, we ensure UI responds correctly.
    // Assuming a test environment where we just want it to trigger the dialog/toast
    await generateBtn.click();
    
    // There should be a modal or validation dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Expect summary cards to exist
    await expect(page.locator('text=Total Tunggakan')).toBeVisible();
  });

  test('Update Student Wallet from Payment (Mocked Flow)', async ({ page }) => {
    // Navigate to a specific student profile that we know exists in DB
    // Currently testing the UI layout in Student Profile -> Finance tab
    await page.goto('/students');

    // Click the first student in the list
    await page.getByRole('row').nth(1).click();

    // Go to Finance tab
    await page.getByRole('tab', { name: 'Finance' }).click();

    // Verify new finance cards exist
    await expect(page.locator('text=Wallet (Uang Saku)')).toBeVisible();
    await expect(page.locator('text=Tagihan & Tunggakan')).toBeVisible();

    // Check action buttons
    await expect(page.getByRole('link', { name: /Kelola Saldo/i })).toBeVisible();
  });

  test('Finance Dashboard Analytics', async ({ page }) => {
    await page.goto('/finance');

    // Verify dashboard metrics exist
    await expect(page.locator('text=Total Tagihan').first()).toBeVisible();
    await expect(page.locator('text=Terbayar').first()).toBeVisible();
    await expect(page.locator('text=Belum Dibayar').first()).toBeVisible();
    await expect(page.locator('text=Jatuh Tempo').first()).toBeVisible();

    // Verify our new injected Collection Ratio card exists
    await expect(page.locator('text=Collection Ratio')).toBeVisible();
    await expect(page.locator('text=Persentase Terkumpul')).toBeVisible();
  });
});
