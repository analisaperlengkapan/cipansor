import { test, expect } from '@playwright/test';

test.describe('Quality Complaints', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming global setup handles login or we mock auth
    // For this test environment, we might need to login manually if global setup fails
    // But usually we assume authenticated state or use a login helper.
    // Let's assume we are logged in as a student/user.

    // Navigate to dashboard first to ensure auth
    await page.goto('/');
  });

  test('User can create a complaint and see it in the list', async ({ page }) => {
    // 1. Go to complaints page
    await page.goto('/quality/complaints');
    await expect(page.getByRole('heading', { name: /Aduan & Aspirasi/i })).toBeVisible();

    // 2. Click Create
    await page.getByRole('button', { name: /Buat Aduan Baru/i }).click();
    await expect(page).toHaveURL(/\/quality\/complaints\/create/);

    // 3. Fill form
    await page.getByText('Pilih kategori aduan').click();
    await page.getByRole('option', { name: 'ACADEMIC' }).first().click(); // Assuming ACADEMIC is an option

    await page.getByText('Pilih prioritas').click();
    await page.getByRole('option', { name: 'HIGH' }).click();

    await page.getByLabel('Subjek').fill('E2E Test Complaint');
    await page.getByLabel('Deskripsi').fill('This is an automated test complaint description that is long enough.');

    // 4. Submit
    await page.getByRole('button', { name: 'Kirim Aduan' }).click();

    // 5. Verify Redirect and List Item
    await expect(page).toHaveURL(/\/quality\/complaints$/);
    await expect(page.getByText('E2E Test Complaint')).toBeVisible();
    await expect(page.getByText('HIGH')).toBeVisible(); // Check badge

    // 6. Check Board View
    await page.getByRole('tab', { name: 'Board' }).click();
    await expect(page.getByText('Menunggu')).toBeVisible();
    // The card should be in the "Menunggu" column
    await expect(page.locator('.bg-gray-100').getByText('E2E Test Complaint')).toBeVisible();
  });
});
