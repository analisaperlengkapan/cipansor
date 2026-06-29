import { test, expect } from "@playwright/test";
import { loginAs, type SeedRole } from "./helpers/auth-api";

/**
 * Smoke coverage proving real FE↔BE authentication for every seed role,
 * including admins (whose 2FA gate is completed via the API helper). This is the
 * foundation other authenticated specs build on: `await loginAs(page, role)`
 * then navigate.
 */

const roles: { role: SeedRole; expectedRole: string }[] = [
  { role: "superAdmin", expectedRole: "SUPER_ADMIN" },
  { role: "adminSdit", expectedRole: "UNIT_ADMIN" },
  { role: "teacher", expectedRole: "TEACHER" },
  { role: "parent", expectedRole: "PARENT" },
  { role: "student", expectedRole: "STUDENT" },
];

for (const { role, expectedRole } of roles) {
  test(`${role} authenticates against the real API and reaches an authed page`, async ({
    page,
  }) => {
    const session = await loginAs(page, role);
    expect(session.user.role).toBe(expectedRole);
    expect(session.accessToken).toBeTruthy();

    await page.goto("/dashboard");
    // Must not be bounced back to the login screen.
    await expect(page).not.toHaveURL(/\/login/);
    // The app shell should render (no crash / redirect loop).
    await expect(page.locator("body")).toBeVisible();
  });
}
