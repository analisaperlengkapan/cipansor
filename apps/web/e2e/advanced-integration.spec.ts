import { test, expect } from "./fixtures/auth.fixture";
import {
  waitForLoadingComplete,
  waitForToast,
  navigateTo,
} from "./helpers/page-helpers";
import { LoginPage } from "./page-objects";

test.describe("Advanced Integration Flows", () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard(
      "superadmin@cipansor.id",
      "SuperAdmin123!",
    );
  });

  test("Extreme Risk triggers Automatic Audit Finding", async ({ page }) => {
    await navigateTo(page, "/risk-management");

    // Create an EXTREME risk
    await page.getByRole("button", { name: /add risk|tambah/i }).first().click();

    const riskCode = `RSK-AUTO-${Date.now().toString().slice(-4)}`;
    await page.getByLabel(/code/i).fill(riskCode);
    await page.getByLabel(/description/i).fill("Test Extreme Risk for Automation");

    // Select EXTREME likelihood and impact (Assuming score calculation leads to EXTREME)
    // We use Radix Selects
    const pickSelect = async (index: number, optionName: string | RegExp) => {
      const triggers = page.locator('button[role="combobox"]');
      await triggers.nth(index).click();
      await page.getByRole("option", { name: optionName }).click();
    };

    await pickSelect(0, /strategic/i); // Category
    await pickSelect(1, /almost certain/i); // Likelihood (5)
    await pickSelect(2, /catastrophic/i); // Impact (5) -> Score 25 (EXTREME)

    await page.getByRole("button", { name: /save|simpan/i }).click();
    await waitForToast(page, /success|berhasil/i);

    // Now check if an Internal Audit was created
    await navigateTo(page, "/pengawasan"); // Audit module
    await expect(page.getByText(new RegExp(`Audit Respon Risiko Ekstrim: ${riskCode}`, "i"))).toBeVisible({ timeout: 10000 });
  });

  test("Published Research Project creates SOP Draft", async ({ page }) => {
    await navigateTo(page, "/litbang");

    // Find an existing project or create one? Let's try to find the first one and publish it.
    const projectCard = page.locator(".card, [role='article']").filter({ hasText: /pendidikan|teknologi/i }).first();

    if (await projectCard.isVisible()) {
      await projectCard.click();
      await waitForLoadingComplete(page);

      // Assume there is an "Edit" or "Status" change button
      const statusSelect = page.locator('button[role="combobox"]').filter({ hasText: /status/i });
      if (await statusSelect.isVisible()) {
        await statusSelect.click();
        await page.getByRole("option", { name: /published/i }).click();

        // Ensure findings are present
        const findingsArea = page.getByLabel(/findings|temuan/i);
        if (await findingsArea.isVisible()) {
          await findingsArea.fill("Automated findings from E2E test.");
        }

        await page.getByRole("button", { name: /save|update/i }).click();
        await waitForToast(page, /success|berhasil/i);

        // Check Tata Laksana for new SOP Draft
        await navigateTo(page, "/tata-laksana");
        await expect(page.getByText(/Peningkatan Berbasis Penelitian/i)).toBeVisible({ timeout: 10000 });
      }
    } else {
       console.log("No research project found to test SOP integration");
    }
  });
});
