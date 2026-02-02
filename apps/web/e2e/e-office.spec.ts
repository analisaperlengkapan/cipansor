import { test, expect } from "./fixtures/auth.fixture";
import {
  waitForLoadingComplete,
  waitForToast,
  navigateTo,
} from "./helpers/page-helpers";

test.describe("E-Office Management", () => {
  test.use({ storageState: ".auth/superAdmin.json" });

  test("should create incoming letter and manage disposition", async ({ page }) => {
    // 1. Navigate to E-Office Inbox
    await navigateTo(page, "/e-office/inbox");
    await expect(page.getByRole("heading", { name: /E-Office|Surat/i })).toBeVisible();

    // 2. Create Incoming Letter
    await page.getByRole("button", { name: /Buat Surat/i }).click();
    await waitForLoadingComplete(page);
    await expect(page).toHaveURL(/\/e-office\/create/);

    // Fill form
    await page.getByLabel("Perihal").fill("Test Surat Masuk E2E");
    await page.getByLabel("Pengirim").fill("Dinas Pendidikan");
    // Depending on input type (text vs select), this might vary. Assuming text for simplicity or standard shadcn input
    // If Select, we might need to click trigger.

    await page.getByLabel("Isi Ringkas").fill("Ini adalah surat tes untuk E2E testing.");

    // Submit
    await page.getByRole("button", { name: /Simpan|Buat/i }).click();
    await waitForToast(page, /berhasil/i);

    // 3. Verify in Inbox
    await navigateTo(page, "/e-office/inbox");
    await expect(page.getByText("Test Surat Masuk E2E")).toBeVisible();

    // 4. Verify Detail & Print Disposition
    await page.getByText("Test Surat Masuk E2E").click();
    await waitForLoadingComplete(page);

    await expect(page.getByRole("heading", { name: "Detail Surat" })).toBeVisible();

    // Check for "Cetak Lembar Disposisi" (Specific to Incoming)
    await expect(page.getByRole("button", { name: /Cetak Lembar Disposisi/i })).toBeVisible();

    // 5. Create Disposition
    await page.getByRole("button", { name: "Disposisi" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Select recipient
    const recipientSelect = dialog.locator('button[role="combobox"]').first();
    await recipientSelect.click();
    await page.getByRole("option").first().click();

    await dialog.getByLabel("Instruksi").fill("Mohon ditindaklanjuti segera.");
    await dialog.getByRole("button", { name: "Kirim Disposisi" }).click();
    await waitForToast(page, /berhasil/i);

    // 6. Verify Timeline update
    await expect(page.getByText("Mohon ditindaklanjuti segera.")).toBeVisible();

    // 7. Verify Agenda Export Button on Inbox
    await navigateTo(page, "/e-office/inbox");
    await expect(page.getByRole("button", { name: /Cetak Buku Agenda/i })).toBeVisible();
  });
});
