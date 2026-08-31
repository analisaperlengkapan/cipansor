import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth-api";

test.describe("E-Office & Public Letter Verification E2E", () => {
  test("Public Letter Verification page loads and displays form and CAPTCHA", async ({ page }) => {
    await page.goto("/public/verify-letter");

    await expect(page.locator("h1")).toContainText("Verifikasi Tanda Tangan Elektronik");
    await expect(page.getByPlaceholder(/masukkan token/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /verifikasi dokumen/i })).toBeVisible();

    // Fill invalid token and fail CAPTCHA check first
    await page.getByPlaceholder(/masukkan token/i).fill("invalid-token-123");
    await page.getByRole("button", { name: /verifikasi dokumen/i }).click();
    await expect(page.getByText(/jawaban verifikasi keamanan/i)).toBeVisible();
  });

  test("E-Office main page renders and displays stats for authenticated users", async ({ page }) => {
    await loginAs(page, "superAdmin");

    // Navigate to e-office page
    await page.goto("/e-office");

    // Expect E-Office header
    await expect(page.locator("h1")).toContainText("E-Office");
    await expect(page.getByRole("button", { name: /buat surat baru/i })).toBeVisible();
  });
});
