import { test, expect } from "@playwright/test";
import { setupMockAuth } from "./helpers/auth";

test.describe("Student Lifecycle Integration", () => {
  const studentId = "student-123";

  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page, { roleCode: 'SUPER_ADMIN' });
  });

  test("should display lead scoring in marketing dashboard", async ({ page }) => {
    // Mock Priority Leads
    await page.route("**/api/marketing/leads/high-priority*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "lead-1",
              fullName: "Lead High Priority",
              leadScore: 85,
              source: "INSTAGRAM",
              quranAbility: "MUTAWASSIT",
              createdAt: new Date().toISOString(),
              status: "PROSPECT",
            },
          ],
        }),
      });
    });

    // Mock stats
    await page.route("**/api/marketing/stats*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { sources: [], topCampaigns: [] },
        }),
      });
    });

    await page.goto("/marketing");

    // Check for the new Lead Scoring widget
    await expect(page.getByText("Prioritas Tindak Lanjut")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Lead High Priority")).toBeVisible();
    await expect(page.getByText("Score: 85")).toBeVisible();
  });

  test("should display boarding harmony and holistic radar in Student 360", async ({ page }) => {
    // Mock Student Data
    await page.route(`**/api/students/${studentId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: studentId,
            nis: "12345",
            user: { name: "Ahmad Santri" },
            unit: { name: "SMP IT" },
            birthPlace: "Jakarta",
            birthDate: "2010-01-01",
            parentName: "Bpk. Ahmad",
            parentPhone: "08123456789",
          },
        }),
      });
    });

    // Mock Holistic Analytics
    await page.route(`**/api/assessment/students/${studentId}/holistic*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            holisticScore: 82.5,
            interpretation: "Jayyid Jiddan",
            recommendation: "Pertahankan prestasi Akademik.",
            breakdown: {
              academic: 85,
              tahfidz: 75,
              behavior: 90,
              attendance: 95,
              ibadah: 80,
            },
          },
        }),
      });
    });

    // Mock Boarding Harmony
    await page.route(`**/api/students/${studentId}/room-assignment`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            roomId: "room-1",
            room: {
              id: "room-1",
              name: "Kamar Abu Bakar",
              floor: 1,
              capacity: 4,
              currentOccupancy: 3,
              dormitory: { name: "Asrama Putra" },
            },
          },
        }),
      });
    });

    await page.route("**/api/dormitories/rooms/room-1/social-analytics", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            harmonyScore: 88,
            status: "SANGAT KONDUSIF",
            diversityIndex: 75,
            healthSignals: 0,
            roommates: [{ id: "r-1", name: "Budi", province: "Jawa Barat" }],
          },
        }),
      });
    });

    // Mock other 360 data
    await page.route("**/api/assessment/grades/student/*", async (route) => route.fulfill({ body: JSON.stringify({ data: [] }) }));
    await page.route("**/api/health/records/student/*", async (route) => route.fulfill({ body: JSON.stringify({ data: [] }) }));
    await page.route("**/api/violations/summary/student/*", async (route) => route.fulfill({ body: JSON.stringify({ data: { totalPoints: 0, recentViolations: [] } }) }));
    await page.route("**/api/finance/summary/student/*", async (route) => route.fulfill({ body: JSON.stringify({ data: { totalOutstanding: 0 } }) }));
    await page.route("**/api/tahfidz/students/*/summary", async (route) => route.fulfill({ body: JSON.stringify({ data: { summary: { juzCoveredCount: 5 } } }) }));
    await page.route("**/api/ibadah/stats*", async (route) => route.fulfill({ body: JSON.stringify({ data: { completionRate: 90 } }) }));

    await page.route("**/api/academic-years/active*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { id: "ay-active", name: "2024/2025" },
        }),
      });
    });

    await page.goto(`/students/${studentId}/360`);

    // Check Holistic Radar
    await expect(page.getByText("Analisis Perkembangan Holistik").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("82.5")).toBeVisible();

    // Check Boarding Tab
    const boardingTab = page.getByRole("tab", { name: /Asrama/i });
    await boardingTab.click();

    await expect(page.getByText("Dinamika Sosial Kamar")).toBeVisible();
    await expect(page.getByText("88%")).toBeVisible();
  });
});
