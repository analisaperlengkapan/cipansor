import { test, expect } from '@playwright/test';

test('Finance Accounting Page - Trial Balance and Reports', async ({ page }) => {
  test.setTimeout(60000); // Increase timeout

  // Mock Auth Login
  await page.route('**/api/auth/login', async route => {
    console.log('Login API hit');
    const json = {
      success: true,
      data: {
        token: 'fake-token',
        user: {
          id: 'user-id',
          name: 'Super Admin',
          role: 'ADMIN',
          email: 'superadmin@cipansor.id'
        }
      }
    };
    await route.fulfill({ json });
  });

  // Mock User/Me endpoint
  await page.route('**/api/auth/me', async route => {
    const json = {
      success: true,
      data: {
        id: 'user-id',
        name: 'Super Admin',
        role: 'ADMIN',
        email: 'superadmin@cipansor.id'
      }
    };
    await route.fulfill({ json });
  });

  // Mock API responses for finance enhancement endpoints
  await page.route('**/api/finance-enhancement/reports/trial-balance*', async route => {
    const json = {
      success: true,
      data: {
        period: { startDate: '2023-01-01', endDate: '2023-12-31' },
        accounts: [
          { code: '1101', name: 'Kas', type: 'ASSET', debit: 5000000, credit: 0 },
          { code: '2101', name: 'Utang Dagang', type: 'LIABILITY', debit: 0, credit: 2000000 },
          { code: '4101', name: 'Pendapatan Jasa', type: 'REVENUE', debit: 0, credit: 3000000 }
        ],
        totals: { debit: 5000000, credit: 5000000 },
        isBalanced: true
      }
    };
    await route.fulfill({ json });
  });

  await page.route('**/api/finance-enhancement/reports/income-expense*', async route => {
    const json = {
      success: true,
      data: {
        period: { startDate: '2023-01-01', endDate: '2023-12-31' },
        summary: {
          totalIncome: 10000000,
          totalExpense: 4000000,
          netIncome: 6000000
        },
        breakdown: [
          { period: '2023-01', income: 5000000, expense: 2000000, net: 3000000 },
          { period: '2023-02', income: 5000000, expense: 2000000, net: 3000000 }
        ]
      }
    };
    await route.fulfill({ json });
  });

  // Mock account codes for dropdowns
  await page.route('**/api/finance-enhancement/account-codes*', async route => {
    const json = {
      success: true,
      data: [],
      meta: { pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }
    };
    await route.fulfill({ json });
  });

  // Mock units
  await page.route('**/api/units*', async route => {
      await route.fulfill({ json: [] });
  });

  // Mock dashboard stats to avoid errors on redirect
  await page.route('**/api/dashboard-enhancement/overview*', async route => {
      await route.fulfill({ json: { success: true, data: {} } });
  });
  // Also mock legacy dashboard stats if needed
  await page.route('**/api/dashboard/stats*', async route => {
      await route.fulfill({ json: { success: true, data: {} } });
  });


  // 1. Go to Login
  await page.goto('http://localhost:3000/login');

  // 2. Perform Login
  await page.getByLabel(/email/i).fill('superadmin@cipansor.id');
  await page.getByLabel(/password|kata sandi/i).fill('SuperAdmin123!');
  await page.getByRole('button', { name: /sign in|masuk|login/i }).click();

  // 3. Wait for dashboard (indicating successful login)
  await expect(page).toHaveURL(/dashboard/, { timeout: 30000 });

  // 4. Navigate to the accounting page
  await page.goto('http://localhost:3000/finance/accounting');

  // 5. Click on "Laporan" tab
  // Use a more specific locator if "Laporan" appears multiple times
  await page.getByRole('tab', { name: 'Laporan' }).click();

  // 6. Wait for the report to load (check for "Neraca Saldo")
  await expect(page.locator('text=Neraca Saldo')).toBeVisible({ timeout: 10000 });

  // Wait a bit for charts/tables to render
  await page.waitForTimeout(1000);

  // Take a screenshot
  await page.screenshot({ path: '/home/jules/verification/finance-reports.png', fullPage: true });
});
