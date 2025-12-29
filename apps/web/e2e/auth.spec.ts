import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests the login flow and session management
 */

test.describe('Authentication', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('should display login form', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /masuk|login/i })).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password|kata sandi/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /masuk|login/i })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.getByLabel(/email/i).fill('invalid@example.com');
        await page.getByLabel(/password|kata sandi/i).fill('wrongpassword');
        await page.getByRole('button', { name: /sign in|masuk|login/i }).click();

        // Wait for error message
        await expect(page.getByText(/invalid|salah|gagal/i)).toBeVisible({ timeout: 10000 });
    });

    test('should redirect to dashboard after successful login', async ({ page }) => {
        // Use test credentials from README.md
        await page.getByLabel(/email/i).fill('superadmin@cipansor.id');
        await page.getByLabel(/password|kata sandi/i).fill('SuperAdmin123!');
        await page.getByRole('button', { name: /sign in|masuk|login/i }).click();

        // Should redirect to dashboard
        await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    });

    test('should logout successfully', async ({ page }) => {
        // Login first
        await page.getByLabel(/email/i).fill('superadmin@cipansor.id');
        await page.getByLabel(/password|kata sandi/i).fill('SuperAdmin123!');
        await page.getByRole('button', { name: /sign in|masuk|login/i }).click();
        await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });

        // Find and click logout
        await page.getByRole('button', { name: /logout|keluar/i }).click();

        // Should redirect to login
        await expect(page).toHaveURL(/login/);
    });
});
