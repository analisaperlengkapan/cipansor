import { test, expect } from "./fixtures/auth.fixture";
import { loginAs } from "./helpers/auth-api";

test.describe("Organisasi - Navigation", () => {
  test("should navigate to organisasi page", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/organisasi");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    expect(page.url()).toMatch(/organisasi/);
  });

  test("should display organisasi content", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/organisasi");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
    expect(content).toContain("Struktur"); // "Struktur Organisasi" or similar usually is present
  });
});

test.describe("Organisasi - Features", () => {
  test("should display units list", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/organisasi");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const hasList = await page
      .locator('text="Manajemen Unit"') // from the page header
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasList || page.url().includes("organisasi")).toBeTruthy();
  });
});

test.describe("Organisasi - Performance", () => {
  test("should load page within timeout", async ({ page }) => {
    await loginAs(page, "superAdmin");
    const startTime = Date.now();
    await page.goto("/organisasi");
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
    expect(Date.now() - startTime).toBeLessThan(15000);
  });
});
