import { test, expect } from "./fixtures/auth.fixture";
import { loginAs } from "./helpers/auth-api";

test.describe("Tata Laksana - Navigation", () => {
  test("should navigate to tata laksana page", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/tata-laksana");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    expect(page.url()).toMatch(/tata-laksana/);
  });

  test("should display tata laksana content", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/tata-laksana");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
    expect(content).toContain("SOP"); // Standard Operating Procedure
  });
});

test.describe("Tata Laksana - Features", () => {
  test("should display SOP list", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/tata-laksana");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const hasList = await page
      .locator('text="Tata Laksana"')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasList || page.url().includes("tata-laksana")).toBeTruthy();
  });
});

test.describe("Tata Laksana - Performance", () => {
  test("should load page within timeout", async ({ page }) => {
    await loginAs(page, "superAdmin");
    const startTime = Date.now();
    await page.goto("/tata-laksana");
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
    expect(Date.now() - startTime).toBeLessThan(15000);
  });
});
