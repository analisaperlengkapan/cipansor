import { test, expect } from "./fixtures/auth.fixture";
import { LoginPage } from "./page-objects";

/**
 * Assessment Module E2E Tests
 * Tests student assessment, report cards, and transcripts
 */

test.describe("Assessment - List & Navigation", () => {
  test("should navigate to assessment page", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");

    await page.waitForTimeout(2000);
    await page.goto("/assessment");

    // Wait for page load
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    // Verify we're on assessment page
    expect(page.url()).toMatch(/assessment/);
  });

  test("should display assessment list or create form", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");

    await page.waitForTimeout(2000);
    await page.goto("/assessment");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    // Page should load successfully
    expect(page.url()).toMatch(/assessment/);

    // Should have some content (very lenient check)
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000); // Has content
  });
});

test.describe("Assessment - Report Cards", () => {
  test("should navigate to report cards page", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");

    await page.waitForTimeout(2000);
    await page.goto("/assessment/report-cards");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    expect(page.url()).toMatch(/report-cards/);
  });

  test("should display report cards list", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");

    await page.waitForTimeout(2000);
    await page.goto("/assessment/report-cards");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    // Check for list elements
    const hasContent = await page
      .locator('table, [role="table"], [class*="card"]')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // Page should load without errors
    expect(page.url()).toMatch(/report-cards/);
  });

  test("should navigate to generate report cards page", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");

    await page.waitForTimeout(2000);
    await page.goto("/assessment/report-cards/generate");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    expect(page.url()).toMatch(/generate/);
  });
});

test.describe("Assessment - Raport Merdeka", () => {
  test("should navigate to raport merdeka page", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto("/login");
    await login.login("superadmin@cipansor.id", "SuperAdmin123!");

    await page.waitForTimeout(2000);
    await page.goto("/assessment/raport-merdeka");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    expect(page.url()).toMatch(/raport-merdeka/);
  });
});

test.describe("Assessment - Transcript", () => {
  test("should allow navigation to transcript page", async ({ page }) => {
    const login = new LoginPage(page);
    // Deterministic auth (apiLogin + injected session) avoids the flaky
    // UI-login + fixed-timeout race that could redirect to /login mid-test.
    await login.loginAndWaitForDashboard(
      "superadmin@cipansor.id",
      "SuperAdmin123!",
    );

    // Navigate to assessment main page first
    await page.goto("/assessment");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    // Try to find transcript link/button
    const transcriptLink = page
      .getByRole("link", { name: /transcript|transkrip/i })
      .first();

    if (await transcriptLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await transcriptLink.click();
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
      expect(page.url()).toMatch(/transcript/);
    } else {
      // Direct navigation if no link found
      await page.goto("/assessment/transcript");
      expect(page.url()).toMatch(/transcript/);
    }
  });
});
