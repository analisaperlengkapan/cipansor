import { test, expect } from "@playwright/test";

test.describe("Assessment Analytics", () => {
  const mockAssessmentId = "mock-assessment-id";

  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    // Mock local storage for auth store
    await page.addInitScript(() => {
      window.localStorage.setItem("accessToken", "fake-token");
      window.localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user: {
              id: "user-1",
              email: "teacher@example.com",
              name: "Teacher User",
              role: "TEACHER",
              teacher: { id: "teacher-1" },
              permissions: [],
            },
            isAuthenticated: true,
          },
          version: 0,
        }),
      );
    });

    // Navigate and intercept APIs
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            id: "user-1",
            email: "teacher@example.com",
            name: "Teacher User",
            role: "TEACHER",
            teacher: { id: "teacher-1" },
            permissions: [],
          },
        },
      });
    });

    await page.route(`**/api/assessment/exams/${mockAssessmentId}`, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            id: mockAssessmentId,
            title: "Midterm Math",
            type: "MIDTERM",
            passingScore: 70,
            status: "GRADED",
            scheduledAt: "2023-10-10T10:00:00.000Z",
            maxScore: 100,
            duration: 60,
          },
        },
      });
    });

    await page.route(`**/api/assessment/grades?examId=${mockAssessmentId}`, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: [], // Grades tab not our focus, empty is fine
        },
      });
    });

    await page.route(`**/api/assessment/exams/${mockAssessmentId}/analytics`, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            examId: mockAssessmentId,
            totalStudents: 30,
            gradedCount: 25,
            averageScore: 82.5,
            highestScore: 98,
            lowestScore: 65,
            passCount: 20,
            failCount: 5,
            passRate: 80,
            scoreDistribution: [
              { range: "0-59%", count: 0 },
              { range: "60-69%", count: 5 },
              { range: "70-79%", count: 8 },
              { range: "80-89%", count: 10 },
              { range: "90-100%", count: 2 },
            ],
            topStudents: [
              { studentId: "s1", studentName: "Ahmad", score: 98 },
              { studentId: "s2", studentName: "Budi", score: 95 },
            ],
          },
        },
      });
    });
  });

  test("should render analytics statistics and chart", async ({ page }) => {
    // Go to assessment detail page
    await page.goto(`/assessment/${mockAssessmentId}`);

    // Wait for header to ensure page loaded
    await expect(page.getByRole("heading", { name: "Midterm Math" })).toBeVisible();

    // Click Statistics Tab
    await page.getByRole("tab", { name: /Statistik/i }).click();

    // Verify Summary Cards
    await expect(page.getByText("Nilai Tertinggi", { exact: true })).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: '98' })).toBeVisible();

    await expect(page.getByText("Nilai Terendah", { exact: true })).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: '65' })).toBeVisible();

    await expect(page.getByText("Rata-rata", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: '82.5' })).toBeVisible();

    await expect(page.getByText("Persentase Lulus", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: '80%' })).toBeVisible();

    // Verify Chart visibility
    await expect(page.locator(".recharts-responsive-container")).toBeVisible();

    // Verify Top Students
    await expect(page.getByText("Santri Nilai Tertinggi", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Ahmad")).toBeVisible();
    await expect(page.getByText("Budi")).toBeVisible();
  });
});
