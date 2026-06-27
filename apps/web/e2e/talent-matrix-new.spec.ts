import { test, expect } from '@playwright/test';
import { primeAuthCookies } from './helpers/auth';

test.describe('Talent Management Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    await primeAuthCookies(page);

    // Low-priority fallback for incidental API calls. Registered first so the
    // specific mocks (registered later, in each test) take precedence. Without
    // it a stray 401 triggers the axios refresh->logout flow and redirects to
    // /login, wiping the page under test.
    await page.route('**/api/**', async (route) => {
      await route.fulfill({ json: { success: true, data: [] } });
    });
    await page.route('**/api/auth/refresh', async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: { accessToken: 'mock-token', refreshToken: 'mock-token' },
        },
      });
    });
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: { id: 'user-1', name: 'HR Admin', role: 'UNIT_ADMIN' },
        },
      });
    });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: { id: 'user-1', name: 'HR Admin', role: 'UNIT_ADMIN' },
          isAuthenticated: true
        }
      }));
    });
  });

  test('should render the 9-box talent matrix grid', async ({ page }) => {
    await page.route('**/api/talenta/analytics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            total: 10,
            distribution: { HIGH_POTENTIAL: 2, KEY_TALENT: 3 },
            profiles: [
              { id: 'p1', name: 'Ahmad Star', currentRole: 'Guru', performanceScore: 90, potentialScore: 90, category: 'HIGH_POTENTIAL' },
              { id: 'p2', name: 'Budi Good', currentRole: 'Staff', performanceScore: 70, potentialScore: 70, category: 'KEY_TALENT' }
            ]
          }
        })
      });
    });

    await page.goto('/talenta/matrix');

    // Wait for the page to load - check for header text (regex because it might be longer)
    await expect(page.getByText(/Talent Matrix/i).first()).toBeVisible();

    // Check summary card - search for text anywhere in the page since it's a dashboard style
    await expect(page.getByText(/Total Talenta/i).first()).toBeVisible();

    // The matrix uses uppercase for the span internally or card labels
    // Looking at talent-matrix.tsx: <span className="text-xs font-bold uppercase tracking-wider">{cell.label}</span>
    // Note: getByText is case-insensitive by default in Playwright, but we match exactly what is in the code
    await expect(page.getByText('High Potential').first()).toBeVisible();
    await expect(page.getByText('Key Talent').first()).toBeVisible();

    // Ahmad Star should be present in the High Potential card as initials "AS"
    // Use first() if there are multiple "AS" (unlikely but safe)
    await expect(page.getByText('AS').first()).toBeVisible();
  });

  test('should show financial realization in litbang project', async ({ page }) => {
    await page.route('**/api/litbang/projects/proj-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'proj-1',
            title: 'Research on Islamic Fintech',
            status: 'IN_PROGRESS',
            progress: 45,
            budget: 50000000
          }
        })
      });
    });

    await page.route('**/api/litbang/projects/proj-1/finances', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            budget: 50000000,
            realization: 12500000,
            percentage: 25
          }
        })
      });
    });

    await page.goto('/litbang/proj-1');

    await expect(page.getByText('Realisasi Anggaran')).toBeVisible();
    await expect(page.getByText('Rp 12.500.000')).toBeVisible();
    await expect(page.getByText('25.0%')).toBeVisible();
  });
});
