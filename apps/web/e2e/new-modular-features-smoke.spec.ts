import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects";

// Smoke coverage for the #295 rebuild (Amaliyah Tadris, Qiyadah, Turats Lab).
// Authenticate first: hitting these routes anonymously races the 401 ->
// /login redirect against the heading render, which is flaky by design.
test.describe("New Modular Features Smoke Test", () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.loginAndWaitForDashboard(
      "superadmin@cipansor.id",
      "SuperAdmin123!",
    );
  });

  test("should navigate to Practicum dashboard", async ({ page }) => {
    await page.goto("/practicum");
    await expect(
      page.getByRole("heading", { name: /Practicum|Amaliyah Tadris/i }),
    ).toBeVisible();
  });

  test("should navigate to Student Org dashboard", async ({ page }) => {
    await page.goto("/student-org");
    await expect(
      page.getByRole("heading", { name: /Governance|Qiyadah/i }),
    ).toBeVisible();
  });

  test("should navigate to Research dashboard", async ({ page }) => {
    await page.goto("/research");
    await expect(
      page.getByRole("heading", { name: /Research|Fathul Kutub/i }),
    ).toBeVisible();
  });
});
