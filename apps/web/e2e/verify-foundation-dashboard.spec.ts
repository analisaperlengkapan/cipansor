import { test, expect } from '@playwright/test';

test('verify foundation dashboard rendering', async ({ page }) => {
  // 1. Mock Authentication
  await page.context().addCookies([
    {
      name: 'accessToken',
      value: 'mock-token',
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'auth-storage',
      value: JSON.stringify({
        state: {
          user: {
            id: 'user-1',
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            email: 'admin@cipansor.id',
          },
          isAuthenticated: true,
        },
      }),
      domain: 'localhost',
      path: '/',
    },
  ]);

  // 2. Mock Foundation Data
  await page.route('**/api/foundation', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'foundation-1',
          name: 'Yayasan Pesantren Cipansor',
          legalName: 'Yayasan Pendidikan Islam Cipansor',
          foundedDate: '2000-01-01',
          address: 'Jl. Raya Cipansor No. 1',
          city: 'Tasikmalaya',
          province: 'Jawa Barat',
          postalCode: '46196',
          phone: '08123456789',
          email: 'info@cipansor.id',
        },
      }),
    });
  });

  // 3. Mock Foundation Stats
  await page.route('**/api/foundation/*/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          foundationId: 'foundation-1',
          foundationName: 'Yayasan Pesantren Cipansor',
          totalUnits: 4,
          totalStudents: 1250,
          totalTeachers: 85,
          totalStaff: 20,
          totalBoardMembers: 5,
          activeBoardMembers: 5,
          totalDocuments: 12,
          expiringDocuments: 2,
          financialSummary: {
            revenue: 500000000,
            expense: 350000000,
            balance: 150000000,
          },
          studentDistribution: {
            TK_QURAN: 150,
            SD_IT: 450,
            SMP_IT: 350,
            SMA_QURAN: 300,
          },
          unitsSummary: [
            {
              id: 'unit-1',
              name: 'TK Quran Cipansor',
              type: 'TK_QURAN',
              _count: { students: 150, teachers: 10, staff: 2 },
            },
            {
              id: 'unit-2',
              name: 'SD IT Cipansor',
              type: 'SD_IT',
              _count: { students: 450, teachers: 30, staff: 5 },
            },
            {
              id: 'unit-3',
              name: 'SMP IT Cipansor',
              type: 'SMP_IT',
              _count: { students: 350, teachers: 25, staff: 8 },
            },
            {
              id: 'unit-4',
              name: 'SMA Quran Cipansor',
              type: 'SMA_QURAN',
              _count: { students: 300, teachers: 20, staff: 5 },
            },
          ],
        },
      }),
    });
  });

  // 4. Navigate to Page
  await page.goto('/foundation');

  // 5. Verify Elements
  // Check for Header
  await expect(page.getByRole('heading', { name: 'Yayasan' })).toBeVisible();

  // Check for Dashboard Tab content
  await expect(page.getByText('Total Siswa')).toBeVisible();
  await expect(page.getByText('1250')).toBeVisible(); // Total Students

  // Check for Finance
  await expect(page.getByText('Kas Yayasan (Bulan Ini)')).toBeVisible();
  // Rp 150.000.000 (Might need regex for formatting)

  // Check for Chart titles
  await expect(page.getByText('Distribusi Siswa per Jenjang')).toBeVisible();
  await expect(page.getByText('Ringkasan Keuangan Bulan Ini')).toBeVisible();

  // 6. Take Screenshot
  await page.screenshot({ path: 'foundation-dashboard.png', fullPage: true });
});
