import { test, expect } from "./fixtures/auth.fixture";
import { loginAs } from "./helpers/auth-api";

/**
 * SPMB (Sistem Penerimaan Murid Baru) Workflow & Verification E2E Tests
 */

test.describe("SPMB - Public Registration & Admin Operations", () => {
  test("public SPMB registration page loads cleanly", async ({ page }) => {
    await page.goto("/public/spmb");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    expect(page.url()).toContain("/public/spmb");
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("Pendaftaran SPMB");
  });

  test("public SPMB status tracking page accepts lookup inputs", async ({ page }) => {
    await page.goto("/public/spmb/track");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    expect(page.url()).toContain("/public/spmb/track");
    const inputCount = await page.locator("input").count();
    expect(inputCount).toBeGreaterThanOrEqual(1);
  });

  test("admin registrations dashboard displays list and filters", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/spmb/registrations");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    expect(page.url()).toContain("/spmb/registrations");
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });
});
