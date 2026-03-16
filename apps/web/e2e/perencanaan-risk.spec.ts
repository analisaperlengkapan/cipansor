import { test, expect } from '@playwright/test';

test.describe('Perencanaan & Risk Management Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as a user who can access Perencanaan and Risk Management
    await page.addInitScript(() => {
      window.localStorage.setItem('accessToken', 'mock-token');
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: {
            id: 'user-1',
            name: 'Test Admin',
            role: 'SUPER_ADMIN',
            userRoles: [{ isPrimary: true, role: { code: 'SUPER_ADMIN', name: 'Super Admin', realm: 'GLOBAL' } }]
          },
          isAuthenticated: true,
        },
        version: 0
      }));
    });
  });

  test('can navigate to create risk from a strategic plan', async ({ page }) => {
    // First we would normally go to the plan list and select a plan.
    // For testing, we mock the API response for the plan details and go directly there.
    const mockPlanId = 'plan-123';

    // Intercept API calls to provide mock data
    await page.route('**/api/perencanaan/plan-123', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          data: {
            id: mockPlanId,
            title: 'Test Strategic Plan',
            description: 'A plan for testing',
            type: 'RENSTRA',
            status: 'APPROVED',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            budget: 1000000,
            progress: 50,
            createdBy: { id: 'user-1', name: 'Admin' },
            objectives: [],
            risks: [],
            internalAudits: []
          }
        }
      });
    });

    await page.goto(`/perencanaan/${mockPlanId}`);

    // Verify we are on the detail page
    await expect(page.locator('h1')).toContainText('Test Strategic Plan');

    // Click on the 'Faktor Risiko' tab
    await page.getByRole('tab', { name: /Faktor Risiko/ }).click();

    // Verify the tab content is visible
    await expect(page.locator('text=Identifikasi & Pemetaan Risiko')).toBeVisible();

    // Click on the 'Identifikasi Risiko Baru' button
    const identifyBtn = page.getByRole('button', { name: 'Identifikasi Risiko Baru' });
    await expect(identifyBtn).toBeVisible();
    await identifyBtn.click();

    // Check that we navigated to the correct URL
    await expect(page).toHaveURL(/\/risk-management\/create\?strategicPlanId=plan-123/);

    // Verify the alert indicating the risk will be linked to a strategic plan
    await expect(page.locator('text=Ditautkan ke Perencanaan Strategis')).toBeVisible();
  });
});
