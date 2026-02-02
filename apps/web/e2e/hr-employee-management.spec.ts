import { test, expect } from "./fixtures/auth.fixture";
import {
  waitForLoadingComplete,
  waitForToast,
  navigateTo,
  fillForm,
} from "./helpers/page-helpers";

test.describe("HR - Employee Management", () => {
  test.use({ storageState: ".auth/superAdmin.json" });

  test("should create a new Teacher with extended fields", async ({ page }) => {
    await navigateTo(page, "/hr/employees");

    // Click Add Employee
    await page.getByRole("link", { name: /add employee/i }).click();
    await waitForLoadingComplete(page);

    // 1. Personal Info
    // Select Role: Teacher
    await page.getByRole("combobox", { name: /peran/i }).click();
    await page.getByRole("option", { name: /guru/i }).click();

    await page.getByLabel(/^nip/i).fill("12345678");
    await page.getByLabel(/nik/i).fill("3201123456789000");
    await page.getByLabel(/nama lengkap/i).fill("Budi Santoso S.Pd");

    // Gender
    await page.getByRole("combobox", { name: /jenis kelamin/i }).click();
    await page.getByRole("option", { name: /laki-laki/i }).click();

    // Teacher specific fields
    await page.getByLabel(/nuptk/i).fill("9876543210");
    await page.getByLabel(/no\. kartu keluarga/i).fill("3201000000000001");

    await page.getByLabel(/alamat jalan/i).fill("Jl. Merdeka No. 10");
    await page.getByLabel(/^rt/i).fill("005");
    await page.getByLabel(/^rw/i).fill("002");
    await page.getByLabel(/kode pos/i).fill("40123");

    // Next Tab (Employment)
    await page.getByRole("tab", { name: /kepegawaian/i }).click();

    // Select Unit
    const unitSelect = page.getByRole("combobox", { name: /unit/i });
    await unitSelect.click();
    // Select first unit
    await page.getByRole("option").first().click();

    await page.getByLabel(/jabatan/i).fill("Guru Kelas 1");

    // Employee Type
    await page.getByRole("combobox", { name: /tipe karyawan/i }).click();
    await page.getByRole("option").first().click(); // Select first type (e.g. Permanent)

    await page.getByLabel(/tanggal bergabung/i).fill("2024-01-01");

    // Next Tab (Bank)
    await page.getByRole("tab", { name: /bank/i }).click();

    await page.getByLabel(/nama bank/i).click();
    await page.getByRole("option", { name: /bca/i }).click();

    await page.getByLabel(/nomor rekening/i).fill("123000999");
    await page.getByLabel(/atas nama/i).fill("Budi Santoso");

    // Submit
    await page.getByRole("button", { name: /simpan karyawan/i }).click();

    // Verify Success
    await waitForToast(page, /berhasil/i);
    await expect(page).toHaveURL(/\/hr$/);
  });

  test("should display History and Documents tabs in Edit page", async ({ page }) => {
    await navigateTo(page, "/hr/employees");
    await waitForLoadingComplete(page);

    // Find the first employee and click edit
    // Note: Depends on how the list renders edit actions.
    // The component uses a DropdownMenu for actions.

    const row = page.locator("table tbody tr").first();
    const menuBtn = row.locator("button").last(); // Assuming actions is last column
    await menuBtn.click();

    await page.getByRole("menuitem", { name: /edit/i }).click();
    await waitForLoadingComplete(page);

    // Verify Tabs
    await expect(page.getByRole("tab", { name: /riwayat/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /dokumen/i })).toBeVisible();

    // Click History Tab
    await page.getByRole("tab", { name: /riwayat/i }).click();
    await expect(page.getByText(/belum ada riwayat/i).or(page.locator(".relative.border-l"))).toBeVisible();

    // Click Documents Tab
    await page.getByRole("tab", { name: /dokumen/i }).click();
    await expect(page.getByText(/belum ada dokumen/i).or(page.locator(".grid"))).toBeVisible();
  });
});
