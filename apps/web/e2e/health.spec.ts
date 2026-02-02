import { test, expect } from "./fixtures/auth.fixture";
import { LoginPage } from "./page-objects";

test.describe("Health Module (UKS)", () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");
    await page.waitForURL(/\/dashboard|\/home/, { timeout: 15000 });
  });

  test("should navigate to health dashboard", async ({ page }) => {
    await page.goto("/health");
    await expect(page).toHaveURL(/.*\/health/);
    await expect(page.locator("h1")).toContainText("Health");
  });

  test("should view inventory page", async ({ page }) => {
    await page.goto("/health/inventory");
    await expect(page.locator("h1")).toContainText("Inventaris Obat");
    await expect(page.getByRole("button", { name: "Tambah Obat" })).toBeVisible();
  });

  test("should view immunization page", async ({ page }) => {
    await page.goto("/health/immunization");
    await expect(page.locator("h1")).toContainText("Imunisasi");
    await expect(page.getByRole("button", { name: "Catat Imunisasi" })).toBeVisible();
  });
});
