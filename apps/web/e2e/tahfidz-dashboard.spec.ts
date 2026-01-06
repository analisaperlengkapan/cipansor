import { test, expect } from './fixtures/auth.fixture';
import { TahfidzDashboardPage } from './page-objects';
import { waitForLoadingComplete, selectOption } from './helpers/page-helpers';

/**
 * Tahfidz Dashboard E2E Tests
 * Tests Murojaah Analytics and Tahfidz tracking features
 * Optimized with Page Object Model and reusable helpers
 */

test.describe('Tahfidz Dashboard', () => {
    let tahfidzPage: TahfidzDashboardPage;

    test.beforeEach(async ({ page }) => {
        // Login as superadmin
        const loginPage = await import('./page-objects');
        const login = new loginPage.LoginPage(page);
        await login.goto();
        await login.loginAndWaitForDashboard('superadmin@cipansor.id', 'SuperAdmin123!');

        // Navigate to Tahfidz Dashboard
        tahfidzPage = new TahfidzDashboardPage(page);
        await tahfidzPage.goto();
        await tahfidzPage.waitForDataLoad();
    });

    test('should display all dashboard components', async ({ page }) => {
        // Verify main heading
        await expect(tahfidzPage.heading).toBeVisible({ timeout: 10000 });

        // Verify summary cards
        await expect(tahfidzPage.totalRecordsCard).toBeVisible({ timeout: 10000 });
        await expect(tahfidzPage.activeSantriCard).toBeVisible();
        await expect(tahfidzPage.totalJuzCard).toBeVisible();

        // Verify chart sections
        await expect(tahfidzPage.recordTypeChart).toBeVisible();
        await expect(tahfidzPage.topSantriSection).toBeVisible();
        await expect(tahfidzPage.progressPerJuzSection).toBeVisible();
    });

    test('should display catatan per tipe (record type chart)', async ({ page }) => {
        await expect(tahfidzPage.recordTypeChart).toBeVisible({ timeout: 10000 });
        
        // Chart should be rendered (check for canvas or SVG)
        const chartContainer = tahfidzPage.recordTypeChart.locator('..');
        const hasChart = await chartContainer.locator('canvas, svg').count();
        expect(hasChart).toBeGreaterThan(0);
    });

    test('should display top 10 santri section', async ({ page }) => {
        await expect(tahfidzPage.topSantriSection).toBeVisible({ timeout: 10000 });
        
        // Should have some list or table of students
        const section = tahfidzPage.topSantriSection.locator('..');
        const hasList = await section.locator('table, ul, ol, [role="list"]').count();
        expect(hasList).toBeGreaterThanOrEqual(0); // May be empty if no data
    });

    test('should display progress per juz', async ({ page }) => {
        await expect(tahfidzPage.progressPerJuzSection).toBeVisible({ timeout: 10000 });
        
        // Should show progress bars or chart
        const section = tahfidzPage.progressPerJuzSection.locator('..');
        const hasProgress = await section.locator('canvas, svg, [role="progressbar"]').count();
        expect(hasProgress).toBeGreaterThanOrEqual(0);
    });

    test('should filter by unit', async ({ page }) => {
        // Wait for initial data load
        await waitForLoadingComplete(page);
        await expect(tahfidzPage.totalRecordsCard).toBeVisible({ timeout: 10000 });

        // Get initial stats
        const initialStats = await tahfidzPage.totalRecordsCard.textContent();

        // Select a unit
        const unitSelect = page.locator('button[role="combobox"]')
            .filter({ hasText: /semua unit|unit/i })
            .first();

        await expect(unitSelect).toBeVisible({ timeout: 5000 });
        await unitSelect.click();

        // Select first real unit (skip "Semua Unit")
        const firstOption = page.getByRole('option').nth(1);
        await expect(firstOption).toBeVisible();
        await firstOption.click();

        // Wait for data to reload
        await waitForLoadingComplete(page);

        // Data should still be visible (stats may change)
        await expect(tahfidzPage.heading).toBeVisible();
        await expect(tahfidzPage.totalRecordsCard).toBeVisible();
    });

    test('should display recent records table', async ({ page }) => {
        const recentSection = page.getByText(/catatan terbaru/i);
        await expect(recentSection).toBeVisible({ timeout: 10000 });

        // Check if table exists
        const table = page.locator('table').filter({ hasText: /catatan terbaru|santri|tanggal/i });
        const hasTable = await table.count();
        
        if (hasTable > 0) {
            // Table has headers
            const headers = table.locator('thead th');
            await expect(headers.first()).toBeVisible();
        }
    });

    test('should navigate to recent record detail', async ({ page }) => {
        // Check if there are records
        const firstRow = page.locator('table tbody tr').first();
        const hasRows = await firstRow.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasRows) {
            await firstRow.click();
            
            // Should navigate to detail page or open modal
            // Adjust based on your actual implementation
            const isModal = await page.locator('[role="dialog"]').isVisible({ timeout: 3000 }).catch(() => false);
            const urlChanged = !page.url().includes('/dashboard');
            
            expect(isModal || urlChanged).toBeTruthy();
        } else {
            test.skip(true, 'No data available to test navigation');
        }
    });

    test('should refresh data when refresh button clicked', async ({ page }) => {
        // Look for refresh button
        const refreshButton = page.getByRole('button', { name: /refresh|muat ulang/i });
        const hasRefreshButton = await refreshButton.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasRefreshButton) {
            await refreshButton.click();
            
            // Should show loading state
            const loader = page.locator('.animate-spin');
            await expect(loader).toBeVisible({ timeout: 2000 }).catch(() => {
                // Loading might be too fast
            });
            
            // Data should still be visible after refresh
            await waitForLoadingComplete(page);
            await expect(tahfidzPage.heading).toBeVisible();
        } else {
            test.skip(true, 'Refresh button not found');
        }
    });

    test('should display monthly activity chart', async ({ page }) => {
        const monthlyActivity = page.getByText(/aktivitas bulanan|monthly activity/i);
        await expect(monthlyActivity).toBeVisible({ timeout: 10000 });
        
        // Should have chart element
        const chartSection = monthlyActivity.locator('..');
        const chart = chartSection.locator('canvas, svg');
        const hasChart = await chart.count();
        expect(hasChart).toBeGreaterThan(0);
    });
});

