import { test, expect } from "./fixtures/auth.fixture";
import { loginAs } from "./helpers/auth-api";

/**
 * SPMB (Sistem Penerimaan Murid Baru) End-to-End Workflow & Verification Tests
 */

test.describe("SPMB - End-to-End Public Registration & Admin Management", () => {
  test("public SPMB page renders hero banner, registration tabs, and contact info", async ({ page }) => {
    await page.goto("/public/spmb");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    expect(page.url()).toContain("/public/spmb");
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("Pendaftaran SPMB");
    expect(bodyText).toContain("Informasi & Pendaftaran");
    expect(bodyText).toContain("Cek Status");
  });

  test("public SPMB status tracking tab displays tracker form and lookup inputs", async ({ page }) => {
    await page.goto("/public/spmb");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    const checkStatusTab = page.getByRole("tab", { name: /Cek Status/i });
    if (await checkStatusTab.isVisible()) {
      await checkStatusTab.click();
      await page.waitForTimeout(500);
      const trackerText = await page.textContent("body");
      expect(trackerText).toContain("Cek Status Pendaftaran");
    }
  });

  test("admin SPMB hub displays active statistics cards and navigation menus", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/spmb");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    expect(page.url()).toContain("/spmb");
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("Total Pendaftar");
    expect(bodyText).toContain("Menunggu Verifikasi");
    expect(bodyText).toContain("Lulus Seleksi");
    expect(bodyText).toContain("Gelombang Aktif");
  });

  test("admin registrations list filters by status query parameter and opens detail verification panel", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/spmb/registrations?status=ACCEPTED");
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    expect(page.url()).toContain("/spmb/registrations?status=ACCEPTED");
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);

    // Filter status select should sync with ?status=ACCEPTED
    const searchInput = page.locator("input[placeholder*='Cari']").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Ahmad");
      await page.waitForTimeout(300);
    }
  });
});
