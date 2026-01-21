import { test, expect } from "./fixtures/auth.fixture";
import { LoginPage } from "./page-objects";
import { waitForToast, waitForLoadingComplete } from "./helpers/page-helpers";
import { format } from "date-fns";

/**
 * TK Daily Report E2E Tests
 * Tests the creation of daily reports with photos
 */

test.describe("TK Daily Report", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // Login as teacher or superadmin
    await loginPage.loginAndWaitForDashboard(
      "superadmin@cipansor.id",
      "SuperAdmin123!",
    );
  });

  test("should create daily report with photo", async ({ page }) => {
    // Navigate to create page
    await page.goto("/tk/daily-reports/new");
    await waitForLoadingComplete(page);

    // Check if page loaded
    await expect(
      page.getByRole("heading", { name: /buat laporan harian/i }),
    ).toBeVisible();

    // 1. Select Class
    const classSelect = page
      .locator('button[role="combobox"]')
      .filter({ hasText: /pilih kelas/i });
    // Only run if class select is available (data dependency)
    if (await classSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await classSelect.click();
      const classOption = page.getByRole("option").first();
      await classOption.click();

      // 2. Select Student
      const studentSelect = page
        .locator('button[role="combobox"]')
        .filter({ hasText: /pilih siswa/i });
      await expect(studentSelect).toBeEnabled({ timeout: 5000 });
      await studentSelect.click();
      const studentOption = page.getByRole("option").first();
      await studentOption.click();

      // 3. Fill Mood
      const moodSelect = page
        .locator('button[role="combobox"]')
        .filter({ hasText: /pilih mood/i });
      if (await moodSelect.isVisible()) {
        await moodSelect.click();
        await page.getByRole("option").first().click();
      }

      // 4. Upload Photo
      // Create a dummy image file
      const buffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      );

      // Find the file input (it's hidden in PhotoUploader)
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "activity.jpg",
        mimeType: "image/jpeg",
        buffer,
      });

      // Verify photo preview is visible
      await expect(
        page.locator('img[alt*="Foto kegiatan"]').first(),
      ).toBeVisible({ timeout: 5000 });

      // 5. Submit
      await page.getByRole("button", { name: /simpan laporan/i }).click();

      // 6. Verify success
      await waitForToast(page, /berhasil/i);

      // Should redirect to list
      await expect(page).toHaveURL(/\/tk\/daily-reports/);
    } else {
      test.skip(true, "No classes available for testing");
    }
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/tk/daily-reports/new");
    await waitForLoadingComplete(page);

    // Try to submit without filling anything
    await page.getByRole("button", { name: /simpan laporan/i }).click();

    // Check for validation errors
    // Note: shadcn validation usually shows as text below input
    await expect(page.getByText(/siswa wajib dipilih/i)).toBeVisible();
    await expect(page.getByText(/kelas wajib dipilih/i)).toBeVisible();
  });
});
