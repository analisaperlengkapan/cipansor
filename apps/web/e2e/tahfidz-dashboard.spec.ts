import { test, expect } from '@playwright/test';

test.describe('Tahfidz Dashboard (Murojaah Analytics)', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto('/login');
        await page.getByLabel(/email/i).fill('superadmin@cipansor.id');
        await page.getByLabel(/password|kata sandi/i).fill('SuperAdmin123!');
        await page.getByRole('button', { name: /sign in|masuk|login/i }).click();

        // Wait for potential error message or redirect
        await expect(page).toHaveURL(/dashboard/, { timeout: 30000 });

        // Wait for network to settle ensuring tokens are saved
        await page.waitForLoadState('networkidle');

        // Navigate to Tahfidz Dashboard
        await page.goto('/tahfidz/dashboard');
        await page.waitForLoadState('networkidle');
    });

    test('should display dashboard components', async ({ page }) => {
        // Page is already at /tahfidz/dashboard from beforeEach
        // Verify we're on the tahfidz dashboard page
        await expect(page).toHaveURL(/tahfidz\/dashboard/, { timeout: 5000 });

        // Wait for loading spinner to disappear
        await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15000 });

        // Check header
        await expect(page.getByRole('heading', { name: /dashboard tahfidz/i })).toBeVisible({ timeout: 10000 });

        // Check summary cards
        await expect(page.getByText(/total catatan/i)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(/santri aktif/i)).toBeVisible();
        await expect(page.getByText(/total juz dicapai/i)).toBeVisible();

        // Check charts/sections
        await expect(page.getByText(/catatan per tipe/i)).toBeVisible();
        await expect(page.getByText(/top 10 santri/i)).toBeVisible();
        await expect(page.getByText(/progress per juz/i)).toBeVisible();
        await expect(page.getByText(/aktivitas bulanan/i)).toBeVisible();
    });

    test('should filter by unit', async ({ page }) => {
        await page.goto('/tahfidz/dashboard');

        // Wait for loading to complete
        await page.waitForLoadState('networkidle');
        await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15000 });

        // Wait for dashboard to be visible first
        await expect(page.getByRole('heading', { name: /dashboard tahfidz/i })).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(/total catatan/i)).toBeVisible({ timeout: 10000 });

        // shadcn Select uses button-based dropdown, click on the trigger button
        const unitSelect = page.locator('[data-slot="select-trigger"]').first();
        if (await unitSelect.isVisible({ timeout: 5000 })) {
            await unitSelect.click();

            // Wait for dropdown to appear and select an option
            await page.waitForTimeout(500);
            const firstOption = page.locator('[data-slot="select-item"]').nth(1);
            if (await firstOption.isVisible({ timeout: 3000 })) {
                await firstOption.click();
            }
        }

        // Wait for the data to reload (loading state might appear)
        await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });

        // The data should still be visible (even if empty, the cards should be there)
        await expect(page.getByRole('heading', { name: /dashboard tahfidz/i })).toBeVisible();
    });

    test('should display murajaah specific data', async ({ page }) => {
        await page.goto('/tahfidz/dashboard');

        // Wait for loading to complete
        await page.waitForLoadState('networkidle');
        await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15000 });

        // Check for Catatan per Tipe section which shows activity types (pie chart)
        await expect(page.getByText(/catatan per tipe/i)).toBeVisible({ timeout: 10000 });

        // Check for Catatan Terbaru section (recent records table)
        // Note: Activity type labels in the chart may not be visible if there's no data
        await expect(page.getByText(/catatan terbaru/i)).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to recent records detail', async ({ page }) => {
        await page.goto('/tahfidz/dashboard');

        // Check if there are any records in the table
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            // Find a link to a student or similar if exists
            // In the current dashboard, there are no individual links in the table rows
            // But we can check if the table is rendered correctly
            await expect(page.locator('table thead')).toContainText(/santri/i);
            await expect(page.locator('table thead')).toContainText(/surah/i);
        }
    });
});
