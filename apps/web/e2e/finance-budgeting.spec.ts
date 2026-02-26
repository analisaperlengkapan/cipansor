import { test, expect } from "@playwright/test";

test.describe("Finance - Budgeting", () => {
  // Mock data
  const mockUnits = {
    data: [{ id: "unit-1", name: "Unit Test" }]
  };
  const mockYears = {
    data: [{ id: "year-1", name: "2024/2025" }]
  };
  const mockAccounts = {
    data: [{ id: "acc-1", code: "5101", name: "Beban Gaji" }]
  };
  const mockBudgets = {
    data: []
  };

  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route("**/api/units", async (route) => {
      await route.fulfill({ json: mockUnits });
    });
    await page.route("**/api/academic-years", async (route) => {
      await route.fulfill({ json: mockYears });
    });
    await page.route("**/api/finance-enhancement/account-codes*", async (route) => {
      await route.fulfill({ json: mockAccounts });
    });
    await page.route("**/api/finance-enhancement/budgets*", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ json: { data: { id: "new-budget", amount: 10000000 } } });
      } else if (route.request().method() === "DELETE") {
        await route.fulfill({ json: { success: true } });
      } else {
        await route.fulfill({ json: mockBudgets });
      }
    });
    await page.route("**/api/finance-enhancement/budgets/recalculate", async (route) => {
      await route.fulfill({ json: { count: 1 } });
    });

    // Mock Authentication (bypass login check if possible or mock user endpoint)
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({ json: { data: { id: "user-1", name: "Admin", role: "SUPER_ADMIN" } } });
    });

    // Inject token to bypass middleware (if any)
    await page.addInitScript(() => {
      localStorage.setItem("auth-storage", JSON.stringify({
        state: {
          user: { id: "user-1", name: "Admin", role: "SUPER_ADMIN" },
          token: "mock-token",
          isAuthenticated: true
        },
        version: 0
      }));
    });
  });

  test("should manage budgets", async ({ page }) => {
    // Go directly to page
    await page.goto("/finance/budgeting");

    // Handle login redirection if it happens (mock login)
    if (page.url().includes("/login")) {
       // If redirected to login, usually means auth state wasn't picked up or /me failed.
       // But we mocked /me and localStorage.
       // Let's assume the app checks /me on load.
    }

    const heading = page.getByRole("heading", { name: /anggaran|budget/i });

    // Wait for the page to load
    await expect(heading).toBeVisible({ timeout: 15000 });

    // 1. Select Unit and Year
    const unitSelect = page
      .locator('button[role="combobox"]')
      .filter({ hasText: /pilih unit/i })
      .first();

    await expect(unitSelect).toBeVisible();
    await unitSelect.click();
    await page.getByRole("option").first().click();

    const yearSelect = page
      .locator('button[role="combobox"]')
      .filter({ hasText: /pilih tahun ajaran/i })
      .first();

    await expect(yearSelect).toBeVisible();
    await yearSelect.click();
    await page.getByRole("option").first().click();

    // 2. Create Budget
    const addButton = page.getByRole("button", { name: /tambah anggaran/i });
    await expect(addButton).toBeEnabled();
    await addButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Select Account
    const accountSelect = dialog.locator('button[role="combobox"]').first();
    await accountSelect.click();
    await page.getByRole("option").first().click();

    // Fill Amount
    const amountInput = dialog.locator('input[type="number"]');
    await amountInput.fill("10000000");

    // Save
    const saveButton = dialog.getByRole("button", { name: /simpan/i });
    await saveButton.click();

    // Verify Toast
    const toast = page.locator("li[data-sonner-toast]"); // Sonner toast selector
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/success|berhasil/i);

    // Mock the list response to include the new budget after creation
    // In a real E2E we rely on backend, here we just verified the interaction flow up to mutation call.
    // To verify table update, we would need to update the mock handler for GET /budgets.
    // For this environment, verifying the "Success" toast is sufficient proof of interaction.

    // 3. Recalculate
    const recalcButton = page.getByRole("button", { name: /recalculate/i });
    await recalcButton.click();
    const toastRecalc = page.locator("li[data-sonner-toast]").last();
    await expect(toastRecalc).toBeVisible();
    await expect(toastRecalc).toContainText(/success|berhasil/i);
  });
});
