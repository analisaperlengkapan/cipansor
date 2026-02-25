import { test, expect } from "@playwright/test";

test.describe("Counseling Module", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Authentication
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: "mock-token",
            refreshToken: "mock-refresh-token",
            user: {
              id: "admin-id",
              name: "Admin",
              email: "admin@cipansor.id",
              role: "SUPER_ADMIN",
            },
          },
        }),
      });
    });

    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "admin-id",
            name: "Admin",
            email: "admin@cipansor.id",
            role: "SUPER_ADMIN",
          },
        }),
      });
    });

    // Mock Units
    await page.route("**/api/units", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [{ id: "unit-1", name: "SMA Quran" }],
        }),
      });
    });

    // Mock Counseling Stats - Specific route first
    await page.route("**/api/counseling/statistics*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              totalSessions: 10,
              byStatus: [{ status: "SCHEDULED", count: 5 }],
              byCategory: [{ category: "ACADEMIC", count: 3 }],
              byPriority: [{ priority: "MEDIUM", count: 2 }],
            },
          }),
        });
      });

    // Mock Counseling List - General route second
    // Use regex or simpler glob
    await page.route("**/api/counseling*", async (route) => {
      // Avoid intercepting /statistics again if glob overlaps (though order matters)
      if (route.request().url().includes("/statistics")) return route.fallback();

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "session-1",
              title: "Mock Session 1",
              student: {
                id: "student-1",
                nis: "12345",
                user: { name: "Student A" },
                currentClass: { id: "class-1", name: "10 IPA" }
              },
              category: "ACADEMIC",
              status: "SCHEDULED",
              priority: "MEDIUM",
              scheduledAt: new Date().toISOString(),
              _count: { notes: 2 },
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        }),
      });
    });

    // Login flow manually
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("admin@cipansor.id");
    await page.getByLabel(/password|kata sandi/i).fill("admin123");
    await page.getByRole("button", { name: /sign in|masuk|login/i }).click();

    // Wait for navigation or successful login indication
    await page.waitForURL("**/dashboard");

    // Navigate to counseling
    await page.goto("/counseling");
  });

  test("should load counseling dashboard correctly", async ({ page }) => {
    // Verify page title
    await expect(page.getByRole("heading", { name: "Bimbingan Konseling" })).toBeVisible();

    // Verify stats cards are present (mocked data)
    await expect(page.getByText("Total Sesi")).toBeVisible();
    // Use first() or specific locator to avoid strict mode violation if "10" appears elsewhere (e.g. Class 10)
    await expect(page.locator("p.text-2xl", { hasText: "10" }).first()).toBeVisible();

    // Verify list content
    await expect(page.getByText("Student A")).toBeVisible();
    await expect(page.getByText("Mock Session 1")).toBeVisible();
  });

  test("should navigate to create session page", async ({ page }) => {
    // Click create button
    await page.getByRole("link", { name: "Buat Sesi" }).click();

    // Verify navigation
    await expect(page).toHaveURL(/\/counseling\/new/);
  });
});
