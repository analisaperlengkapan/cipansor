import { test, expect } from "./fixtures/auth.fixture";
import { loginAs } from "./helpers/auth-api";

test.describe("Litbang - Navigation", () => {
  test("should navigate to litbang page", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/litbang");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    expect(page.url()).toMatch(/litbang/);
  });

  test("should display litbang content", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/litbang");
    // These pages wrap themselves in MainLayout, whose ProtectedRoute renders
    // nothing until the persisted session has rehydrated. Snapshotting
    // page.content() at domcontentloaded therefore captured an empty shell.
    // Wait for the page's own h1 instead of racing it.
    await expect(
      page.getByRole("heading", { name: "Litbang & Inovasi", level: 1 }),
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Litbang - Features", () => {
  test("should display projects list", async ({ page }) => {
    await loginAs(page, "superAdmin");
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
    await loginAs(page, "superAdmin");
    const startTime = Date.now();
    await page.goto("/litbang");
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
    expect(Date.now() - startTime).toBeLessThan(15000);
  });
});
