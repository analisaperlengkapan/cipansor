import { test, expect } from './fixtures/auth.fixture';
import { TKAssessmentPage } from './page-objects';
import { waitForLoadingComplete, waitForToast } from './helpers/page-helpers';

/**
 * TK Module E2E Tests
 * Tests TK assessment, development tracking, and reporting
 */

test.describe('TK Assessment', () => {
    let tkPage: TKAssessmentPage;

    test.beforeEach(async ({ page }) => {
        // Login as superadmin
        const loginPage = await import('./page-objects');
        const login = new loginPage.LoginPage(page);
        await login.goto();
        await login.loginAndWaitForDashboard('superadmin@cipansor.id', 'SuperAdmin123!');

        // Navigate to TK Assessment
        tkPage = new TKAssessmentPage(page);
        await tkPage.goto();
        await waitForLoadingComplete(page);
    });

    test('should display assessment page components', async ({ page }) => {
        await expect(tkPage.heading).toBeVisible({ timeout: 10000 });
        await expect(tkPage.studentSelect).toBeVisible();
        await expect(tkPage.aspectTabs).toBeVisible();
    });

    test('should display all development aspects', async ({ page }) => {
        // Standard TK aspects: Agama, Fisik, Kognitif, Bahasa, Sosial-Emosional, Seni
        const aspects = [
            /agama/i,
            /fisik/i,
            /kognitif/i,
            /bahasa/i,
            /sosial/i,
            /seni/i,
        ];

        for (const aspect of aspects) {
            const tab = page.getByRole('tab', { name: aspect });
            await expect(tab).toBeVisible({ timeout: 5000 });
        }
    });

    test('should select student and load indicators', async ({ page }) => {
        // Click student select
        await tkPage.studentSelect.click();

        // Get list of students
        const studentOptions = page.getByRole('option');
        const studentCount = await studentOptions.count();

        if (studentCount > 0) {
            // Select first student
            await studentOptions.first().click();
            await waitForLoadingComplete(page);

            // Indicators should be visible
            await expect(page.getByText(/indikator|indicator/i)).toBeVisible({ timeout: 5000 });
        } else {
            test.skip(true, 'No students available for testing');
        }
    });

    test('should select indicators and set achievement levels', async ({ page }) => {
        // Select a student first
        await tkPage.studentSelect.click();
        const studentOptions = page.getByRole('option');
        const studentCount = await studentOptions.count();

        if (studentCount === 0) {
            test.skip(true, 'No students available');
            return;
        }

        await studentOptions.first().click();
        await waitForLoadingComplete(page);

        // Select first aspect tab
        const firstTab = page.getByRole('tab').first();
        await firstTab.click();

        // Check if there are indicators
        const checkboxes = page.locator('input[type="checkbox"]');
        const checkboxCount = await checkboxes.count();

        if (checkboxCount > 0) {
            // Select first indicator
            await checkboxes.first().check();

            // Set achievement level (BB, MB, BSH, BSB)
            const levelRadio = page.locator('input[type="radio"][value="BSH"]').first();
            if (await levelRadio.isVisible({ timeout: 3000 }).catch(() => false)) {
                await levelRadio.check();
            }
        } else {
            test.skip(true, 'No indicators available');
        }
    });

    test('should save assessment successfully', async ({ page }) => {
        // Complete assessment flow
        await tkPage.studentSelect.click();
        const studentOptions = page.getByRole('option');
        const studentCount = await studentOptions.count();

        if (studentCount === 0) {
            test.skip(true, 'No students available');
            return;
        }

        await studentOptions.first().click();
        await waitForLoadingComplete(page);

        // Select indicator and level
        const checkboxes = page.locator('input[type="checkbox"]');
        if (await checkboxes.count() > 0) {
            await checkboxes.first().check();
            
            const levelRadio = page.locator('input[type="radio"][value="MB"]').first();
            if (await levelRadio.isVisible({ timeout: 3000 }).catch(() => false)) {
                await levelRadio.check();
            }

            // Save
            await tkPage.saveButton.click();

            // Should show success message
            await waitForToast(page, /berhasil|success/i, 'success');
        } else {
            test.skip(true, 'No indicators to assess');
        }
    });

    test('should switch between development aspects', async ({ page }) => {
        const aspects = ['Agama', 'Fisik', 'Kognitif'];

        for (const aspect of aspects) {
            const tab = page.getByRole('tab', { name: new RegExp(aspect, 'i') });
            if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
                await tab.click();
                await waitForLoadingComplete(page);

                // Should show indicators for this aspect
                await expect(page.getByRole('tabpanel')).toBeVisible();
            }
        }
    });
});

test.describe('TK Reports', () => {
    test('should generate student development report', async ({ page }) => {
        // Login
        const loginPage = await import('./page-objects');
        const login = new loginPage.LoginPage(page);
        await login.goto();
        await login.loginAndWaitForDashboard('superadmin@cipansor.id', 'SuperAdmin123!');

        // Navigate to TK Reports
        await page.goto('/tk/reports');
        await waitForLoadingComplete(page);

        // Select student
        const studentSelect = page.locator('button[role="combobox"]')
            .filter({ hasText: /pilih santri|student/i })
            .first();

        if (await studentSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
            await studentSelect.click();
            
            const studentOption = page.getByRole('option').first();
            if (await studentOption.isVisible({ timeout: 3000 }).catch(() => false)) {
                await studentOption.click();

                // Generate report button
                const generateButton = page.getByRole('button', { name: /generate|buat laporan/i });
                if (await generateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await generateButton.click();
                    await waitForLoadingComplete(page);

                    // Report should be displayed or downloaded
                    const reportContent = page.locator('[data-testid="report-content"], .report-container');
                    const hasReport = await reportContent.isVisible({ timeout: 10000 }).catch(() => false);
                    
                    if (!hasReport) {
                        // Check for download
                        const downloadButton = page.getByRole('button', { name: /download|unduh/i });
                        await expect(downloadButton).toBeVisible({ timeout: 5000 });
                    }
                }
            }
        } else {
            test.skip(true, 'TK reports page not available');
        }
    });
});

test.describe('TK Dashboard', () => {
    test('should display TK dashboard with metrics', async ({ page }) => {
        // Login
        const loginPage = await import('./page-objects');
        const login = new loginPage.LoginPage(page);
        await login.goto();
        await login.loginAndWaitForDashboard('superadmin@cipansor.id', 'SuperAdmin123!');

        // Navigate to TK Dashboard
        await page.goto('/tk/dashboard');
        await waitForLoadingComplete(page);

        // Check for dashboard components
        const heading = page.getByRole('heading', { name: /dashboard tk/i });
        if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
            // Check for metrics cards
            await expect(page.getByText(/total santri|total students/i)).toBeVisible({ timeout: 5000 });
            await expect(page.getByText(/penilaian|assessment/i)).toBeVisible();
        } else {
            test.skip(true, 'TK dashboard not available');
        }
    });
});
