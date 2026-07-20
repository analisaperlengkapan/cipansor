import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth-api";

test.describe("Academic Integrated Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "superAdmin");
  });

  test("should display Tahfidz Progress Chart on Takhosus Dashboard", async ({ page }) => {
    await page.goto("/takhosus", { waitUntil: "domcontentloaded" });

    // Ensure we are not redirected to login
    await expect(page).not.toHaveURL(/.*login.*/, { timeout: 15000 });

    const heading = page.getByRole("heading", { name: "Program Takhosus" });
    await expect(heading).toBeVisible({ timeout: 30000 });

    // The tahfidz progress chart card renders from real analytics data —
    // either the chart itself or its explicit empty state, never an error.
    const chartTitle = page.getByText("Kurva Capaian Tahfidz");
    await expect(chartTitle).toBeVisible({ timeout: 45000 });

    const chartOrEmpty = page
      .locator(".recharts-responsive-container")
      .or(page.getByText("Belum ada data progres hafalan."));
    await expect(chartOrEmpty.first()).toBeVisible();
  });

  test("should display Succession Planning recommendations in HR module", async ({ page }) => {
    await page.goto("/hr/talenta");

    // Click Succession Planning tab (Radix trigger — force past the
    // WebKit "not stable" animation gate).
    await page.locator("text=Succession Planning").first().waitFor({ state: "visible" });
    await page.locator("text=Succession Planning").first().click({ force: true });

    // Verify the search UI is visible
    await expect(page.locator("text=AI-Driven Succession Recommendations")).toBeVisible();

    // Search for a position against the real suggestion engine
    await page.fill('input[placeholder*="Masukkan nama jabatan"]', "Kepala Sekolah");
    await page.keyboard.press("Enter");

    // The real API answers with either candidate recommendations (seeded
    // talent profiles) or the explicit no-candidates state.
    await expect(
      page
        .getByText(/Rekomendasi untuk/)
        .or(page.getByText("Tidak ditemukan kandidat suksesi untuk jabatan ini."))
        .first(),
    ).toBeVisible({ timeout: 20000 });
  });
});
