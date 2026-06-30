import { test, expect } from './fixtures/auth.fixture';
import { loginAs } from './helpers/auth-api';
import { navigateTo } from './helpers/page-helpers';

test.describe('Enhanced GRC and Finance Flows', () => {
  test('should verify GRC Dashboard health components', async ({ page }) => {
    // 1. Login as Admin
    const login = await loginAs(page, 'superAdmin');

    // 2. Navigate to Analytics GRC
    await navigateTo(page, '/analytics/grc');
    await expect(page.getByText('GRC Executive Dashboard')).toBeVisible();

    // Verify our new components are rendering
    await expect(page.getByText('Org Health Score')).toBeVisible();
    await expect(page.getByText('Health Trend (6 Months)')).toBeVisible();
    await expect(page.getByText('Risk Profile')).toBeVisible();
  });

  test('should verify Categorized Cash Flow Report', async ({ page }) => {
    await loginAs(page, 'superAdmin');

    // 2. Navigate to Finance Reports
    await navigateTo(page, '/finance/reports/cash-flow');
    await expect(page.getByText('Laporan Arus Kas')).toBeVisible();

    // Check for the new categorized sections or empty state with headers
    // The items might not exist in empty dev DB but headers should
    await expect(page.getByText('Periode:')).toBeVisible();
  });
});
