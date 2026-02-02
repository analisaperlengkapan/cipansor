import { test, expect } from '@playwright/test';

test.describe('HR Talent Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Auth
    await page.route('*/**/api/auth/me', async (route) => {
      await route.fulfill({
        json: {
          data: {
            id: 'user-1',
            name: 'Test Admin',
            role: 'SUPER_ADMIN',
          },
        },
      });
    });

    // Mock Competencies
    await page.route('*/**/api/hr/talent/competencies*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          json: {
            data: [
              { id: '1', name: 'Leadership', category: 'Soft Skill', description: 'Ability to lead' },
            ],
            meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
          },
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          json: {
            data: { id: '2', name: 'Coding', category: 'Technical' },
          },
        });
      } else {
        await route.continue();
      }
    });

    // Mock Training
    await page.route('*/**/api/hr/talent/training/programs*', async (route) => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
              json: {
                data: [],
                meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
              },
            });
        } else {
            await route.continue();
        }
    });

    // Mock Reviews
    await page.route('*/**/api/hr/talent/reviews*', async (route) => {
        await route.fulfill({
            json: {
                data: [],
                meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
            }
        })
    });

    // Mock Employees for select
    await page.route('*/**/api/hr/employees*', async (route) => {
        await route.fulfill({
            json: {
                data: [{ userId: 'u1', fullName: 'Employee 1' }],
                meta: { total: 1 },
            }
        })
    });
  });

  test('should display competencies list', async ({ page }) => {
    await page.goto('/hr/talent/competencies');
    await expect(page.getByText('Competency Dictionary')).toBeVisible();
    await expect(page.getByText('Leadership')).toBeVisible();
  });

  test('should open add competency dialog', async ({ page }) => {
    await page.goto('/hr/talent/competencies');
    await page.getByRole('button', { name: 'Add Competency' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add Competency' })).toBeVisible();
  });

  test('should display training page', async ({ page }) => {
    await page.goto('/hr/talent/training');
    await expect(page.getByText('Training Programs')).toBeVisible();
  });

  test('should display reviews page', async ({ page }) => {
    await page.goto('/hr/talent/reviews');
    await expect(page.getByText('Performance Reviews')).toBeVisible();
  });
});
