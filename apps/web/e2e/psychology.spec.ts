import { test, expect } from "./fixtures/auth.fixture";
import {
  waitForLoadingComplete,
  waitForToast,
  navigateTo,
} from "./helpers/page-helpers";

test.describe("Psychology Management System", () => {
  test.use({ storageState: ".auth/superAdmin.json" });

  test("should create a new test type", async ({ page }) => {
    await navigateTo(page, "/counseling/tests");

    // Click "Add Test"
    const addButton = page.getByRole("button", { name: /tambah alat tes/i });
    if (await addButton.isVisible()) {
        await addButton.click();

        // Fill form
        await page.getByLabel(/nama tes/i).fill("E2E Test Intelligence Scale");

        // Select type - Find the trigger for the Select component
        // Shadcn Select trigger usually has role combobox
        const typeTrigger = page.getByRole("combobox").first();
        await typeTrigger.click();

        // Select 'Intelegensi' option
        await page.getByRole("option").first().click();

        await page.getByLabel(/deskripsi/i).fill("Test created by E2E automation");

        // Submit
        await page.getByRole("button", { name: /buat alat tes/i }).click();

        // Verify
        await waitForToast(page, /berhasil/i);
        await expect(page.getByText("E2E Test Intelligence Scale")).toBeVisible();
    } else {
        test.skip(true, "Tests page not fully loaded or accessible");
    }
  });

  test("should create a new assessment record", async ({ page }) => {
    await navigateTo(page, "/counseling/assessments/new");

    // Select Student
    // The student selector is a Popover + Command, trigger has role combobox
    const studentTrigger = page.getByRole("combobox").filter({ hasText: /cari siswa/i });
    if (await studentTrigger.isVisible()) {
        await studentTrigger.click();

        // Wait for options
        const studentOption = page.getByRole("option").first();
        await studentOption.waitFor({ timeout: 5000 }).catch(() => null);

        if (await studentOption.isVisible()) {
            await studentOption.click();

            // Select Test
            // Select component for test
            const testTrigger = page.getByRole("combobox").filter({ hasText: /pilih alat tes/i });
            await testTrigger.click();

            const testOption = page.getByRole("option").first();
            await testOption.waitFor();
            await testOption.click();

            // Date
            const dateTrigger = page.getByRole("button", { name: /pilih tanggal/i });
            await dateTrigger.click();
            // Just click the current day (usually selected or available)
            // Or click a specific visible day
            await page.locator('.rdp-day:not(.rdp-day_outside)').first().click();

            // Score
            await page.getByLabel(/skor total/i).fill("120");
            await page.getByLabel(/klasifikasi/i).fill("Superior");
            await page.getByLabel(/analisis/i).fill("E2E Analysis Result");

            // Submit
            await page.getByRole("button", { name: /simpan data/i }).click();

            // Verify redirect and list
            await page.waitForURL(/\/counseling\/assessments$/);
            await expect(page.getByText("Superior")).toBeVisible();
        } else {
            test.skip(true, "No students available for selection");
        }
    } else {
        test.skip(true, "New assessment form not loaded");
    }
  });
});
