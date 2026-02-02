import { test, expect } from '@playwright/test';

test.describe('Innovation Module', () => {
  test('should display proposal list', async ({ page }) => {
    await page.route('/api/innovation', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          {
            id: 'prop-1',
            title: 'Existing Idea',
            description: 'Description',
            status: 'DRAFT',
            type: 'RESEARCH',
            createdAt: new Date().toISOString(),
            submittedBy: { name: 'User A' }
          }
        ])
      });
    });

    await page.goto('/innovation');
    await expect(page.getByText('Existing Idea')).toBeVisible();
  });

  test('should submit a new proposal', async ({ page }) => {
    // Mock create endpoint
    await page.route('/api/innovation', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, body: JSON.stringify({ id: 'new-id' }) });
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
      }
    });

    await page.goto('/innovation/create');

    await page.getByLabel('Title').fill('My New Innovation');
    // Select Type (Radix UI Select is tricky in Playwright, often needs finding by role 'combobox')
    // We'll skip interacting with select if default is fine, or try to click it.
    // Default is RESEARCH.

    await page.getByLabel('Description').fill('This is a comprehensive description of the innovation idea that meets the minimum length requirement.');

    await page.getByRole('button', { name: 'Submit Proposal' }).click();

    // Should redirect
    await expect(page).toHaveURL(/\/innovation/);
    await expect(page.getByText('Innovation proposal created successfully')).toBeVisible();
  });

  test('should show details and allow approval', async ({ page }) => {
    const proposal = {
        id: 'prop-1',
        title: 'Great Idea',
        description: 'Description that is long enough...',
        status: 'SUBMITTED',
        type: 'PRODUCT',
        createdAt: new Date().toISOString(),
        submittedBy: { name: 'User A' },
        reviews: [],
        comments: []
    };

    await page.route(`/api/innovation/${proposal.id}`, async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify(proposal) });
    });

    await page.route(`/api/innovation/${proposal.id}/approve`, async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify({ ...proposal, status: 'APPROVED' }) });
    });

    await page.goto(`/innovation/${proposal.id}`);

    await expect(page.getByRole('heading', { name: 'Great Idea' })).toBeVisible();
    await page.getByRole('button', { name: 'Approve & Create Project' }).click();

    await expect(page.getByText('Proposal approved')).toBeVisible();
  });
});
