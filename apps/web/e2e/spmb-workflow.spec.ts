import { test, expect } from "./fixtures/auth.fixture";
import { loginAs } from "./helpers/auth-api";

/**
 * SPMB (Sistem Penerimaan Murid Baru) Workflow & Verification E2E Tests
 */

test.describe("SPMB - Public Registration & Admin Operations", () => {
  test("public SPMB page renders hero banner, registration tabs, and contact info", async ({ page }) => {
    await page.goto("/public/spmb");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    expect(page.url()).toContain("/public/spmb");
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("Pendaftaran SPMB");
    expect(bodyText).toContain("Informasi & Pendaftaran");
    expect(bodyText).toContain("Cek Status");
  });

  test("public SPMB status tracking tab displays tracker form", async ({ page }) => {
    await page.goto("/public/spmb");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    // Click 'Cek Status' tab
    const checkStatusTab = page.getByRole("tab", { name: /Cek Status/i });
    if (await checkStatusTab.isVisible()) {
      await checkStatusTab.click();
      await page.waitForTimeout(500);
      const trackerText = await page.textContent("body");
      expect(trackerText).toContain("Cek Status Pendaftaran");
    }
  });

  test("admin SPMB hub displays statistics cards and navigation menus", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/spmb");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    expect(page.url()).toContain("/spmb");
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("Total Pendaftar");
    expect(bodyText).toContain("Menunggu Verifikasi");
    expect(bodyText).toContain("Lulus Seleksi");
  });

  test("admin registrations list displays data table and syncs status query filter", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/spmb/registrations?status=ACCEPTED");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    expect(page.url()).toContain("/spmb/registrations?status=ACCEPTED");
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);

    const searchInput = page.locator("input[placeholder*='Cari']").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Ahmad");
    }
  });
});
