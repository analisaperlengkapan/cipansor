import { test, expect } from '@playwright/test';

/**
 * Analytics E2E Tests
 * Tests the analytics dashboard and related pages
 */

test.describe('Analytics Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.getByLabel(/email/i).fill('admin@cipansor.com');
        await page.getByLabel(/password|kata sandi/i).fill('admin123');
        await page.getByRole('button', { name: /masuk|login/i }).click();
        await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    });

    test('should navigate to analytics page', async ({ page }) => {
        await page.goto('/analytics');
        await expect(page.getByRole('heading', { name: /analitik|analytics/i })).toBeVisible();
    });

    test('should display analytics tabs', async ({ page }) => {
        await page.goto('/analytics');

        // Check for main tabs
        await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /santri|students/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /kehadiran|attendance/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /keuangan|finance/i })).toBeVisible();
    });

    test('should switch between tabs', async ({ page }) => {
        await page.goto('/analytics');

        // Click on students tab
        await page.getByRole('tab', { name: /santri|students/i }).click();
        await expect(page.getByRole('tabpanel')).toBeVisible();

        // Click on attendance tab
        await page.getByRole('tab', { name: /kehadiran|attendance/i }).click();
        await expect(page.getByRole('tabpanel')).toBeVisible();
    });

    test('should navigate to forecast page', async ({ page }) => {
        await page.goto('/analytics');

        // Click forecast button
        await page.getByRole('link', { name: /forecast/i }).click();
        await expect(page).toHaveURL(/analytics\/forecast/);
        await expect(page.getByRole('heading', { name: /prediksi|forecast/i })).toBeVisible();
    });

    test('should navigate to export page', async ({ page }) => {
        await page.goto('/analytics');

        // Click export button
        await page.getByRole('link', { name: /export/i }).click();
        await expect(page).toHaveURL(/analytics\/export/);
        await expect(page.getByRole('heading', { name: /export/i })).toBeVisible();
    });
});

test.describe('Forecast Page', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.getByLabel(/email/i).fill('admin@cipansor.com');
        await page.getByLabel(/password|kata sandi/i).fill('admin123');
        await page.getByRole('button', { name: /masuk|login/i }).click();
        await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    });

    test('should display forecast cards', async ({ page }) => {
        await page.goto('/analytics/forecast');

        // Check for summary cards
        await expect(page.getByText(/prediksi pendaftaran/i)).toBeVisible();
        await expect(page.getByText(/prediksi pembayaran/i)).toBeVisible();
        await expect(page.getByText(/risiko tunggakan/i)).toBeVisible();
        await expect(page.getByText(/proyeksi hafidz/i)).toBeVisible();
    });

    test('should display forecast tabs', async ({ page }) => {
        await page.goto('/analytics/forecast');

        await expect(page.getByRole('tab', { name: /pendaftaran/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /pembayaran/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /tunggakan/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /tahfidz/i })).toBeVisible();
    });
});

test.describe('Export Page', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.getByLabel(/email/i).fill('admin@cipansor.com');
        await page.getByLabel(/password|kata sandi/i).fill('admin123');
        await page.getByRole('button', { name: /masuk|login/i }).click();
        await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    });

    test('should display export options', async ({ page }) => {
        await page.goto('/analytics/export');

        // Check for export type selection
        await expect(page.getByText(/data siswa/i)).toBeVisible();
        await expect(page.getByText(/data kehadiran/i)).toBeVisible();
        await expect(page.getByText(/data keuangan/i)).toBeVisible();
        await expect(page.getByText(/data tahfidz/i)).toBeVisible();
    });

    test('should have format selection', async ({ page }) => {
        await page.goto('/analytics/export');

        // Check for format dropdown
        await expect(page.getByLabel(/format/i)).toBeVisible();
    });

    test('should preview data before export', async ({ page }) => {
        await page.goto('/analytics/export');

        // Click preview button
        await page.getByRole('button', { name: /preview/i }).click();

        // Wait for preview to load (either shows data or "no data" message)
        await expect(page.locator('table, [data-testid="no-data"]').first()).toBeVisible({ timeout: 10000 });
    });
});
