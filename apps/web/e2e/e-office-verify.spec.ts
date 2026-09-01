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

  test("Automatic public verification works when code URL parameter is present", async ({ page }) => {
    // Open verification page with code parameter
    await page.goto("/public/verify-letter?code=invalid-test-token");

    // Page should auto-populate input and execute verification attempt
    await expect(page.getByPlaceholder(/masukkan token/i)).toHaveValue("invalid-test-token");
  });

  test("Valid public verification displays success status and signer details", async ({ page }) => {
    await page.route("**/api/correspondence/public/verify/valid-token-123", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            isValid: true,
            isRevoked: false,
            signer: { name: "Dr. H. Ahmad", nip: "19800101", position: "Kepala Sekolah" },
            letter: {
              letterNumber: "001/SK/Y-CPS/VIII/2026",
              subject: "Pengumuman Resmi",
              date: "2026-08-01",
              status: "SIGNED",
              unitName: "SMA Al-Qur'an",
            },
            signedAt: "2026-08-01T00:00:00Z",
          },
        }),
      });
    });

    await page.goto("/public/verify-letter?code=valid-token-123");
    await expect(page.getByText(/DOKUMEN SAH & TERVERIFIKASI/i)).toBeVisible();
    await expect(page.getByText("Dr. H. Ahmad")).toBeVisible();
    await expect(page.getByText("001/SK/Y-CPS/VIII/2026")).toBeVisible();
  });

  test("Confidential letter hides subject field on public verification page", async ({ page }) => {
    await page.route("**/api/correspondence/public/verify/confidential-token-123", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            isValid: true,
            isRevoked: false,
            signer: { name: "H. Ustadz Abdullah", nip: "19750202", position: "Sekretaris" },
            letter: {
              letterNumber: "002/RAHASIA/Y-CPS/VIII/2026",
              subject: null,
              date: "2026-08-01",
              status: "SIGNED",
              unitName: "Yayasan Pesantren Cipansor",
            },
            signedAt: "2026-08-01T00:00:00Z",
          },
        }),
      });
    });

    await page.goto("/public/verify-letter?code=confidential-token-123");
    await expect(page.getByText(/DOKUMEN SAH & TERVERIFIKASI/i)).toBeVisible();
    await expect(page.getByText(/Perihal dan isi surat tidak ditampilkan \(Sifat Surat Rahasia\/Terbatas\)/i)).toBeVisible();
  });

  test("PDF upload verification renders match validation badge", async ({ page }) => {
    await page.route("**/api/correspondence/public/verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            isValid: true,
            pdfVerified: true,
            pdfMatch: true,
            signer: { name: "Dr. H. Ahmad", nip: "19800101", position: "Kepala Sekolah" },
            letter: {
              letterNumber: "001/SK/Y-CPS/VIII/2026",
              subject: "Pengumuman Resmi",
              date: "2026-08-01",
              status: "SIGNED",
              unitName: "SMA Al-Qur'an",
            },
            signedAt: "2026-08-01T00:00:00Z",
          },
        }),
      });
    });

    await page.goto("/public/verify-letter");
    await page.getByPlaceholder(/masukkan token/i).fill("valid-token-123");

    // Attach PDF file
    await page.setInputFiles("input[type='file']", {
      name: "surat-resmi.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 Test PDF content"),
    });

    await page.getByRole("button", { name: /verifikasi dokumen/i }).click();

    await expect(page.getByText(/VALIDASI DOKUMEN PDF: FILE ASLI & UTUH/i)).toBeVisible();
  });
});
