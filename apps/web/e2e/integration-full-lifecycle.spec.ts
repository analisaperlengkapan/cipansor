import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth-api";

/**
 * Integration Test: Full Student Lifecycle & Marketing ROI
 * 1. Register a new Lead with a Campaign
 * 2. Promote Lead to Student
 * 3. Generate & Pay Invoice
 * 4. Verify Marketing ROI Attribution
 */
test.describe("Integrated Student Lifecycle", () => {
  // Use a unique suffix for this test run to avoid collisions
  const testId = Date.now().toString().slice(-6);
  const leadName = `Test Student ${testId}`;
  const campaignCode = `CAMP-${testId}`;

  test("should follow full flow from lead to revenue attribution", async ({ page }) => {
    // 1. Setup: Create a Marketing Campaign
    await loginAs(page, "superAdmin");
    await page.goto("/marketing");

    await page.getByRole("button", { name: /Buat Kampanye/i }).click();
    await page.getByLabel(/Kode Kampanye/i).fill(campaignCode);
    await page.getByLabel(/Nama Kampanye/i).fill(`Campaign ${leadName}`);
    await page.getByLabel(/Budget/i).fill("1000000");
    await page.getByRole("button", { name: /Simpan/i }).click();

    await expect(page.getByText(campaignCode)).toBeVisible();

    // 2. Lead Registration (Public Multi-step Form)
    await page.goto(`/public/ppdb?campaign_id=${campaignCode}`); // Use real param name from PublicPPDBPage

    // Step 0: Student Data
    await page.getByLabel(/Unit Pendidikan/i).click();
    await page.getByRole("option").first().click(); // Select first available unit
    await page.getByLabel(/Nama Lengkap/i).fill(leadName);
    await page.getByLabel(/Jenis Kelamin/i).click();
    await page.getByRole("option", { name: "Laki-laki" }).click();
    await page.getByLabel(/Tempat Lahir/i).fill("Jakarta");
    await page.locator('input[type="date"]').fill("2015-01-01");
    await page.getByRole("button", { name: /Selanjutnya/i }).click();

    // Step 1: Parent Data
    await page.getByLabel(/Nama Ayah/i).fill("Bapak Test");
    await page.getByLabel(/No. WhatsApp/i).first().fill("08123456789");
    await page.getByLabel(/Nama Ibu/i).fill("Ibu Test");
    await page.getByRole("button", { name: /Selanjutnya/i }).click();

    // Step 2: Address
    await page.getByLabel(/Alamat Lengkap/i).fill("Jl. Test No. 123");
    await page.getByLabel(/Kota/i).fill("Jakarta");
    await page.getByLabel(/Provinsi/i).fill("DKI Jakarta");
    await page.getByRole("button", { name: /Selanjutnya/i }).click();

    // Step 3: Quran (Skip/Default)
    await page.getByRole("button", { name: /Selanjutnya/i }).click();

    // Step 4: Documents (Skip/Optional)
    await page.getByRole("button", { name: /Selanjutnya/i }).click();

    // Step 5: Confirmation & Submit
    await page.getByRole("button", { name: /Kirim Pendaftaran/i }).click();
    await expect(page.getByText(/Pendaftaran Berhasil/i)).toBeVisible();

    // 3. Admin: Promote Lead to Student
    await page.goto("/admissions"); // Unified dashboard
    await page.getByRole("link", { name: /Semua Pendaftar/i }).click();
    await page.getByText(leadName).click();
    // Assuming Detail page has Onboarding button (based on useOnboardRegistrant hook)
    await page.getByRole("button", { name: /Onboard/i }).click();
    await page.getByRole("button", { name: /Konfirmasi/i }).click();

    await expect(page.getByText(/Santri berhasil diaktifkan/i)).toBeVisible();

    // 4. Finance: Create & Pay Invoice
    await page.goto("/finance/billing");
    await page.getByPlaceholder(/Cari santri/i).fill(leadName);
    await page.getByText(leadName).click();

    await page.getByRole("button", { name: /Tagih/i }).click();
    await page.getByLabel(/Jenis Pembayaran/i).click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /Kirim Tagihan/i }).click();

    // Pay it
    await page.goto("/finance/payments");
    const row = page.locator("tr").filter({ hasText: leadName }).first();
    await row.getByRole("button", { name: /Bayar/i }).click();
    await page.getByLabel(/Metode/i).click();
    await page.getByRole("option", { name: /Tunai/i }).click();
    await page.getByRole("button", { name: /Konfirmasi Pembayaran/i }).click();

    await expect(page.getByText(/Berhasil/i)).toBeVisible();

    // 5. Verify Marketing ROI Attribution
    await page.goto("/marketing");
    await page.getByRole("tab", { name: /Analytics/i }).click();
    await expect(page.getByText(campaignCode)).toBeVisible();
    // Revenue should be > 0 in the ROI table
    const roiRow = page.locator("tr").filter({ hasText: campaignCode });
    await expect(roiRow).toContainText(/Rp/);
  });
});
