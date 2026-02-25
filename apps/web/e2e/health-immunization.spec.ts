import { test, expect } from './fixtures/auth.fixture';
import { LoginPage } from './page-objects';

test.describe('Health Module - Immunization', () => {
  test('should navigate to immunization page and display empty state or list', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');

    await page.waitForURL('/dashboard');
    await page.goto('/health/immunization');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Data Imunisasi' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tambah Data' })).toBeVisible();

    // Check if table exists
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });
});
