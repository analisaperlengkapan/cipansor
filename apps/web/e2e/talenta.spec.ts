import { test, expect } from '@playwright/test';

// Helper function to mock user login directly via local storage
async function loginAsAdmin(page: any) {
  await page.addInitScript(() => {
    window.localStorage.setItem('accessToken', 'mock-token-admin');
    window.localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        user: { id: "user-1", name: "Admin Test", role: "SUPER_ADMIN", unitId: "unit-1" },
        isAuthenticated: true,
      },
      version: 0
    }));
  });
}

test.describe('Talenta Module End-to-End', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);

    // Intercept requests to mock data
    await page.route('**/api/talenta/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        json: { success: true, data: [] }
      });
    });

    await page.route('**/api/talenta/trainings*', async (route) => {
      await route.fulfill({
        status: 200,
        json: { success: true, data: [] }
      });
    });

    await page.route('**/api/talenta/successions', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          json: {
            success: true,
            data: [{
              id: 'succ-test-1',
              positionTitle: 'Kepala IT',
              priority: 'HIGH',
              readinessLevel: 'Siap Sekarang',
              targetDate: new Date().toISOString(),
              notes: 'Perlu transisi cepat',
              currentHolder: null,
              successor: null
            }]
          }
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          json: { success: true, data: { id: 'new-succ' } }
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/talenta/successions/*', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          json: { success: true, data: { id: 'succ-test-1' } }
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          json: { success: true }
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/talenta');
  });

  test('should render Talenta page properly and navigate tabs', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Manajemen Talenta' })).toBeVisible();

    // Tab Profil Talenta
    const tabProfiles = page.getByRole('tab', { name: 'Profil Talenta' });
    await expect(tabProfiles).toBeVisible();
    await tabProfiles.click();
    await expect(page.getByRole('button', { name: 'Tambah Profil' })).toBeVisible();

    // Tab Suksesi
    const tabSuccession = page.getByRole('tab', { name: 'Suksesi' });
    await expect(tabSuccession).toBeVisible();
    await tabSuccession.click();

    // Check if mocked data is rendered
    await expect(page.getByText('Kepala IT')).toBeVisible();
    await expect(page.getByText('HIGH')).toBeVisible();
  });

  test('should open dialog and submit new succession plan', async ({ page }) => {
    await page.getByRole('tab', { name: 'Suksesi' }).click();

    // Open create dialog
    await page.getByRole('button', { name: 'Tambah Suksesi' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tambah Rencana Suksesi' })).toBeVisible();

    // Fill the form
    await page.getByLabel('Jabatan').fill('Direktur Operasional');
    await page.getByRole('combobox', { name: 'Opsional' }).click();
    await page.getByRole('option', { name: 'Tinggi' }).click();

    // Submit
    await page.getByRole('button', { name: 'Simpan' }).click();

    // Verify toast success
    await expect(page.getByText('Rencana suksesi berhasil dibuat')).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should open dialog and update existing succession plan', async ({ page }) => {
    await page.getByRole('tab', { name: 'Suksesi' }).click();

    // Ensure item exists
    await expect(page.getByText('Kepala IT')).toBeVisible();

    // Hover over card and click edit button. Since we use Lucide Edit icon, let's find the button within the card.
    const card = page.locator('.group').filter({ hasText: 'Kepala IT' });
    await card.hover();

    // Click the Edit button (it should be visible on hover)
    const editBtn = card.locator('button.text-blue-500');
    await editBtn.click();

    // Dialog should be open with correct title
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Edit Rencana Suksesi' })).toBeVisible();

    // Expect the input to be pre-filled
    await expect(page.getByLabel('Jabatan')).toHaveValue('Kepala IT');

    // Change value
    await page.getByLabel('Jabatan').fill('Kepala IT (Updated)');
    await page.getByRole('button', { name: 'Simpan' }).click();

    // Verify toast success
    await expect(page.getByText('Rencana suksesi berhasil diperbarui')).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should open confirm dialog and delete succession plan', async ({ page }) => {
    await page.getByRole('tab', { name: 'Suksesi' }).click();

    // Hover over card and click delete button.
    const card = page.locator('.group').filter({ hasText: 'Kepala IT' });
    await card.hover();

    // Click the Delete button
    const deleteBtn = card.locator('button.text-destructive');
    await deleteBtn.click();

    // Confirm Dialog should be open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hapus Data?' })).toBeVisible();

    // Confirm deletion
    await page.getByRole('button', { name: 'Hapus' }).click();

    // Verify toast success
    await expect(page.getByText('Rencana suksesi berhasil dihapus')).toBeVisible();
  });
});
