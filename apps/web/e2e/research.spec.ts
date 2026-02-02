import { test, expect } from '@playwright/test';

test.describe('Research Module', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Auth
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'user-1',
            name: 'Test Researcher',
            role: 'TEACHER',
            email: 'researcher@cipansor.id',
          },
        }),
      });
    });

    // Mock Units
    await page.route('**/api/units*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'unit-1', name: 'SMA Quran' }],
        }),
      });
    });

    // Mock Academic Years
    await page.route('**/api/academic-years*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'year-1', name: '2024/2025' }],
        }),
      });
    });

    // Mock Proposals List & Create
    await page.route('**/api/research/proposals*', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'prop-new',
              ...postData,
              status: 'DRAFT',
              createdAt: new Date().toISOString(),
              researcher: { name: 'Test Researcher' },
              unit: { name: 'SMA Quran' },
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'prop-1',
                title: 'Existing Research',
                category: 'PTK',
                status: 'DRAFT',
                budgetProposed: 5000000,
                createdAt: new Date().toISOString(),
                researcher: { name: 'Test Researcher' },
                unit: { name: 'SMA Quran' },
              },
            ],
            meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      }
    });

    await page.addInitScript(() => {
        window.localStorage.setItem('accessToken', 'mock-token');
    });

    await page.goto('/research');
    // Wait for loader to disappear if possible, or wait for heading
    await expect(page.getByRole('heading', { name: 'Research & Development' })).toBeVisible({ timeout: 10000 });
  });

  test('should display research proposals list', async ({ page }) => {
    // Wait for list to load
    await expect(page.getByText('Existing Research')).toBeVisible();
    await expect(page.getByText('PTK')).toBeVisible();
  });

  test('should create a new proposal', async ({ page }) => {
    // Wait for list to load (ensures page is ready and button is visible)
    await expect(page.getByText('Existing Research')).toBeVisible();

    // Click New Proposal
    await page.getByRole('button', { name: 'New Proposal' }).click();

    // Check Dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'New Research Proposal' })).toBeVisible();

    // Fill Form
    await page.locator('input[name="title"]').fill('New PTK Research');
    await page.locator('input[name="budgetProposed"]').fill('1500000');

    // Unit Select
    await page.getByText('Select Unit').click();
    await page.getByRole('option').first().click();

    // Academic Year Select
    await page.getByText('Select Year').click();
    await page.getByRole('option').first().click();

    // Submit
    await page.getByRole('button', { name: 'Submit' }).click();

    // Expect dialog to close
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
