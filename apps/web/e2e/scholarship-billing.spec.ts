import { test, expect } from '@playwright/test';
import { setupMockUser, login } from './utils/auth';

test.describe('Scholarship Billing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user as a BENDAHARA (Finance Admin)
    await setupMockUser(page, { role: 'BENDAHARA', unitId: 'unit-1' });
    await login(page);
  });

  test('Invoice Detail displays scholarship discount', async ({ page }) => {
    // This test assumes a bill with ID 'bill-1' exists and has a discount
    // In a real CI environment, we would seed this data first.

    // Navigate to a specific bill detail
    await page.goto('/finance/bills/bill-1');

    // Verify page header
    await expect(page.getByRole('heading', { name: 'Detail Tagihan' })).toBeVisible();

    // If the bill has a discount (mocked data scenario), we expect to see these labels
    // Note: Since we can't seed the DB here, we are writing the test logic that WOULD pass.
    // We can use route interception to mock the API response for this specific test
    // to ensure the UI renders correctly without a real backend.

    await page.route('**/api/finance/invoices/bill-1', async route => {
      const json = {
        id: 'bill-1',
        invoiceNumber: 'INV-TEST',
        amount: 500000,
        originalAmount: 1000000,
        discount: 500000,
        paidAmount: 0,
        status: 'PENDING',
        dueDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        student: { name: 'Test Student', nis: '123' },
        paymentType: { name: 'SPP', code: 'SPP' }
      };
      await route.fulfill({ json });
    });

    // Refresh to hit the mock
    await page.reload();

    // Verify Discount UI Elements
    await expect(page.locator('text=Tagihan Awal')).toBeVisible();
    await expect(page.locator('text=1.000.000')).toBeVisible(); // Formatted currency

    await expect(page.locator('text=Potongan Beasiswa')).toBeVisible();
    await expect(page.locator('text=500.000')).toBeVisible(); // Discount amount

    await expect(page.locator('text=Total Tagihan (Net)')).toBeVisible();
  });
});
