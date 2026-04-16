import { test, expect } from '@playwright/test';

test.describe('GRC Integrated Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth and user data BEFORE navigation to prevent redirects
    await page.addInitScript(() => {
      window.localStorage.setItem('accessToken', 'mock-token');
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: { id: '1', name: 'Admin', role: 'SUPER_ADMIN', unitId: 'unit-1' },
          isAuthenticated: true
        }
      }));
    });

    // Mock initial check profile request
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: '1', name: 'Admin', role: 'SUPER_ADMIN', unitId: 'unit-1' }
        })
      });
    });
  });

  test('should show AI Audit Advisor suggestions on GRC Dashboard', async ({ page }) => {
    // Mock the GRC API response with suggestions
    await page.route('**/api/analytics/grc*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            plans: { activeCount: 2, averageProgress: 50 },
            risks: {
              total: 5,
              criticalCount: 1,
              byLevel: { EXTREME: 1, HIGH: 0, MEDIUM: 2, LOW: 2 }
            },
            audits: { totalFindings: 5, unresolvedCount: 2, resolvedCount: 3, resolutionRate: 60 },
            sharia: {
              complianceRate: 85,
              statusDistribution: { COMPLIANT: 5, PARTIALLY: 1, NON_COMPLIANT: 0, UNDER_REVIEW: 0, NOT_APPLICABLE: 0 }
            },
            auditSuggestions: [
              {
                priority: 'URGENT',
                riskCode: 'RSK-001',
                suggestedTitle: 'Audit Kepatuhan & Mitigasi: RSK-001',
                suggestedDescription: 'Audit internal khusus untuk memverifikasi efektivitas mitigasi risiko data leak'
              }
            ]
          }
        })
      });
    });

    await page.goto('/grc-dashboard');

    // Verify AI Audit Advisor section
    await expect(page.locator('text=AI Audit Advisor')).toBeVisible();
    await expect(page.locator('text=Audit Kepatuhan & Mitigasi: RSK-001')).toBeVisible();
    await expect(page.locator('text=URGENT')).toBeVisible();
  });

  test('should display Financial Realization on Planning detail page', async ({ page }) => {
    const mockPlanId = 'plan-123';

    // Mock single plan detail with financial progress
    await page.route(`**/api/perencanaan/${mockPlanId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: mockPlanId,
            title: 'Rencana Strategis 2024',
            type: 'RENSTRA',
            status: 'IN_PROGRESS',
            progress: 45,
            financialProgress: 62,
            totalBudget: 100000000,
            totalRealization: 62000000,
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-12-31T23:59:59.000Z',
            description: 'Test plan description',
            objectives: [
              {
                id: 'obj-1',
                title: 'Objective 1',
                progress: 45,
                financialProgress: 62,
                totalBudget: 100000000,
                totalRealization: 62000000,
                activities: [
                  {
                    id: 'act-1',
                    title: 'Activity 1',
                    status: 'IN_PROGRESS',
                    priority: 'HIGH',
                    budget: 100000000,
                    realization: 62000000
                  }
                ]
              }
            ]
          }
        })
      });
    });

    await page.goto(`/perencanaan/${mockPlanId}`);

    // Verify Financial Realization components in the main summary card
    await expect(page.locator('text=Realisasi Anggaran (Financial Realization)')).toBeVisible();
    await expect(page.locator('text=62%').first()).toBeVisible();

    // Click Program & Kegiatan tab to see activity-level realization
    await page.click('button:has-text("Program & Kegiatan")');
    await expect(page.locator('text=Realisasi: 62%')).toBeVisible();
  });
});
