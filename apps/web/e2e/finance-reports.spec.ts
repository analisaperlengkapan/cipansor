import { test, expect } from "./fixtures/auth.fixture";
import {
  waitForLoadingComplete,
  navigateTo,
} from "./helpers/page-helpers";

test.describe("Finance - ISAK 35 Reports", () => {
  test.use({ storageState: ".auth/superAdmin.json" });

  test("should navigate to Financial Reports dashboard", async ({ page }) => {
    await navigateTo(page, "/finance/reports");
    await expect(page.getByRole("heading", { name: "Laporan Keuangan", level: 1 })).toBeVisible();
    await expect(page.getByText("Pusat laporan keuangan standar ISAK 35")).toBeVisible();
  });

  test("should load Statement of Activities (Laporan Aktivitas)", async ({ page }) => {
    await navigateTo(page, "/finance/reports");

    // Click the card/link
    await page.getByText("Laporan Aktivitas").first().click();
    await waitForLoadingComplete(page);

    // Verify Page
    await expect(page).toHaveURL(/\/finance\/reports\/statement-of-activities/);
    await expect(page.getByRole("heading", { name: "Laporan Aktivitas", level: 1 })).toBeVisible();

    // Check table headers
    await expect(page.getByRole("columnheader", { name: "Uraian" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Tanpa Pembatasan" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Dengan Pembatasan" })).toBeVisible();
  });

  test("should load Statement of Financial Position (Posisi Keuangan)", async ({ page }) => {
    await navigateTo(page, "/finance/reports");

    // Click the card/link
    await page.getByText("Laporan Posisi Keuangan").first().click();
    await waitForLoadingComplete(page);

    // Verify Page
    await expect(page).toHaveURL(/\/finance\/reports\/statement-of-financial-position/);
    await expect(page.getByRole("heading", { name: "Laporan Posisi Keuangan", level: 1 })).toBeVisible();

    // Check sections
    // Note: The headings might be nested or styled differently, but text check usually works.
    await expect(page.getByText("Aset", { exact: true }).or(page.getByRole("heading", { name: "Aset" }))).toBeVisible();
    await expect(page.getByText("Liabilitas", { exact: true }).or(page.getByRole("heading", { name: "Liabilitas" }))).toBeVisible();
    await expect(page.getByText("Aset Neto (Net Assets)").or(page.getByRole("heading", { name: "Aset Neto" }))).toBeVisible();
  });
});
