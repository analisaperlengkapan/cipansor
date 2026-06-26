import { test, expect } from '@playwright/test';
import { primeAuthCookies } from './helpers/auth';

test.describe('GRC Integrated Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await primeAuthCookies(page);
    // Mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: { id: 'user-1', name: 'Super Admin', role: 'SUPER_ADMIN' },
          isAuthenticated: true
        }
      }));
    });
  });

  test('should trigger audit finding from low sharia audit score', async ({ page }) => {
    // 1. Mock the API calls
    await page.route('**/api/syariah', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{ id: 'comp-1', title: 'Zakat Management', category: 'MUAMALAH', status: 'UNDER_REVIEW' }]
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/syariah/audits', async (route) => {
      // Mocking the successful audit creation
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ data: { id: 'audit-1' } })
      });
    });

    await page.route('**/api/pengawasan/findings*', async (route) => {
      // Mock finding list to show the auto-created one
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{
            id: 'find-1',
            findingNumber: 'SHR-AUTO',
            title: 'Ketidakpatuhan Syariah: Zakat Management',
            severity: 'MAJOR'
          }]
        })
      });
    });

    // 2. Navigate to Syariah module
    await page.goto('/syariah');
    await expect(page.getByText('Zakat Management')).toBeVisible();

    // 3. Perform audit (simulated via API mock above)
    // In a real test, we'd fill the form. Here we verify the resulting finding in Pengawasan.

    // 4. Register Pengawasan mock BEFORE navigating so the initial request is intercepted
    await page.route('**/api/pengawasan', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{
            id: 'audit-1',
            title: 'Syariah Integration Audit',
            status: 'IN_PROGRESS',
            auditType: 'Kepatuhan',
            plannedDate: new Date().toISOString(),
            leadAuditor: { name: 'Auditor One' },
            findings: [{
              id: 'find-1',
              severity: 'MAJOR',
              title: 'Ketidakpatuhan Syariah: Zakat Management'
            }]
          }]
        })
      });
    });

    await page.goto('/pengawasan');
    await expect(page.getByText('Ketidakpatuhan Syariah: Zakat Management')).toBeVisible();
  });

  test('should display detailed sharia breakdown in GRC dashboard', async ({ page }) => {
     await page.route('**/api/analytics/grc', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            plans: { activeCount: 5, averageProgress: 65 },
            risks: { total: 12, criticalCount: 3, byLevel: { EXTREME: 1, HIGH: 2, MEDIUM: 5, LOW: 4 } },
            audits: { totalFindings: 8, resolvedCount: 5, unresolvedCount: 3, resolutionRate: 62.5 },
            sharia: {
              complianceRate: 75.5,
              statusDistribution: { COMPLIANT: 10, PARTIALLY: 4, NON_COMPLIANT: 2 },
              summary: {
                byCategory: {
                  MUAMALAH: { total: 4, averageScore: 85 },
                  IBADAH: { total: 6, averageScore: 45 }
                }
              }
            }
          }
        })
      });
    });

    await page.goto('/grc-dashboard');

    // Verify detailed breakdown cards
    await expect(page.getByText('Sharia Compliance Detailed Breakdown')).toBeVisible();
    await expect(page.getByText('MUAMALAH')).toBeVisible();
    await expect(page.getByText('85.0%')).toBeVisible();
    await expect(page.getByText('IBADAH')).toBeVisible();
    await expect(page.getByText('45.0%')).toBeVisible();
  });
});
