import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Authentication Fixture
 * Provides authenticated context for E2E tests
 */

export interface AuthUser {
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "UNIT_ADMIN" | "TEACHER" | "STAFF";
  unitId?: string;
}

export const testUsers: Record<string, AuthUser> = {
  superAdmin: {
    email: "superadmin@cipansor.id",
    password: "SuperAdmin123!",
    role: "SUPER_ADMIN",
  },
  unitAdmin: {
    email: "admin@cipansor.com",
    password: "admin123",
    role: "UNIT_ADMIN",
  },
  teacher: {
    email: "teacher@cipansor.id",
    password: "Teacher123!",
    role: "TEACHER",
  },
};

/**
 * Login helper function
 * @param page - Playwright page instance
 * @param user - User credentials
 */
export async function loginAsUser(page: Page, user: AuthUser) {
  await page.goto("/login");

  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password|kata sandi/i).fill(user.password);
  await page.getByRole("button", { name: /sign in|masuk|login/i }).click();

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");

  // Verify token is stored
  const token = await page.evaluate(() => localStorage.getItem("accessToken"));
  expect(token).toBeTruthy();
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  // Try to find and click logout button
  const logoutButton = page
    .getByRole("button", { name: /logout|keluar/i })
    .first();

  if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logoutButton.click();
  }

  // Clear all storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Verify redirect to login
  await expect(page).toHaveURL(/login/, { timeout: 5000 });
}

/**
 * Extended test fixture with authentication context
 */
export const test = base.extend<{
  authenticatedPage: Page;
  superAdminPage: Page;
  unitAdminPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    await loginAsUser(page, testUsers.superAdmin);
    await use(page);
    await logout(page);
  },

  superAdminPage: async ({ page }, use) => {
    await loginAsUser(page, testUsers.superAdmin);
    await use(page);
    await logout(page);
  },

  unitAdminPage: async ({ page }, use) => {
    await loginAsUser(page, testUsers.unitAdmin);
    await use(page);
    await logout(page);
  },
});

export { expect };
