import { test, expect } from "@playwright/test";
import { primeAuthCookies } from "./helpers/auth";

test("Finance Cash Flow Forecast Page", async ({ page }) => {
  test.setTimeout(60000);

  // Cookies the Next middleware reads must exist before the first navigation.
  await primeAuthCookies(page);

  // Mock Auth & Session
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: { id: "user-1", name: "Finance Admin", role: "UNIT_ADMIN", unitId: "unit-1" },
      },
    });
  });

  // Mock Forecast API
  await page.route("**/api/finance-enhancement/reports/cash-flow-forecast*", async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          initialBalance: 50000000,
          forecast: [
            { month: "Jan 24", income: 10000000, expense: 5000000, netFlow: 5000000, balance: 55000000 },
            { month: "Feb 24", income: 12000000, expense: 8000000, netFlow: 4000000, balance: 59000000 },
            { month: "Mar 24", income: 15000000, expense: 20000000, netFlow: -5000000, balance: 54000000 },
          ],
        },
      },
    });
  });

  // Bypass login by setting localStorage
  await page.goto("http://localhost:3000/");
  await page.evaluate(() => {
    localStorage.setItem("accessToken", "fake-token");
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          user: { id: "user-1", name: "Finance Admin", role: "UNIT_ADMIN", unitId: "unit-1" },
          isAuthenticated: true,
        },
      })
    );
  });

  // Navigate to forecast page
  await page.goto("http://localhost:3000/finance/reports/cash-flow-forecast");

  // Verify elements
  await expect(page.locator("text=Proyeksi Arus Kas")).toBeVisible();
  await expect(page.locator("text=Rp 50.000.000")).toBeVisible(); // Initial balance
  await expect(page.locator("text=Net Perubahan Kas")).toBeVisible();

  // Verify Chart presence (Recharts renders svg/div)
  await expect(page.locator(".recharts-responsive-container")).toHaveCount(2);

  // Verify Table data specifically in the table body to avoid chart labels
  const table = page.locator("table");
  await expect(table.locator("td:has-text('Jan 24')")).toBeVisible();
  await expect(table.locator("td:has-text('Rp 54.000.000')")).toBeVisible(); // Final balance
});
