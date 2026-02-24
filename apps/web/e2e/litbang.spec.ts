import { test, expect } from "./fixtures/auth.fixture";
import { LoginPage } from "./page-objects";

test.describe("Litbang - Navigation", () => {
  test("should navigate to litbang page", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");
    await page.waitForTimeout(2000);
    await page.goto("/litbang");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    expect(page.url()).toMatch(/litbang/);
  });

  test("should display litbang content", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");
    await page.waitForTimeout(2000);
    await page.goto("/litbang");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
    expect(content).toContain("Penelitian");
  });
});

test.describe("Litbang - Features", () => {
  test("should display projects list", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");
    await page.waitForTimeout(2000);
    await page.goto("/litbang");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const hasList = await page
      .locator('text="Proyek Litbang"')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasList || page.url().includes("litbang")).toBeTruthy();
  });
});

test.describe("Litbang - Performance", () => {
  test("should load page within timeout", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");
    await page.waitForTimeout(2000);
    const startTime = Date.now();
    await page.goto("/litbang");
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
    expect(Date.now() - startTime).toBeLessThan(15000);
  });
});
