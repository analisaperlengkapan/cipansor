import { test, expect } from "./fixtures/auth.fixture";
import { LoginPage } from "./page-objects";

test.describe("Single Sign-On (SSO) Buttons", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should display Google Workspace and Microsoft 365 SSO buttons", async ({ page }) => {
    const googleBtn = page.getByRole("button", { name: /Google Workspace/i });
    const microsoftBtn = page.getByRole("button", { name: /Microsoft 365/i });

    await expect(googleBtn).toBeVisible();
    await expect(microsoftBtn).toBeVisible();
  });

  test("should show configuration toast when SSO provider is disabled", async ({ page }) => {
    // Mock getSSOConfig response with disabled providers
    await page.route("**/api/auth/sso/config", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            domain: "cipansor.or.id",
            googleEnabled: false,
            googleClientId: null,
            microsoftEnabled: false,
            microsoftClientId: null,
          },
        }),
      });
    });

    const googleBtn = page.getByRole("button", { name: /Google Workspace/i });
    await googleBtn.click();

    // Verify toast or notification appears
    await expect(
      page.getByText(/Google Workspace SSO belum dikonfigurasi/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("should handle requiresTwoFactor branch during SSO callback", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.route("**/api/auth/sso/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            requiresTwoFactor: true,
            tempToken: "temp_2fa_sso_token_123",
          },
        }),
      });
    });

    await page.goto("/login#id_token=valid_mock_token&provider=google");

    await expect(
      page.getByText(/Two-Factor Authentication/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
