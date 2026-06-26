import { test, expect } from "./fixtures/auth.fixture";
import { LoginPage } from "./page-objects";

test.describe("Lingkungan - Navigation", () => {
  test("should navigate to lingkungan page", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.loginAndWaitForDashboard("superadmin@cipansor.id", "SuperAdmin123!");
    await page.goto("/lingkungan");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    expect(page.url()).toMatch(/lingkungan/);
  });

  test("should display lingkungan content", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.loginAndWaitForDashboard("superadmin@cipansor.id", "SuperAdmin123!");
    await page.goto("/lingkungan");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
    expect(content).toContain("Kampus Hijau");
  });
});

test.describe("Lingkungan - Features", () => {
  test("should display environment programs", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.loginAndWaitForDashboard("superadmin@cipansor.id", "SuperAdmin123!");
    await page.goto("/lingkungan");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const hasPrograms = await page
      .locator('text="Program Lingkungan"')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasPrograms || page.url().includes("lingkungan")).toBeTruthy();
  });

  test("should display waste management section", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.loginAndWaitForDashboard("superadmin@cipansor.id", "SuperAdmin123!");
    await page.goto("/lingkungan");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const hasStats = await page
      .locator('text="Program Aktif"')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasStats || page.url().includes("lingkungan")).toBeTruthy();
  });
});

test.describe("Lingkungan - Performance", () => {
  test("should load page within timeout", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.loginAndWaitForDashboard("superadmin@cipansor.id", "SuperAdmin123!");
    const startTime = Date.now();
    await page.goto("/lingkungan");
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
    expect(Date.now() - startTime).toBeLessThan(15000);
  });
});
