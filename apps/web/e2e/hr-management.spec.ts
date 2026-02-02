import { test, expect } from '@playwright/test';

test.describe('HR Management Module', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming global setup handles auth or we need to login
    // Since we don't have the exact login helper here, we'll try to visit.
    // If redirected, this test assumes a valid session or public access logic (unlikely for HR).
    // Based on typical pattern, we might need to login.
    // For now, I'll assume the environment has a way to bypass or I'll add a login step if needed.
    // Replicating typical login flow if standard:

    await page.goto('/login');
    // NOTE: This assumes seed data credentials. Adjust as necessary for the environment.
    await page.getByLabel('Email').fill('admin@cipansor.id');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await page.waitForURL('/dashboard');
  });

  test('should display HR dashboard and new Attendance tab', async ({ page }) => {
    await page.goto('/hr');

    // Check Header
    await expect(page.getByRole('heading', { name: 'SDM & Kepegawaian' })).toBeVisible();

    // Check Stats
    await expect(page.getByText('Total Karyawan')).toBeVisible();

    // Check Tabs
    await expect(page.getByRole('tab', { name: 'Karyawan' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Absensi' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Cuti' })).toBeVisible();
  });

  test('should navigate to Attendance view and open Bulk Attendance dialog', async ({ page }) => {
    await page.goto('/hr');

    // Click Absensi Tab
    await page.getByRole('tab', { name: 'Absensi' }).click();

    // Check for "Absensi Massal" button
    const bulkBtn = page.getByRole('button', { name: 'Absensi Massal' });
    await expect(bulkBtn).toBeVisible();

    // Click it
    await bulkBtn.click();

    // Check Dialog Content
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Absensi Massal' })).toBeVisible();

    // Check form elements
    await expect(page.getByLabel('Tanggal Absensi')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Muat Karyawan' })).toBeVisible();
  });

  test('should view Organization Chart', async ({ page }) => {
    await page.goto('/hr/org-chart');
    await expect(page.getByRole('heading', { name: 'Struktur Organisasi' })).toBeVisible();
    // Expect at least the container or a message
    // If empty, it says "Belum ada data". If loaded, it shows nodes.
    // We check for the card container.
    await expect(page.locator('.min-w-\\[800px\\]')).toBeVisible();
  });
});
