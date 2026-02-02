import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects";

test.describe("Parent Portal", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();

    // Use Super Admin credentials as they are known to exist.
    // Super Admin has access to Parent Portal based on layout logic.
    await loginPage.login("superadmin@cipansor.id", "SuperAdmin123!");

    // Wait for login to complete (likely redirects to dashboard)
    await page.waitForURL(/\/dashboard/);

    // Navigate to Parent Portal manually
    await page.goto("/parent");
    await page.waitForURL(/\/parent/);
  });

  test("should display parent dashboard", async ({ page }) => {
    await expect(page).toHaveURL(/\/parent/);
    // Sidebar should be visible
    await expect(page.getByText("Portal Orang Tua")).toBeVisible();

    // Quick actions or Sidebar links
    await expect(page.getByText("Keuangan").first()).toBeVisible();
  });

  test("should navigate to finance page", async ({ page }) => {
    // Navigate using sidebar link or direct URL to be robust
    await page.goto("/parent/finance");
    await expect(page).toHaveURL(/\/parent\/finance/);
    await expect(page.getByText("Daftar Tagihan")).toBeVisible();
  });

  test("should navigate to settings and show profile form", async ({ page }) => {
    await page.goto("/parent/settings");
    await expect(page).toHaveURL(/\/parent\/settings/);

    await expect(page.getByText("Informasi Profil")).toBeVisible();
    await expect(page.getByLabel("Nama Lengkap")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();

    // Check Security Tab
    await page.click('text="Keamanan"');
    await expect(page.getByText("Ubah Password")).toBeVisible();
  });
});
