import { test, expect } from '@playwright/test';
import { setupMockUser, login } from './utils/auth';

test.describe('End-to-End: PPDB Registration to Finance & Medical', () => {
  test.beforeEach(async ({ page }) => {
    // Setup super admin access for e2e testing the PSDB module
    await setupMockUser(page, {
      role: 'SUPER_ADMIN',
      unitId: 'unit-sekolah-dasar-1',
    });
    await login(page);
  });

  test('should successfully execute E2E Student Onboarding', async ({ page }) => {
    // 1. Admin navigates to the Registration listing
    await page.goto('/ppdb/registrations');
    
    // Ensure page loaded successfully
    await expect(page.getByRole('heading', { name: /Pendaftar/i })).toBeVisible();

    // 2. Select a registrant that is currently 'ACCEPTED' status but not yet 'ENROLLED'
    // For this e2e test, we mock the API response of GET /psb/registrations
    await page.route('**/api/psb/registrations**', async (route) => {
      const json = {
        data: [{
          id: 'mock-reg-1',
          fullName: 'Budi E2E Test',
          registrationNumber: 'REG-2026-001',
          status: 'ACCEPTED', // Crucial status that triggers the Onboarding Button
          unitId: 'unit-sekolah-dasar-1',
          createdAt: new Date().toISOString(),
          enrolledAt: null, // Not yet onboarded
        }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 }
      };
      await route.fulfill({ json });
    });
    await page.reload();

    // Click to view the first registrant details
    await page.getByText('Budi E2E Test').click();

    // 3. Admin is now on the detail page: apps/web/src/app/ppdb/registrations/[id]/page.tsx
    await expect(page.getByRole('heading', { name: 'Budi E2E Test' })).toBeVisible();

    // The 'Eksekusi Onboarding Terpadu (E2E)' button should be visible because status is ACCEPTED
    const onboardButton = page.getByRole('button', { name: /Eksekusi Onboarding Terpadu/i });
    await expect(onboardButton).toBeVisible();

    // 4. Intercept the actual POST to our new backend Orchestrator endpoint
    let orchestratorHit = false;
    await page.route('**/api/ppdb-wave/onboard-registrant', async (route) => {
      orchestratorHit = true;
      const request = route.request();
      expect(request.method()).toBe('POST');
      const payload = request.postDataJSON();
      
      // Verify the UI sent the correct payload required by Backend Orchestrator
      expect(payload.registrantId).toBe('mock-reg-1');
      expect(payload.unitId).toBe('unit-sekolah-dasar-1');

      // Fulfill with a standard success response matching the orchestrator format
      await route.fulfill({
        json: {
          success: true,
          message: 'Registrant onboarded successfully (E2E Integration complete)',
          data: {
            success: true,
            studentId: 'stud-new-1',
            invoiceId: 'inv-spp-1',
            medicalRecordId: 'med-1'
          }
        },
      });
    });

    // We also need to mock the status update that happens immediately after
    let statusUpdateHit = false;
    await page.route('**/api/psb/registrations/*/status', async (route) => {
      statusUpdateHit = true;
      const request = route.request();
      const payload = request.postDataJSON();
      expect(payload.status).toBe('ENROLLED');
      await route.fulfill({ json: { success: true, data: { status: 'ENROLLED' } } });
    });

    // 5. Execute the End-to-End Orchestrator action
    await onboardButton.click();

    // 6. Verification
    // Wait for the success toast from our UI layer
    await expect(page.getByText('Siswa berhasil di-Onboard secara terpadu!')).toBeVisible();
    
    // Assert backend was actually called
    expect(orchestratorHit).toBeTruthy();
    expect(statusUpdateHit).toBeTruthy();
    
    // Ensure the button disappears once state updates
    await expect(page.getByRole('button', { name: /Eksekusi Onboarding Terpadu/i })).toBeHidden({ timeout: 5000 });
  });
});
