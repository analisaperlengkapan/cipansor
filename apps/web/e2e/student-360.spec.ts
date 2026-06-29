import { test, expect } from "@playwright/test";

test.describe("Student 360 Integrated View", () => {
  const studentId = "student-1";

  test.beforeEach(async ({ page }) => {
    // Mock Authentication
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

    // Mock Student Profile
    await page.route(`**/api/students/${studentId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: studentId,
            name: "Zaidan Ahmad",
            nis: "2024001",
            unit: { name: "SMA Quran" },
            currentClass: { name: "10-A", academicYear: { id: "ay-2024" } },
            birthPlace: "Bandung",
            birthDate: "2008-05-15",
            parentName: "Abdullah",
            parentPhone: "08123456789"
          },
        }),
      });
    });

    // Mock Counseling History
    await page.route(`**/api/counseling/students/${studentId}/history`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: "c-1",
                title: "Bimbingan Tahfidz",
                category: "SPIRITUAL",
                status: "COMPLETED",
                description: "Siswa membutuhkan motivasi lebih dalam menghafal.",
                scheduledAt: new Date().toISOString(),
                counselor: { user: { name: "Ust. Khalid" } }
              }
            ],
          }),
        });
    });

    // Mock Health Summary
    await page.route(`**/api/health/students/${studentId}/summary`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              growthHistory: [
                { recordDate: "2024-01-01", height: 165, weight: 55 },
                { recordDate: "2024-02-01", height: 166, weight: 56 }
              ],
              latestGrowth: { height: 166, weight: 56 },
              visitTrend: [{ month: "2024-01", count: 2 }]
            },
          }),
        });
    });

    // Mock other 360 data (empty/default)
    await page.route("**/api/assessment/**", async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [] }) });
    });
    await page.route("**/api/tahfidz/**", async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: {} }) });
    });
    await page.route("**/api/finance/**", async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: {} }) });
    });

    // Go to Student 360 page
    await page.goto(`/students/${studentId}/360`);
  });

  test("should display student basic info correctly", async ({ page }) => {
    await expect(page.getByText("Zaidan Ahmad")).toBeVisible();
    await expect(page.getByText("2024001")).toBeVisible();
    await expect(page.getByText("SMA Quran")).toBeVisible();
  });

  test("should load and display counseling history in tab", async ({ page }) => {
    await page.getByRole("tab", { name: "Konseling" }).click();
    await expect(page.getByText("Bimbingan Tahfidz")).toBeVisible();
    await expect(page.getByText("Ust. Khalid")).toBeVisible();
  });

  test("should load and display health summary in tab", async ({ page }) => {
    await page.getByRole("tab", { name: "Kesehatan" }).click();
    await expect(page.getByText("Tren Pertumbuhan")).toBeVisible();
    await expect(page.getByText("166 cm")).toBeVisible();
    await expect(page.getByText("56 kg")).toBeVisible();
  });
});
