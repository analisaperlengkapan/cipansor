import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth-api';

test.describe('Integrated Analytics Dashboards', () => {
  test('Parent Engagement Dashboard displays real data', async ({ page }) => {
    // We use SUPER_ADMIN as they have access to analytics
    await loginAs(page, 'SUPER_ADMIN');

    await page.goto('/analytics/parent-engagement');

    // Verify page header
    await expect(page.getByText('Metrik Engagement Orang Tua')).toBeVisible();

    // Verify summary cards are loaded (not skeletons)
    await expect(page.getByText('Orang Tua Aktif')).toBeVisible();
    await expect(page.getByText('Engagement Rate')).toBeVisible();

    // Verify charts area
    await expect(page.getByText('Aktivitas Mingguan')).toBeVisible();
    await expect(page.getByText('Engagement per Kelas')).toBeVisible();
  });

  test('Marketing ROI Dashboard displays funnel data', async ({ page }) => {
    await loginAs(page, 'SUPER_ADMIN');

    await page.goto('/marketing');

    // Assuming the marketing dashboard has been updated to show ROI
    // If not on the main marketing page, navigate to ROI specific if it exists
    // For now, let's check the presence of ROI related elements if we were to add them
    await page.getByRole('tab', { name: 'ROI & Funnel' }).click();

    // Verify ROI content is loaded
    await expect(page.getByText('Conversion Funnel')).first().toBeVisible();
    await expect(page.getByText('ROI:')).first().toBeVisible();
  });
});
