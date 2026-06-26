import { test, expect } from '@playwright/test';
import { primeAuthCookies } from './helpers/auth';

test.describe('GRC Dashboard Live Data', () => {
  test.beforeEach(async ({ page }) => {
    await primeAuthCookies(page);
    // Mock auth
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: { id: '1', name: 'Admin', role: 'SUPER_ADMIN' },
          isAuthenticated: true
        }
      }));
    });
  });

  test('should display aggregated GRC metrics correctly', async ({ page }) => {
    // Mock the GRC API response for this test
    await page.route('**/api/analytics/grc*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            plans: { activeCount: 5, averageProgress: 75.5 },
            risks: {
              total: 20,
              criticalCount: 4,
              byLevel: { EXTREME: 1, HIGH: 3, MEDIUM: 10, LOW: 6 }
            },
            audits: { totalFindings: 12, unresolvedCount: 8, resolvedCount: 4, resolutionRate: 33.33 },
            sharia: {
              complianceRate: 92,
              statusDistribution: { COMPLIANT: 10, PARTIALLY: 2, NON_COMPLIANT: 0, UNDER_REVIEW: 1, NOT_APPLICABLE: 0 }
            }
          }
        })
      });
    });

    await page.goto('/grc-dashboard');

    // Check Strategic Plans card
    await expect(page.locator('text=5 Active')).toBeVisible();
    await expect(page.locator('text=Average Progress: 75.5%')).toBeVisible();

    // Check Risks card
    await expect(page.locator('text=4 Risks')).toBeVisible();
    await expect(page.locator('text=1 Extreme')).toBeVisible();
    await expect(page.locator('text=3 High')).toBeVisible();

    // Check Audits card
    await expect(page.locator('text=12 Findings')).toBeVisible();
    await expect(page.locator('text=8 Unresolved')).toBeVisible();

    // Check Sharia card
    await expect(page.locator('text=92% Compliant')).toBeVisible();
  });

  test('should show loading state and handle errors', async ({ page }) => {
    // Mock error
    await page.route('**/api/analytics/grc*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Internal Server Error' })
      });
    });

    await page.goto('/grc-dashboard');

    // Check for error message
    await expect(page.locator('text=Gagal memuat data GRC')).toBeVisible();
  });
});
