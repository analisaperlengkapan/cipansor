import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth-api";

test.describe("Unified Admissions Funnel", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "superAdmin");
  });

  test("should display unified admissions dashboard", async ({ page }) => {
    await page.goto("/admissions");

    await expect(page.getByText("Unified Admissions Management")).toBeVisible();
    // Real seeded admission period and registrant
    await expect(page.getByText("PSB 2024/2025 Gelombang 1").first()).toBeVisible({
      timeout: 15000,
    });
    // Registrants render by registration number in the "Pendaftar Terbaru" list
    await expect(page.getByText(/REG-2024-\d{4}/).first()).toBeVisible({ timeout: 15000 });
  });
});
