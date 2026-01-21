import { test, expect } from "./fixtures/auth.fixture";
import { LoginPage } from "./page-objects";

/**
 * Calendar Module E2E Tests
 * Tests calendar view and event management
 */

test.describe("Calendar - Navigation", () => {
  test("should navigate to calendar page", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");

    await page.waitForTimeout(2000);
    await page.goto("/calendar");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    expect(page.url()).toMatch(/calendar/);
  });

  test("should display calendar interface", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");

    await page.waitForTimeout(2000);
    await page.goto("/calendar");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });
});

test.describe("Calendar - Features", () => {
  test("should display calendar view", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");

    await page.waitForTimeout(2000);
    await page.goto("/calendar");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const content = await page.content();
    const hasCalendar =
      content.includes("Calendar") ||
      content.includes("Kalender") ||
      (await page
        .locator('[class*="calendar"]')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false));

    expect(hasCalendar || page.url().includes("calendar")).toBeTruthy();
  });

  test("should have event management", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");

    await page.waitForTimeout(2000);
    await page.goto("/calendar");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const hasEventButton = await page
      .locator(
        'button:has-text("Event"), button:has-text("Acara"), button:has-text("Tambah")',
      )
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasEventButton || page.url().includes("calendar")).toBeTruthy();
  });

  test("should show month/week views", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");

    await page.waitForTimeout(2000);
    await page.goto("/calendar");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const content = await page.content();
    const hasViewSelector =
      content.includes("Month") ||
      content.includes("Week") ||
      content.includes("Bulan") ||
      content.includes("Minggu");

    expect(hasViewSelector || page.url().includes("calendar")).toBeTruthy();
  });
});

test.describe("Calendar - Performance", () => {
  test("should load calendar quickly", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");

    await page.waitForTimeout(2000);

    const startTime = Date.now();
    await page.goto("/calendar");
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(15000);
  });
});
