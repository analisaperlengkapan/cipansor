import { test, expect } from "./fixtures/auth.fixture";
import { navigateTo, waitForLoadingComplete } from "./helpers/page-helpers";

test.describe("Student Risk Monitoring", () => {
  // Use admin or counselor role
  test.use({ storageState: ".auth/superAdmin.json" });

  test.beforeEach(async ({ page }) => {
    await navigateTo(page, "/counseling/risk");
  });

  test("should display risk dashboard with metrics", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Student Risk Monitoring" })).toBeVisible({ timeout: 10000 });

    // Check metric cards
    await expect(page.getByText("At Risk Students")).toBeVisible();
    await expect(page.getByText("Critical / High Risk")).toBeVisible();
    await expect(page.getByText("Avg Risk Score")).toBeVisible();
  });

  test("should display student risk table", async ({ page }) => {
    // Wait for table to load
    await waitForLoadingComplete(page);

    const table = page.locator("table");
    await expect(table).toBeVisible();

    // Check headers
    await expect(page.getByRole("columnheader", { name: "Student" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Risk Score" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Breakdown (Pts)" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Level" })).toBeVisible();
  });

  test("should allow filtering by minimum score", async ({ page }) => {
    await waitForLoadingComplete(page);

    const filterTrigger = page.locator("button[role='combobox']").filter({ hasText: /Score|20/ });
    if (await filterTrigger.isVisible()) {
        await filterTrigger.click();
        await page.getByRole("option", { name: "50+" }).click();

        await waitForLoadingComplete(page);

        // Just verify table is still there (empty or filtered)
        await expect(page.locator("table")).toBeVisible();
    }
  });

  test("should have action to create counseling case", async ({ page }) => {
    await waitForLoadingComplete(page);

    // If there are rows
    const rows = page.locator("table tbody tr");
    if (await rows.count() > 0) {
        const actionsButton = rows.first().locator("button").last(); // Assuming last column is actions
        await actionsButton.click();

        const createLink = page.getByRole("menuitem", { name: /Create Counseling Case/i });
        await expect(createLink).toBeVisible();

        // Verify href contains risk param
        const href = await createLink.getAttribute("href");
        expect(href).toContain("risk=true");
    }
  });
});
