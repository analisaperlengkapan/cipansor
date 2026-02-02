import { test, expect } from '@playwright/test';

test.describe('E-Office Correspondence Flow', () => {
  test('Reviewer can approve a letter', async ({ page }) => {
    // 1. Mock Auth
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { id: 'reviewer-1', name: 'Reviewer', unitId: 'unit-1', role: 'TEACHER' },
        }),
      });
    });

    // 2. Mock List of Reviews
    await page.route('**/api/correspondence/letters?*scope=REVIEW*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'letter-1',
              subject: 'Test Letter',
              status: 'PENDING_REVIEW',
              date: new Date().toISOString(),
              urgency: 'NORMAL',
              classification: { code: '000', name: 'General' },
            },
          ],
          meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }),
      });
    });

    // Mock List of All Letters (Default load)
     await page.route('**/api/correspondence/letters?*scope=ALL*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
        }),
      });
    });


    // 3. Mock Letter Detail
    await page.route('**/api/correspondence/letters/letter-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'letter-1',
            subject: 'Test Letter',
            status: 'PENDING_REVIEW',
            date: new Date().toISOString(),
            urgency: 'NORMAL',
            nature: 'PUBLIC',
            reviewers: [
              {
                reviewerId: 'reviewer-1',
                reviewerName: 'Reviewer',
                order: 1,
                status: 'PENDING',
              },
            ],
            dispositions: [],
          },
        }),
      });
    });

    // 4. Mock Review Action
    await page.route('**/api/correspondence/letters/letter-1/review', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Go to Inbox
    await page.goto('/e-office/inbox');

    // Wait for page to be ready
    await page.waitForURL('**/e-office/inbox');

    // Click Tab "Perlu Persetujuan"
    await page.click('text=Perlu Persetujuan');

    // Check if letter appears
    await expect(page.locator('text=Test Letter')).toBeVisible();

    // Click letter
    await page.click('text=Test Letter');

    // Check if Approve button is visible (Logic in component should show it because user matches reviewer)
    await expect(page.locator('button:has-text("Setuju")')).toBeVisible();

    // Click Approve
    await page.click('button:has-text("Setuju")');

    // Expect success toast
    await expect(page.getByText('Surat berhasil disetujui')).toBeVisible();
  });
});
