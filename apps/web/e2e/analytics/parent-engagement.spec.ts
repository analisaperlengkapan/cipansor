import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth-api';

test.describe('Parent Engagement Analytics', () => {
  test('should display parent engagement analytics for admin', async ({ page }) => {
    // Authenticate as UNIT_ADMIN
    await loginAs(page, 'UNIT_ADMIN');

    // Mock API response for parent engagement
    await page.route('**/api/analytics/parent-engagement*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            summary: {
              totalParents: 100,
              activeParents: 80,
              engagementRate: 80,
              avgResponseTime: 2.5,
              monthlyTrend: '+5%',
            },
            metrics: {
              portalLogins: { value: 1000, change: 10, label: 'Login Portal' },
              reportViews: { value: 500, change: 5, label: 'Lihat Laporan' },
              billPayments: { value: 50, change: -2, label: 'Pembayaran' },
              messageSent: { value: 30, change: 15, label: 'Pesan Guru' },
            },
            weeklyActivity: [],
            classBreakdown: [
              { class: 'Class A', engagement: 90, parents: 30 },
            ],
            lowEngagement: [],
          },
        }),
      });
    });

    // Navigate to Parent Engagement page
    await page.goto('/analytics/parent-engagement');

    // Verify page content
    await expect(page.locator('h1')).toContainText('Metrik Engagement Orang Tua');
    // Using a more specific locator for the engagement rate to avoid ambiguity
    await expect(page.locator('text=80%').first()).toBeVisible();
    await expect(page.getByText('1,000')).toBeVisible(); // Portal logins
    await expect(page.getByText('Class A')).toBeVisible(); // Class breakdown
  });
});
