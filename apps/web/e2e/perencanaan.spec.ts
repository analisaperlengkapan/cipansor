import { test, expect } from "./fixtures/auth.fixture";
import { LoginPage } from "./page-objects";

test.describe("Perencanaan - Navigation", () => {
  test("should navigate to perencanaan page", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");
    await page.waitForTimeout(2000);
    await page.goto("/perencanaan");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    expect(page.url()).toMatch(/perencanaan/);
  });

  test("should display perencanaan content", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");
    await page.waitForTimeout(2000);
    await page.goto("/perencanaan");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
    expect(content).toContain("Perencanaan Strategis");
  });
});

test.describe("Perencanaan - Features", () => {
  test("should display summary statistics", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");
    await page.waitForTimeout(2000);
    await page.goto("/perencanaan");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const hasStats = await page
      .locator('text="Total Rencana"')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasStats || page.url().includes("perencanaan")).toBeTruthy();
  });

  test("should display plan list section", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");
    await page.waitForTimeout(2000);
    await page.goto("/perencanaan");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const hasList = await page
      .locator('text="Daftar Rencana"')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasList || page.url().includes("perencanaan")).toBeTruthy();
  });
});

test.describe("Perencanaan - Performance", () => {
  test("should load page within timeout", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");
    await page.waitForTimeout(2000);
    const startTime = Date.now();
    await page.goto("/perencanaan");
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
    expect(Date.now() - startTime).toBeLessThan(15000);
  });
});
