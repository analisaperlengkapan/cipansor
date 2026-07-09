import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth-api';

test.describe('Finance Reports', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'superAdmin');
  });

  test('should display all enhanced financial reports', async ({ page }) => {
    await page.goto('/finance/reports');

    // Check for title
    await expect(page.locator('h1')).toContainText('Pusat Laporan Keuangan');

    // Check for tabs
    await expect(page.getByRole('tab', { name: 'Aktivitas' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Arus Kas' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'ZISWAF' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Unit Usaha' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'CALK' })).toBeVisible();

    // Activities Tab
    await page.getByRole('tab', { name: /laba rugi|aktivitas/i }).click();
    await expect(page.getByText('Laporan Penghasilan Komprehensif')).toBeVisible();

    // ZISWAF Tab
    await page.getByRole('tab', { name: 'ZISWAF' }).click();
    await expect(page.getByText('Laporan Sumber dan Penyaluran Dana ZISWAF')).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();

    // CALK Tab
    await page.getByRole('tab', { name: 'CALK' }).click();
    await expect(page.getByText('Catatan Atas Laporan Keuangan')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });
});
