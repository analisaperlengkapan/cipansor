import { test, expect } from "./fixtures/auth.fixture";
import {
  waitForLoadingComplete,
  waitForToast,
  navigateTo,
} from "./helpers/page-helpers";

test.describe("Marketing Management", () => {
  test.use({ storageState: ".auth/superAdmin.json" });

  const timestamp = Date.now();
  const campaignCode = `CMP-${timestamp}`;
  const leadName = `Lead ${timestamp}`;

  test("should create a new campaign", async ({ page }) => {
    await navigateTo(page, "/marketing");
    await page.getByRole("tab", { name: "Kampanye" }).click();

    // Click Buat Kampanye (might be in header or empty state)
    // The button is in the header: "Buat Kampanye"
    await page.getByRole("button", { name: "Buat Kampanye" }).click();

    await page.getByLabel("Kode Kampanye*").fill(campaignCode);
    await page.getByLabel("Nama Kampanye*").fill(`Campaign ${timestamp}`);
    await page.getByLabel("Deskripsi").fill("Test Campaign Description");
    await page.getByLabel("Tanggal Mulai*").fill("2026-01-01");

    await page.getByRole("button", { name: "Simpan" }).click();
    await waitForToast(page, /berhasil/i);

    // Verify in list
    await expect(page.getByText(campaignCode)).toBeVisible();
  });

  test("should create a new lead and manage status", async ({ page }) => {
    await navigateTo(page, "/marketing/leads");

    // Create Lead
    await page.getByRole("button", { name: "Lead Baru" }).click();
    await page.getByLabel("Nama Lengkap").fill(leadName);
    await page.getByLabel("Nomor HP").fill("08123456789");

    await page.getByRole("button", { name: "Simpan" }).click();
    await waitForToast(page, /berhasil/i);

    // Verify in list
    await expect(page.getByText(leadName)).toBeVisible();

    // Switch to Board View
    await page.getByRole("tab", { name: "Board" }).click();
    // Wait for board to load (maybe spinner disappears)
    await expect(page.getByText(leadName)).toBeVisible();

    // Click on Lead to go to Detail
    await page.getByText(leadName).first().click();
    await waitForLoadingComplete(page);

    // Change Status via Dropdown
    // The dropdown trigger has placeholder "Status" or current value "NEW"
    const statusTrigger = page.locator('button[role="combobox"]').filter({ hasText: /Status|NEW/ }).first();
    await statusTrigger.click();
    await page.getByRole("option", { name: "CONTACTED" }).click();

    // Verify status update
    await expect(statusTrigger).toHaveText(/CONTACTED/i);
  });
});
