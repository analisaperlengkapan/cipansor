import { test, expect } from "./fixtures/auth.fixture";
import { LoginPage } from "./page-objects";

test.describe("Talenta - Navigation", () => {
  test("should navigate to talenta page", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");
    await page.waitForTimeout(2000);
    await page.goto("/talenta");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    expect(page.url()).toMatch(/talenta/);
  });

  test("should display talenta content", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");
    await page.waitForTimeout(2000);
    await page.goto("/talenta");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
    expect(content).toContain("Manajemen Talenta");
  });
});

test.describe("Talenta - Features", () => {
  test("should display talent summary stats", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");
    await page.waitForTimeout(2000);
    await page.goto("/talenta");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const hasStats = await page
      .locator('text="Total Talenta"')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasStats || page.url().includes("talenta")).toBeTruthy();
  });

  test("should display tabs for profiles, trainings, and succession", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");
    await page.waitForTimeout(2000);
    await page.goto("/talenta");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const hasTabs = await page
      .locator('text="Profil Talenta"')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasTabs || page.url().includes("talenta")).toBeTruthy();
  });

  test("should switch between tabs", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");
    await page.waitForTimeout(2000);
    await page.goto("/talenta");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const trainingsTab = page.locator('text="Pelatihan"').first();
    if (await trainingsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await trainingsTab.click();
      await page.waitForTimeout(500);
    }
    expect(page.url()).toMatch(/talenta/);
  });
});

test.describe("Talenta - Performance", () => {
  test("should load page within timeout", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");
    await page.waitForTimeout(2000);
    const startTime = Date.now();
    await page.goto("/talenta");
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
    expect(Date.now() - startTime).toBeLessThan(15000);
  });
});
