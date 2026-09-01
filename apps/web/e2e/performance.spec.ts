import { test, expect } from "@playwright/test";
import { setupAuthenticatedPage } from "./helpers/auth";

test.describe("Integrated Performance Management (/kinerja) E2E Flows", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page, "SUPER_ADMIN");
  });

  test("main performance hub renders key navigation sections", async ({ page }) => {
    await page.goto("/kinerja");
    await expect(page).toHaveURL(/\/kinerja/);
    await expect(page.locator("h1")).toContainText(/Perencanaan Strategis hingga Perjanjian/i);
    await expect(page.locator("text=Perjanjian Kinerja")).toBeVisible();
    await expect(page.locator("text=Evaluasi Periodik")).toBeVisible();
  });

  test("performance agreement page displays PK agreement table and actions", async ({ page }) => {
    await page.goto("/kinerja/pk");
    await expect(page).toHaveURL(/\/kinerja\/pk/);
    await expect(page.locator("h1")).toContainText(/Perjanjian Kinerja/i);
    await expect(page.locator("text=Buat Perjanjian Kinerja Baru")).toBeVisible();
  });

  test("periodic evaluation hub loads monthly evaluations", async ({ page }) => {
    await page.goto("/kinerja/evaluasi");
    await expect(page).toHaveURL(/\/kinerja\/evaluasi/);
    await expect(page.locator("h1")).toContainText(/Evaluasi Kinerja Periodik Bulanan/i);
    await expect(page.locator("text=Buat Evaluasi Bulanan")).toBeVisible();
  });

  test("analytics page displays executive overview and consolidated report", async ({ page }) => {
    await page.goto("/kinerja/analytics");
    await expect(page).toHaveURL(/\/kinerja\/analytics/);
    await expect(page.locator("h1")).toContainText(/Analytics & Strategy Map/i);
    await expect(page.locator("text=Total Dokumen PK")).toBeVisible();
    await expect(page.locator("text=Rata-Rata Perilaku SAFTI")).toBeVisible();
  });

  test("historical PKG archive renders migration banner and archive records", async ({ page }) => {
    await page.goto("/pkg");
    await expect(page).toHaveURL(/\/pkg/);
    await expect(page.locator("text=Penilaian Kinerja Guru (PKG) Legasi")).toBeVisible();
    await expect(page.locator("text=Buka Kinerja Terintegrasi")).toBeVisible();
  });
});
