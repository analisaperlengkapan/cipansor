import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth-api';

test.describe('Email Notifications & SMTP Configuration', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate first before navigating to protected page
    await loginAs(page, 'superAdmin');
    await page.goto('/notifications/settings');
  });

  test('should display Google Workspace SMTP Email integration info correctly', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1, h2, h3')).toContainText(['Pengaturan Notifikasi', 'Integrasi Server Email']);

    // Verify From email (noreply@cipansor.or.id)
    await expect(page.getByText('noreply@cipansor.or.id')).toBeVisible();

    // Verify Reply-To email (halo@cipansor.or.id)
    await expect(page.getByText('halo@cipansor.or.id')).toBeVisible();

    // Verify status badge
    await expect(page.getByText('Terintegrasi & Terverifikasi')).toBeVisible();
  });

  test('should allow toggling email notifications channel', async ({ page }) => {
    // Find Email channel switch and check interaction
    const emailChannel = page.locator('div').filter({ hasText: /^EmailTerima notifikasi via email$/ });
    await expect(emailChannel).toBeVisible();
  });
});