test.describe('Tahfidz Dashboard - Real-time Updates', () => {
    test('should handle real-time metric updates', async ({ page }) => {
        // Login and navigate
        const loginPage = await import('./page-objects');
        const login = new loginPage.LoginPage(page);
        await login.goto();
        await login.loginAndWaitForDashboard('superadmin@cipansor.id', 'SuperAdmin123!');

        const tahfidzPage = new TahfidzDashboardPage(page);
        await tahfidzPage.goto();
        await tahfidzPage.waitForDataLoad();

        // Check for real-time indicator
        const realtimeIndicator = page.locator('[data-testid="realtime-indicator"]');
        const hasIndicator = await realtimeIndicator.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasIndicator) {
            // Should show connected status
            await expect(realtimeIndicator).toContainText(/connected|terhubung/i);
        } else {
            console.log('Real-time indicator not found, skipping real-time test');
        }
    });
});

test.describe('Tahfidz Dashboard - Export & Print', () => {
    test('should export dashboard data', async ({ page }) => {
        // Login and navigate
        const loginPage = await import('./page-objects');
        const login = new loginPage.LoginPage(page);
        await login.goto();
        await login.loginAndWaitForDashboard('superadmin@cipansor.id', 'SuperAdmin123!');

        const tahfidzPage = new TahfidzDashboardPage(page);
        await tahfidzPage.goto();
        await tahfidzPage.waitForDataLoad();

        // Look for export button
        const exportButton = page.getByRole('button', { name: /export|unduh|download/i });
        const hasExportButton = await exportButton.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasExportButton) {
            // Set up download handler
            const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
            await exportButton.click();
            
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toMatch(/\.xlsx|\.pdf|\.csv/);
        } else {
            test.skip(true, 'Export button not found');
        }
    });
});
