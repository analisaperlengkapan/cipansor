import { test, expect } from "@playwright/test";
import { setupMockAuth } from "../helpers/auth";

test.describe("CBT Exams & Grading", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page, { roleCode: 'SUPER_ADMIN' });
  });

  test("Should navigate to exams page and view list", async ({ page }) => {
    // Mock the exams list API
    await page.route(/\/api\/cbt\/exams(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "exam-1",
              title: "Ujian Akhir Semester Ganjil",
              subject: { name: "Pendidikan Agama Islam" },
              class: { name: "Kelas 10A" },
              scheduledAt: new Date().toISOString(),
              duration: 90,
              status: "ONGOING",
              _count: { attempts: 2 },
            },
          ],
        }),
      });
    });

    await page.goto("/cbt/exams");
    await expect(page.getByRole("heading", { name: /jadwal ujian/i })).toBeVisible();
    await expect(page.getByText("Ujian Akhir Semester Ganjil")).toBeVisible();
  });

  test("Should be able to create new exam", async ({ page }) => {
    // Mock banks
    await page.route("**/api/cbt/banks", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "bank-1",
              title: "Bank Soal PAI Kelas 10",
              _count: { questions: 10 },
            },
          ],
        }),
      });
    });

    // Mock reference data APIs
    await page.route("**/api/units*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [{ id: "unit-1", name: "Unit Satu" }],
        }),
      });
    });
    await page.route("**/api/academic-years*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [{ id: "ay-1", name: "2024/2025" }],
        }),
      });
    });
    await page.route("**/api/curriculum/subjects*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [{ id: "sub-1", name: "Sejarah Kebudayaan Islam" }],
        }),
      });
    });
    await page.route("**/api/classes*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [{ id: "cls-1", name: "Kelas 10A" }],
        }),
      });
    });
    await page.route("**/api/hr/teachers*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [{ id: "teacher-1", user: { name: "Pak Guru" } }],
        }),
      });
    });

    // Mock POST for creating exam
    await page.route(/\/api\/cbt\/exams(\?.*)?$/, async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: { id: "new-exam-1" },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: [] }),
        });
      }
    });

    await page.goto("/cbt/exams/new");
    await expect(page.getByRole("heading", { name: /buat ujian baru/i })).toBeVisible();

    await page.fill('input[name="title"]', "UTS Sejarah Kebudayaan Islam");

    // The form's selects are Radix triggers that render their placeholder via
    // data-placeholder, so has-text matching is unreliable. Address them by
    // index (0=Tipe Ujian, 1=Unit, 2=Tahun Ajaran, 3=Mapel, 4=Kelas, 5=Guru,
    // 6=Bank Soal, 7=Status) and pick the option by its text.
    const pickSelect = async (index: number, optionName: string) => {
      await page.locator('button[role="combobox"]').nth(index).click();
      const listbox = page.getByRole("listbox");
      await expect(listbox).toBeVisible();
      await listbox.getByRole("option", { name: optionName }).first().click();
      await expect(listbox).toBeHidden();
    };

    await pickSelect(1, "Unit Satu");
    await pickSelect(2, "2024/2025");
    await pickSelect(3, "Sejarah Kebudayaan Islam");
    await pickSelect(4, "Kelas 10A");
    await pickSelect(5, "Pak Guru");
    await pickSelect(6, "Bank Soal PAI Kelas 10");

    await page.fill('input[name="scheduledAt"]', "2024-12-10T08:00");
    await page.click("button[type='submit']");

    await page.waitForURL("**/cbt/exams");
  });

  test("Should monitor exam and grade an attempt", async ({ page }) => {
    // Mock Exam Monitoring
    await page.route("**/api/cbt/exams/exam-1/monitoring", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "exam-1",
            title: "Ujian Akhir Semester Ganjil",
            status: "ONGOING",
            attempts: [
              {
                id: "attempt-1",
                status: "COMPLETED",
                score: "80.00",
                student: { user: { name: "Ahmad Santoso" } },
              },
            ],
          },
        }),
      });
    });

    // Mock Insights — shape matches the actual API: { averageSuccessRate, questionInsights }
    await page.route("**/api/cbt/exams/exam-1/difficulty-insights", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { averageSuccessRate: 75, questionInsights: [{ questionId: "q-1", content: "Soal ujian contoh", successRate: 75, totalGraded: 20, isKiller: false }] } }) });
    });
    await page.route("**/api/cbt/exams/exam-1/topic-mastery", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { items: [] } }) });
    });

    await page.goto("/cbt/exams/exam-1/monitoring");
    await expect(page.getByRole("heading", { name: /monitoring ujian/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Ahmad Santoso")).toBeVisible();

    // Mock Attempt Grading
    await page.route("**/api/cbt/attempts/attempt-1/grading", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "attempt-1",
            score: "80.00",
            examId: "exam-1",
            student: { user: { name: "Ahmad Santoso" } },
            exam: {
              questionBank: {
                questions: [
                  {
                    id: "q-1",
                    type: "ESSAY",
                    content: "<p>Jelaskan makna hijrah.</p>",
                    points: 20,
                  },
                ],
              },
            },
            answers: [
              {
                id: "ans-1",
                questionId: "q-1",
                answer: "Berpindah dari tempat buruk ke baik.",
                score: "10.00",
                isCorrect: false,
              },
            ],
          },
        }),
      });
    });

    await page.goto("/cbt/attempts/attempt-1/grading");
    await expect(page.getByRole("heading", { name: /penilaian manual/i })).toBeVisible();
  });
});
