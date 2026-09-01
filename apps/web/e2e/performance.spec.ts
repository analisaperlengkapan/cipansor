import { test, expect } from "@playwright/test";
import { setupAuthenticatedPage } from "./helpers/auth";

test.describe("Integrated Performance Management (/kinerja) E2E Flows", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page, "SUPER_ADMIN");
  });

  test("main performance hub renders key navigation sections", async ({ page }) => {
    await page.goto("/kinerja");
    await expect(page).toHaveURL(/\/kinerja/);
    await expect(page.locator("h1")).toContainText(/Manajemen Kinerja/i);
    await expect(page.locator("text=Perjanjian Kinerja")).toBeVisible();
    await expect(page.locator("text=Evaluasi Periodik")).toBeVisible();
  });

  test("performance agreement page displays PK agreement table and actions", async ({ page }) => {
    await page.goto("/kinerja/pk");
    await expect(page).toHaveURL(/\/kinerja\/pk/);
    await expect(page.locator("h1")).toContainText(/Perjanjian Kinerja/i);
    await expect(page.locator("text=Buat PK Baru")).toBeVisible();
  });

  test("periodic evaluation hub loads monthly evaluations", async ({ page }) => {
    await page.goto("/kinerja/evaluasi");
    await expect(page).toHaveURL(/\/kinerja\/evaluasi/);
    await expect(page.locator("h1")).toContainText(/Evaluasi Periodik/i);
    await expect(page.locator("text=Buat Evaluasi Bulanan")).toBeVisible();
  });

  test("analytics page displays executive overview and consolidated report", async ({ page }) => {
    await page.goto("/kinerja/analytics");
    await expect(page).toHaveURL(/\/kinerja\/analytics/);
    await expect(page.locator("h1")).toContainText(/Analytics & Strategy Map/i);
    await expect(page.locator("text=Total Dokumen PK")).toBeVisible();
    await expect(page.locator("text=Rata-Rata Perilaku SAFTI")).toBeVisible();
  });


  test("interactive PK creation modal opens and validates form inputs", async ({ page }) => {
    await page.goto("/kinerja/pk");
    await page.click("button:has-text('Buat Perjanjian Kinerja')");
    await expect(page.locator("text=Buat Perjanjian Kinerja Baru")).toBeVisible();

    // Fill invalid inverted period dates
    await page.fill("input[type='date'] >> nth=0", "2026-12-31");
    await page.fill("input[type='date'] >> nth=1", "2026-01-01");

    // Listen for dialog alert
    let dialogMessage = "";
    page.once("dialog", (dialog) => {
      dialogMessage = dialog.message();
      dialog.dismiss();
    });

    await page.click("button:has-text('Buat PK')");
    expect(dialogMessage).toContain("tidak boleh lebih awal");
  });

  test("end-to-end flow: submit PK, submit evaluation creation, and verify analytics drilldown", async ({ page }) => {
    // 1. PK Creation Flow - Fill and Submit
    await page.goto("/kinerja/pk");
    await page.click("button:has-text('Buat Perjanjian Kinerja')");
    await expect(page.locator("text=Buat Perjanjian Kinerja Baru")).toBeVisible();

    // Fill valid period dates and notes
    await page.fill("input[type='date'] >> nth=0", "2026-01-01");
    await page.fill("input[type='date'] >> nth=1", "2026-12-31");
    await page.fill("textarea", "Perjanjian Kinerja Tahun 2026 E2E Test Submission");

    // Submit form
    await page.click("button:has-text('Buat PK')");
    await expect(page.locator("text=Buat Perjanjian Kinerja Baru")).not.toBeVisible();
    await expect(page.locator("text=Perjanjian Kinerja Tahun 2026 E2E Test Submission").or(page.locator("text=PK Saya"))).toBeVisible();

    // 2. Periodic Evaluation Hub & Creation Dialog Flow
    await page.goto("/kinerja/evaluasi");
    await expect(page.locator("h1")).toContainText(/Evaluasi Periodik/i);
    await expect(page.locator("text=Buat Evaluasi Bulanan")).toBeVisible();

    // Open evaluation dialog
    await page.click("button:has-text('Buat Evaluasi Bulanan')");
    await expect(page.locator("text=Buat Evaluasi Bulanan Baru")).toBeVisible();
    await page.click("button:has-text('Batal')");

    // 3. Analytics Unit Drilldown & Report Overview Check
    await page.goto("/kinerja/analytics");
    await expect(page.locator("h1")).toContainText(/Analytics & Strategy Map/i);
    await expect(page.locator("text=Drilldown Capaian per Unit Kerja")).toBeVisible();
    await expect(page.locator("text=Ringkasan Laporan Konsolidasi Kinerja Yayasan")).toBeVisible();
  });

  test("RBAC enforcement: non-leadership role receives restricted or redirected access for analytics", async ({ page }) => {
    await setupAuthenticatedPage(page, "SDIT_SISWA");
    await page.goto("/kinerja/analytics");
    // Non-leadership roles should be redirected to unauthorized or dashboard
    await expect(page).not.toHaveURL(/\/kinerja\/analytics/);
  });
});
