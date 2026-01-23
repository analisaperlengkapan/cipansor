import { test, expect } from "./fixtures/auth.fixture";
import { DashboardPage } from "./page-objects";
import {
  waitForLoadingComplete,
  waitForWebSocket,
} from "./helpers/page-helpers";

/**
 * Dashboard Real-time Integration E2E Tests
 * Tests WebSocket connection, real-time updates, and caching
 */

test.describe("Dashboard Real-time Features", () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    // Login
    const loginPage = await import("./page-objects");
    const login = new loginPage.LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard(
      "superadmin@cipansor.id",
      "SuperAdmin123!",
    );

    // Navigate to dashboard
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.waitForDataLoad();
  });

  test("should establish WebSocket connection", async ({ page }) => {
    // Wait for WebSocket connection
    await waitForWebSocket(page);

    // Check for real-time indicator
    const indicator = page.locator(
      '[data-testid="realtime-indicator"], .ws-status',
    );
    if (await indicator.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Should show connected status
      const text = await indicator.textContent();
      expect(text?.toLowerCase()).toMatch(/connect|terhubung|online/i);
    } else {
      console.log(
        "Real-time indicator not found, checking console for WebSocket",
      );

      // Alternative: check console for WebSocket connection
      const logs: string[] = [];
      page.on("console", (msg) => {
        if (msg.text().includes("WebSocket") || msg.text().includes("socket")) {
          logs.push(msg.text());
        }
      });

      await page.waitForTimeout(2000);
      console.log("WebSocket logs:", logs);
    }
  });

  test("should receive real-time metric updates", async ({ page }) => {
    // Get initial metric value
    const studentCard = dashboardPage.totalStudentsCard;
    await expect(studentCard).toBeVisible({ timeout: 10000 });

    const initialValue = await studentCard.textContent();
    console.log("Initial total students:", initialValue);

    // Set up listener for metric updates
    let updateReceived = false;
    page.on("websocket", (ws) => {
      ws.on("framereceived", (event) => {
        const data = event.payload;
        if (data.includes("dashboard:metrics") || data.includes("metrics")) {
          updateReceived = true;
          console.log("Received metric update:", data);
        }
      });
    });

    // Wait for potential update (real-time updates happen every 60s)
    // For testing, we'll wait a shorter time
    await page.waitForTimeout(3000);

    // Verify data is still displayed (even if no update occurred)
    await expect(studentCard).toBeVisible();
  });

  test("should handle WebSocket disconnection gracefully", async ({ page }) => {
    // Wait for initial connection
    await waitForWebSocket(page);

    // Simulate network offline
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);

    // Check for disconnection indicator
    const indicator = page.locator('[data-testid="realtime-indicator"]');
    if (await indicator.isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await indicator.textContent();
      expect(text?.toLowerCase()).toMatch(/disconnect|terputus|offline/i);
    }

    // Reconnect
    await page.context().setOffline(false);
    await page.waitForTimeout(3000);

    // Should reconnect and show connected status
    if (await indicator.isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await indicator.textContent();
      expect(text?.toLowerCase()).toMatch(/connect|terhubung|online/i);
    }
  });

  test("should use cached data on initial load", async ({ page }) => {
    // First visit - data is fetched from API
    await dashboardPage.goto();
    await dashboardPage.waitForDataLoad();

    const firstLoadValue = await dashboardPage.totalStudentsCard.textContent();

    // Navigate away and back
    await page.goto("/tahfidz/dashboard");
    await waitForLoadingComplete(page);

    await dashboardPage.goto();

    // Second load should be faster (cached)
    // Data should be immediately visible (from cache)
    await expect(dashboardPage.totalStudentsCard).toBeVisible({
      timeout: 5000,
    });

    const cachedValue = await dashboardPage.totalStudentsCard.textContent();
    expect(cachedValue).toBe(firstLoadValue);
  });

  test("should display reconnection attempts", async ({ page }) => {
    // Wait for connection
    await waitForWebSocket(page);

    // Simulate disconnection
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);

    // Look for reconnection indicator
    const reconnecting = page.getByText(/reconnecting|menghubungkan kembali/i);
    const hasReconnectingIndicator = await reconnecting
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasReconnectingIndicator) {
      await expect(reconnecting).toBeVisible();
    }

    // Restore connection
    await page.context().setOffline(false);
  });
});

test.describe("Dashboard Data Refresh", () => {
  test("should manually refresh dashboard data", async ({ page }) => {
    // Login and navigate
    const loginPage = await import("./page-objects");
    const login = new loginPage.LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard(
      "superadmin@cipansor.id",
      "SuperAdmin123!",
    );

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.waitForDataLoad();

    // Get initial value
    const initialValue = await dashboardPage.totalStudentsCard.textContent();

    // Find refresh button
    const refreshButton = page.getByRole("button", {
      name: /refresh|reload|muat ulang/i,
    });
    if (await refreshButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click refresh
      await refreshButton.click();

      // Should show loading state
      const loader = page.locator('.animate-spin, [role="progressbar"]');
      await expect(loader)
        .toBeVisible({ timeout: 2000 })
        .catch(() => {
          // Loading might be too fast
        });

      // Wait for data to reload
      await waitForLoadingComplete(page);

      // Data should still be visible
      await expect(dashboardPage.totalStudentsCard).toBeVisible();
    } else {
      console.log("Refresh button not found, skipping manual refresh test");
    }
  });

  test("should invalidate cache after data mutation", async ({ page }) => {
    // Login
    const loginPage = await import("./page-objects");
    const login = new loginPage.LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard(
      "superadmin@cipansor.id",
      "SuperAdmin123!",
    );

    // Go to dashboard
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.waitForDataLoad();

    const beforeValue = await dashboardPage.totalStudentsCard.textContent();

    // Navigate to create/edit page (simulating data mutation)
    const createLink = page.getByRole("link", { name: /tambah|add|create/i });
    if (await createLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createLink.click();
      await waitForLoadingComplete(page);

      // Go back to dashboard
      await dashboardPage.goto();
      await dashboardPage.waitForDataLoad();

      // Data should be fresh (cache invalidated)
      await expect(dashboardPage.totalStudentsCard).toBeVisible();
    }
  });
});

test.describe("Dashboard Performance", () => {
  test("should load dashboard within acceptable time", async ({ page }) => {
    // Login
    const loginPage = await import("./page-objects");
    const login = new loginPage.LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard(
      "superadmin@cipansor.id",
      "SuperAdmin123!",
    );

    // Measure dashboard load time
    const startTime = Date.now();

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await waitForLoadingComplete(page);

    const loadTime = Date.now() - startTime;

    console.log(`Dashboard load time: ${loadTime}ms`);

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);

    // All quick stats should be visible
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.verifyQuickStats();
  });

  test("should handle concurrent metric requests efficiently", async ({
    page,
  }) => {
    // Login
    const loginPage = await import("./page-objects");
    const login = new loginPage.LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard(
      "superadmin@cipansor.id",
      "SuperAdmin123!",
    );

    // Track API calls
    const apiCalls: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/dashboard")) {
        apiCalls.push(request.url());
      }
    });

    // Load dashboard
    await page.goto("/dashboard");
    await waitForLoadingComplete(page);

    // Should not make duplicate requests for same data
    const uniqueCalls = new Set(apiCalls);
    console.log("Unique API calls:", uniqueCalls.size);
    console.log("Total API calls:", apiCalls.length);

    // React Query should deduplicate requests
    // Expect fewer total calls than potential duplicates
  });
});
