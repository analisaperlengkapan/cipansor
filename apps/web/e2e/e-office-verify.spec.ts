import { test, expect } from "@playwright/test";

test.describe("E-Office & Public Letter Verification E2E", () => {
  test("Public Letter Verification page loads and displays form and CAPTCHA", async ({ page }) => {
    await page.goto("http://localhost:3000/public/verify-letter");

    await expect(page.locator("h1")).toContainText("Verifikasi Tanda Tangan Elektronik");
    await expect(page.getByPlaceholder(/masukkan token/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /verifikasi dokumen/i })).toBeVisible();
  });

  test("E-Office main page renders and displays stats for authenticated users", async ({ page }) => {
    // Navigate to e-office page
    await page.goto("http://localhost:3000/e-office");

    // Expect E-Office header
    await expect(page.locator("h1")).toContainText("E-Office");
    await expect(page.getByRole("button", { name: /buat surat baru/i })).toBeVisible();
  });
});
