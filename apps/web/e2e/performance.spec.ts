import { test, expect } from "@playwright/test";
import { setupAuthenticatedPage } from "./helpers/auth";

test.describe("Integrated Performance Management (/kinerja) E2E Flows", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page, "SUPER_ADMIN");
  });

  test("main performance hub renders key navigation sections", async ({ page }) => {
    await page.goto("/kinerja");
    await expect(page).toHaveURL(/\/kinerja/);
    await expect(page.locator("h1")).toContainText(/Perencanaan Strategis hingga Perjanjian & Evaluasi Kinerja/i);
    await expect(page.getByText("Perjanjian Kinerja (PK)", { exact: true })).toBeVisible();
    await expect(page.getByText("Evaluasi & Perilaku SAFTI")).toBeVisible();
  });

  test("performance agreement page displays PK agreement table and actions", async ({ page }) => {
    await page.goto("/kinerja/pk");
    await expect(page).toHaveURL(/\/kinerja\/pk/);
    await expect(page.locator("h1")).toContainText(/Perjanjian Kinerja/i);
    await expect(page.getByRole("button", { name: "Buat Perjanjian Kinerja", exact: true })).toBeVisible();
  });

  test("periodic evaluation hub loads monthly evaluations", async ({ page }) => {
    await page.goto("/kinerja/evaluasi");
    await expect(page).toHaveURL(/\/kinerja\/evaluasi/);
    await expect(page.locator("h1")).toContainText(/Evaluasi Kinerja Periodik/i);
    await expect(page.getByRole("button", { name: "Mulai Evaluasi Bulanan" })).toBeVisible();
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

  test("interactive PK creation modal opens and validates form inputs", async ({ page }) => {
    await page.goto("/kinerja/pk");
    await page.getByRole("button", { name: "Buat Perjanjian Kinerja", exact: true }).click();
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

  test("periodic evaluation hub loads real page structure", async ({ page }) => {
    await page.goto("/kinerja/evaluasi");
    await expect(page.locator("h1")).toContainText(/Evaluasi Kinerja Periodik/i);
    await expect(page.getByRole("button", { name: "Mulai Evaluasi Bulanan" })).toBeVisible();
  });
});
