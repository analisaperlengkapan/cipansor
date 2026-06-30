import { test, expect } from '@playwright/test';

test.describe('Alumni Sanad Page', () => {
  test.beforeEach(async ({ page }) => {
    const adminState = {
      state: {
        user: {
          id: 'admin-id',
          name: 'Super Admin',
          email: 'admin@cipansor.sch.id',
          role: 'SUPER_ADMIN',
        },
        accessToken: 'mock-token',
        isAuthenticated: true,
      },
      version: 0,
    };

    const cookieValue = encodeURIComponent(JSON.stringify(adminState));

    // Inject SUPER_ADMIN state into localStorage
    await page.addInitScript((state) => {
      window.localStorage.setItem('auth-storage', JSON.stringify(state));
    }, adminState);

    // Set mock cookies for middleware
    await page.context().addCookies([
      {
        name: 'accessToken',
        value: 'mock-token',
        url: 'http://localhost:3000',
      },
      {
        name: 'auth-storage',
        value: cookieValue,
        url: 'http://localhost:3000',
      }
    ]);

    // Mock auth/me response
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: adminState.state.user
        }),
      });
    });
  });

  test('should render sanad page with real-time tree structure', async ({ page }) => {
    // Mock the API response for sanad tree
    await page.route('**/api/alumni/sanad/tree*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'root-id',
            name: 'Syaikh Al-Qurra',
            title: 'Muhafidz Senior',
            year: '1990',
            location: 'Pesantren Cipansor',
            specialty: 'Qiraat Sab’ah',
            children: [
              {
                id: 'child-1',
                name: 'Ustadz Ahmad',
                title: 'Muhafidz',
                year: '2015',
                location: 'Unit SMA Qur’an',
                specialty: '30 Juz',
                children: [
                  {
                    id: 'grandchild-1',
                    name: 'Alumni Hasan',
                    title: 'Hafizh',
                    year: '2024',
                    location: 'Alumni SMA',
                    specialty: '30 Juz',
                    children: []
                  }
                ]
              }
            ]
          }
        }),
      });
    });

    // Mock the API response for alumni list
    await page.route('**/api/takhosus/sanad*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'sanad-1',
              juz: 30,
              certifiedAt: '2024-01-01T00:00:00.000Z',
              enrollment: {
                student: {
                  id: 'student-1',
                  user: { name: 'Alumni Hasan' }
                }
              }
            }
          ]
        }),
      });
    });

    await page.goto('http://localhost:3000/alumni/sanad', { waitUntil: 'networkidle' });

    // Verify page header
    await expect(page.getByText('Sanad Alumni')).toBeVisible();

    // Verify Tree is rendered
    await expect(page.getByText('Syaikh Al-Qurra')).toBeVisible();
    await expect(page.getByText('Ustadz Ahmad')).toBeVisible();
    await expect(page.getByText('Alumni Hasan')).toBeVisible();

    // Verify Alumni List
    await expect(page.getByText('Daftar Alumni Bersanad')).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'alumni_sanad_verification.png', fullPage: true });
  });
});
