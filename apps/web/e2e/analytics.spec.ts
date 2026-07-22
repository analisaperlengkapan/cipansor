import { test, expect } from "./fixtures/auth.fixture";

/**
 * Analytics E2E Tests
 * Tests the analytics dashboard and related pages
 * Uses authenticated fixtures for faster, more reliable tests
 */

test.describe("Analytics Dashboard", () => {
  test.use({ storageState: ".auth/superAdmin.json" });

  test("should navigate to analytics page", async ({ page }) => {
    await page.goto("/analytics");
    await expect(
      page.getByRole("heading", { name: /analitik|analytics/i }),
    ).toBeVisible();
  });

  test("should display analytics tabs", async ({ page }) => {
    await page.goto("/analytics");

    // Check for main tabs
    await expect(page.getByRole("tab", { name: /overview/i })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /santri|students/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /kehadiran|attendance/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /keuangan|finance/i }),
    ).toBeVisible();
  });

  test("should switch between tabs", async ({ page }) => {
    await page.goto("/analytics");

    // Click on students tab
    await page.getByRole("tab", { name: /santri|students/i }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();

    // Click on attendance tab
    await page.getByRole("tab", { name: /kehadiran|attendance/i }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
  });

  test("should navigate to forecast page", async ({ page }) => {
    await page.goto("/analytics");

    // The quick-link anchors can be overlapped by the dashboard charts, so
    // trigger the anchor's own navigation rather than a positional click.
    const forecastLink = page.getByRole("link", { name: /forecast/i });
    await expect(forecastLink).toHaveAttribute("href", /analytics\/forecast/);
    await Promise.all([
      page.waitForURL(/analytics\/forecast/, { timeout: 15000 }),
      forecastLink.evaluate((el) => (el as HTMLElement).click()),
    ]);
    await expect(
      page.getByRole("heading", { name: /prediksi|forecast/i }),
    ).toBeVisible();
  });

  test("sends users to Reports rather than exporting from here", async ({
    page,
  }) => {
    await page.goto("/analytics");

    // Analytics no longer exports. It used to carry an "Export Laporan"
    // dropdown, an Export link and four per-tab CSV buttons, all duplicating
    // /reports through a separate implementation with nothing keeping the two
    // in agreement. This asserts the single remaining route to a document.
    const reportsLink = page.getByRole("link", { name: /buat laporan/i });
    await expect(reportsLink).toHaveAttribute("href", "/reports");
    await Promise.all([
      page.waitForURL(/\/reports/, { timeout: 15000 }),
      reportsLink.evaluate((el) => (el as HTMLElement).click()),
    ]);
    await expect(
      page.getByRole("heading", { name: "Laporan", level: 1 }),
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Forecast Page", () => {
  test.use({ storageState: ".auth/superAdmin.json" });

  test("should display forecast cards", async ({ page }) => {
    await page.goto("/analytics/forecast");

    // Check for summary cards (forecast computation can take a few seconds;
    // the cards are behind a loading skeleton).
    await expect(page.getByText(/prediksi pendaftaran/i)).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByText(/prediksi pembayaran/i)).toBeVisible();
    await expect(page.getByText(/risiko tunggakan/i)).toBeVisible();
    await expect(page.getByText(/proyeksi hafidz/i)).toBeVisible();
  });

  test("should display forecast tabs", async ({ page }) => {
    await page.goto("/analytics/forecast");

    await expect(page.getByRole("tab", { name: /pendaftaran/i })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole("tab", { name: /pembayaran/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /tunggakan/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /tahfidz/i })).toBeVisible();
  });
});

test.describe("Export Page", () => {
  test.use({ storageState: ".auth/superAdmin.json" });

  test("should display export options", async ({ page }) => {
    await page.goto("/analytics/export");

    // Check for export type selection (the selected type's name also appears in
    // the preview panel, so scope to the first match).
    await expect(page.getByText(/data siswa/i).first()).toBeVisible();
    await expect(page.getByText(/data kehadiran/i).first()).toBeVisible();
    await expect(page.getByText(/data keuangan/i).first()).toBeVisible();
    await expect(page.getByText(/data tahfidz/i).first()).toBeVisible();
  });

  test("should have format selection", async ({ page }) => {
    await page.goto("/analytics/export");

    // Format selector (a Radix Select with a "Format" label, not a native
    // labelled control).
    await expect(page.getByText(/format/i).first()).toBeVisible();
  });

  test("should preview data before export", async ({ page }) => {
    await page.goto("/analytics/export");

    // Click preview button
    await page.getByRole("button", { name: /preview/i }).click();

    // Wait for preview to load (either shows data or "no data" message)
    await expect(
      page.locator('table, [data-testid="no-data"]').first(),
    ).toBeVisible({ timeout: 10000 });
  });
});
