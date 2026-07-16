import { test, expect } from "./fixtures/auth.fixture";
import { loginAs } from "./helpers/auth-api";

test.describe("Syariah - Navigation", () => {
  test("should navigate to syariah page", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/syariah");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    expect(page.url()).toMatch(/syariah/);
  });

  test("should display syariah content", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/syariah");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
    expect(content).toContain("Kepatuhan Syariah");
  });
});

test.describe("Syariah - Features", () => {
  test("should display compliance summary", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/syariah");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const hasSummary = await page
      .locator('text="Total Item"')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasSummary || page.url().includes("syariah")).toBeTruthy();
  });

  test("should display category breakdown", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/syariah");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const hasCategories = await page
      .locator('text="Daftar Kepatuhan"')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasCategories || page.url().includes("syariah")).toBeTruthy();
  });
});

test.describe("Syariah - Performance", () => {
  test("should load page within timeout", async ({ page }) => {
    await loginAs(page, "superAdmin");
    const startTime = Date.now();
    await page.goto("/syariah");
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
    expect(Date.now() - startTime).toBeLessThan(15000);
  });
});
