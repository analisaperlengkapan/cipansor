import { test, expect } from "@playwright/test";
import { primeAuthCookies } from './helpers/auth';

test("Risk - Audit Integration", async ({ page }) => {
  test.setTimeout(60000);
  await primeAuthCookies(page);

  // Fallback for any incidental API call (notifications, my-roles, etc.).
  // Registered first so the specific mocks below take precedence (Playwright
  // matches the most recently registered route first). Without this, a stray
  // 401 triggers the axios refresh→logout flow and redirects to /login,
  // wiping the page under test.
  await page.route("**/api/**", async (route) => {
    await route.fulfill({ json: { success: true, data: [] } });
  });

  // Keep a stray 401 from ever logging the test out via the refresh flow.
  await page.route("**/api/auth/refresh", async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: { accessToken: "fake-token", refreshToken: "fake-token" },
      },
    });
  });

  // Mock Auth
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: { id: "user-1", name: "Risk Admin", role: "UNIT_ADMIN", unitId: "unit-1" },
      },
    });
  });

  // Mock Risk with Audit Findings
  await page.route("**/api/risk/risk-123", async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          id: "risk-123",
          code: "RSK-999",
          description: "Potential cash leak in canteen",
          category: "FINANCIAL",
          status: "MONITORING",
          riskLevel: "HIGH",
          riskScore: 16,
          strategicPlan: { id: "plan-1", title: "Canteen Modernization" },
          auditFindings: [
            { id: "find-1", findingNumber: "FIND-01", title: "Missing receipts", severity: "MAJOR", auditId: "audit-1" }
          ],
          mitigations: [],
          createdBy: { name: "System" },
          createdAt: new Date().toISOString()
        },
      },
    });
  });

  // Bypass login
  await page.goto("http://localhost:3000/");
  await page.evaluate(() => {
    localStorage.setItem("accessToken", "fake-token");
    localStorage.setItem("auth-storage", JSON.stringify({
      state: {
        user: { id: "user-1", name: "Risk Admin", role: "UNIT_ADMIN", unitId: "unit-1" },
        isAuthenticated: true,
      }
    }));
  });

  // Go to risk detail
  await page.goto("http://localhost:3000/risk-management/risk-123");

  // Verify Linked Objective
  await expect(page.locator("text=Strategic Objective")).toBeVisible();
  await expect(page.locator("text=Canteen Modernization")).toBeVisible();

  // Verify Audit Findings
  await expect(page.locator("text=Audit Findings")).toBeVisible();
  await expect(page.locator("text=FIND-01: Missing receipts")).toBeVisible();
  await expect(page.locator("text=MAJOR")).toBeVisible();
});
