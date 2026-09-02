import { test, expect } from "@playwright/test";

/**
 * The page a letter's QR opens.
 *
 * This exists because the feature shipped unreachable: the API route was
 * correctly registered before `authenticate`, the page was written with
 * `no-store` and `noindex` — and the Next middleware, which nobody updated,
 * bounced every visitor to /login. A QR that leads to a staff login form is
 * not a verification feature, and nothing in the suite noticed.
 *
 * These tests run with no session on purpose: that is the only state the
 * people who scan a letter's QR are ever in.
 */

test.use({ storageState: { cookies: [], origins: [] } });

const SOME_TOKEN = "e2e-token-that-does-not-exist";

test("a scanned QR does not land on the login page", async ({ page }) => {
  const response = await page.goto(`/verifikasi/${SOME_TOKEN}`);

  // The redirect was a 307 to /login?redirect=… — assert on the URL we ended
  // up at, which is what the person holding the letter actually sees.
  expect(new URL(page.url()).pathname).toBe(`/verifikasi/${SOME_TOKEN}`);
  // An unknown token renders a 404 "Surat tidak ditemukan" verification page,
  // which is expected public behavior (status 404, not redirected to login).
  expect([200, 404]).toContain(response?.status());
});

test("an unknown token is answered, not hidden behind a login form", async ({
  page,
}) => {
  await page.goto(`/verifikasi/${SOME_TOKEN}`);

  // Whatever the wording, the page must tell the scanner something about this
  // letter rather than ask them who they are.
  await expect(page.locator("body")).not.toContainText(/kata sandi|password/i);
  await expect(page.getByRole("textbox", { name: /email/i })).toHaveCount(0);
});
