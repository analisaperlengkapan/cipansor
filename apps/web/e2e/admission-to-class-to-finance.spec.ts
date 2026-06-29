import { test, expect } from '@playwright/test';
import { setupMockUser, login } from './utils/auth';

test.describe('End-to-End: PPDB Registration to Finance & Medical', () => {
  const registrant = {
    id: 'mock-reg-1',
    fullName: 'Budi E2E Test',
    name: 'Budi E2E Test',
    registrationNo: 'REG-2026-001',
    status: 'ACCEPTED', // Crucial status that triggers the Onboarding button
    unitId: 'unit-sekolah-dasar-1',
    gender: 'MALE',
    birthPlace: 'Tasikmalaya',
    birthDate: '2015-05-01T00:00:00.000Z',
    parentName: 'Bapak Budi',
    parentPhone: '08123456789',
    createdAt: new Date().toISOString(),
    enrolledAt: null, // Not yet onboarded
  };

  test.beforeEach(async ({ page }) => {
    // Setup super admin access for e2e testing the admissions module.
    await setupMockUser(page, {
      role: 'SUPER_ADMIN',
      unitId: 'unit-sekolah-dasar-1',
    });
    await login(page);

    // ProtectedRoute (inside MainLayout) calls /api/auth/me on mount; mock it so
    // the page renders instead of redirecting to /login.
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            id: 'user-1',
            name: 'Super Admin E2E',
            role: 'SUPER_ADMIN',
            unitId: 'unit-sekolah-dasar-1',
          },
        },
      });
    });

    // List of registrants (the page uses GET /admissions/registrants?<query>).
    // The trailing "*" matches the query string but not the "/:id" detail path.
    await page.route('**/api/admissions/registrants*', async (route) => {
      await route.fulfill({
        json: {
          data: [registrant],
          meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
        },
      });
    });

    // Detail fetch (GET /admissions/registrants/:id).
    await page.route('**/api/admissions/registrants/mock-reg-1', async (route) => {
      await route.fulfill({ json: { success: true, data: registrant } });
    });
  });

  test('should successfully execute E2E Student Onboarding', async ({ page }) => {
    // 1. Admin navigates to the registration listing.
    await page.goto('/ppdb/registrations');
    await expect(page.getByRole('heading', { name: /Pendaftar/i })).toBeVisible();

    // 2. Open the accepted registrant's detail.
    await page.getByText('Budi E2E Test').click();
    await expect(page.getByRole('heading', { name: 'Budi E2E Test' })).toBeVisible();

    // The integrated onboarding button shows because status is ACCEPTED.
    const onboardButton = page.getByRole('button', {
      name: /Eksekusi Onboarding Terpadu/i,
    });
    await expect(onboardButton).toBeVisible();

    // 3. Intercept the orchestrator POST and verify the payload contract.
    let orchestratorHit = false;
    await page.route('**/api/admissions/waves/onboard-registrant', async (route) => {
      orchestratorHit = true;
      const request = route.request();
      expect(request.method()).toBe('POST');
      const payload = request.postDataJSON();
      expect(payload.registrantId).toBe('mock-reg-1');
      expect(payload.unitId).toBe('unit-sekolah-dasar-1');
      await route.fulfill({
        json: {
          success: true,
          message: 'Registrant onboarded successfully (E2E Integration complete)',
          data: {
            success: true,
            studentId: 'stud-new-1',
            invoiceId: 'inv-spp-1',
            medicalRecordId: 'med-1',
          },
        },
      });
    });

    // The status update fired immediately after onboarding.
    let statusUpdateHit = false;
    await page.route('**/api/admissions/registrants/*/status', async (route) => {
      statusUpdateHit = true;
      const payload = route.request().postDataJSON();
      expect(payload.status).toBe('ENROLLED');
      await route.fulfill({
        json: { success: true, data: { status: 'ENROLLED' } },
      });
    });

    // 4. Execute the end-to-end orchestrator action.
    await onboardButton.click();

    // 5. Verify the success toast and that both endpoints were called.
    await expect(
      page.getByText('Siswa berhasil di-Onboard secara terpadu!'),
    ).toBeVisible();
    expect(orchestratorHit).toBeTruthy();
    expect(statusUpdateHit).toBeTruthy();
  });
});
