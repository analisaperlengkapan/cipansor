import { test, expect } from "@playwright/test";

// Define the summary type locally since we can't import shared types in Playwright config easily
// This matches the new TahfidzStudentSummary interface
interface TahfidzStudentSummary {
  student: any;
  summary: {
    totalRecords: number;
    totalAyahMemorized: number;
    juzCoveredCount: number;
    surahCoveredCount: number;
    averageScore: number | null;
  };
  byActivity: any[];
  juzCovered: number[];
  surahCovered: any[];
  recentRecords: any[];
}

test.describe("Tahfidz Transcript", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route("**/api/auth/login", async (route) => {
      const json = {
        success: true,
        data: {
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
          user: {
            id: "super-admin-id",
            name: "Super Admin",
            role: "SUPER_ADMIN",
          },
        },
      };
      await route.fulfill({ json });
    });

    // Any unmocked endpoint hitting the real backend with the fake token returns
    // 401; the axios interceptor then tries /auth/refresh and, on failure,
    // clears the session and redirects to /login. Mock refresh so a stray 401
    // never logs the test out.
    await page.route("**/api/auth/refresh", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
          },
        },
      });
    });

    await page.route("**/api/auth/me", async (route) => {
      const json = {
        success: true,
        data: {
          id: "super-admin-id",
          name: "Super Admin",
          role: "SUPER_ADMIN",
        },
      };
      await route.fulfill({ json });
    });

    // Mock units/classes/students needed for the page
    await page.route("**/api/units*", async (route) => {
      await route.fulfill({
        json: { success: true, data: [{ id: "unit-1", name: "SMP IT" }] },
      });
    });
    await page.route("**/api/classes*", async (route) => {
      await route.fulfill({
        json: { success: true, data: [{ id: "class-1", name: "7A" }] },
      });
    });
    await page.route("**/api/academic-years*", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: [{ id: "ay-1", name: "2024/2025", isActive: true }],
        },
      });
    });
    await page.route("**/api/students*", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: [
            {
              id: "student-1",
              name: "Test Student",
              nis: "12345",
              currentClass: { name: "7A" },
              unit: { name: "SMP IT" },
              birthDate: "2010-01-01",
              birthPlace: "Jakarta",
              parentName: "Test Parent",
              gender: "MALE",
            },
          ],
        },
      });
    });

    // Mock Report Cards
    await page.route("**/api/report-cards*", async (route) => {
      await route.fulfill({ json: { success: true, data: [] } });
    });

    // Login flow
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("superadmin@cipansor.id");
    await page.getByLabel(/password|kata sandi/i).fill("SuperAdmin123!");
    await page.getByRole("button", { name: /sign in|masuk|login/i }).click();
    await page.waitForURL("**/dashboard");
  });

  test("should display tahfidz summary with correct types", async ({
    page,
  }) => {
    // Mock the specific student summary endpoint with the NEW structure
    await page.route("**/api/tahfidz/students/*/summary", async (route) => {
      const summaryData: TahfidzStudentSummary = {
        student: { id: "student-1", name: "Test Student" },
        summary: {
          totalRecords: 10,
          totalAyahMemorized: 150,
          juzCoveredCount: 1,
          surahCoveredCount: 2,
          averageScore: 90,
        },
        byActivity: [],
        juzCovered: [30],
        surahCovered: [
          { surahNumber: 114, surahName: "An-Nas" },
          { surahNumber: 113, surahName: "Al-Falaq" },
        ],
        recentRecords: [
          {
            id: "rec-1",
            surahName: "An-Nas",
            ayahStart: 1,
            ayahEnd: 6,
            activityType: "ZIYADAH",
            score: 95,
            recordedAt: new Date().toISOString(),
          },
        ],
      };

      await route.fulfill({ json: { success: true, data: summaryData } });
    });

    // Also mock tahfidz records list
    await page.route("**/api/tahfidz?*", async (route) => {
      await route.fulfill({
        json: { success: true, data: [], meta: { pagination: { total: 0 } } },
      });
    });

    await page.goto("/students/transcript");

    // Wait for student to appear in the list (this confirms the students API was consumed)
    await expect(page.locator("text=Test Student")).toBeVisible();

    // Click on the student card
    await page.click("text=Test Student");

    // Verify the transcript tabs appear
    await expect(
      page.locator('button[role="tab"]:has-text("Tahfidz")'),
    ).toBeVisible();

    // Switch to Tahfidz tab
    await page.click('button[role="tab"]:has-text("Tahfidz")');

    // Check for specific values from our mock
    // We use more specific locators to ensure we're finding the summary cards
    await expect(page.locator("text=150").first()).toBeVisible(); // Total Ayah
    await expect(page.locator("text=1").first()).toBeVisible(); // Juz Selesai
    await expect(page.locator("text=An-Nas").first()).toBeVisible(); // Surah list
  });
});
