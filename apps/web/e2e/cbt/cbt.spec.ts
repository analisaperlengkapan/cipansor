import { test, expect } from "@playwright/test";

test.describe("CBT Exams & Grading", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a blank page first so localStorage can be set for the origin
    await page.goto("/");
    // Set localStorage correctly via addInitScript
    await page.addInitScript(() => {
      window.localStorage.setItem("accessToken", "mock-token-admin");
      window.localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user: {
              id: "admin-1",
              name: "Super Admin",
              role: "SUPER_ADMIN",
            },
            isAuthenticated: true,
          },
          version: 0,
        })
      );
    });
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
    await expect(page.locator("h1")).toContainText("Jadwal Ujian");
    await expect(page.getByText("Ujian Akhir Semester Ganjil")).toBeVisible();
    await expect(page.getByText("Pendidikan Agama Islam")).toBeVisible();
    await expect(page.getByText("Kelas 10A")).toBeVisible();
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

    // Mock reference data APIs used by the form
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
          data: [{ id: "ay-1", name: "2024/2025", semester: "Ganjil" }],
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
    await page.route("**/api/teachers*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [{ id: "teacher-1", user: { name: "Pak Guru" } }],
        }),
      });
    });

    // Mock exams API for both GET (list after redirect) and POST (create)
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
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      }
    });

    await page.goto("/cbt/exams/new");
    await expect(page.locator("h1")).toContainText("Buat Ujian Baru");

    await page.fill('input[name="title"]', "UTS Sejarah Kebudayaan Islam");

    // Select question bank
    await page.click("text=Pilih Bank Soal");
    await page.click("text=Bank Soal PAI Kelas 10 (10 Soal)");

    // Date picker simulation
    await page.fill('input[name="scheduledAt"]', "2024-12-10T08:00");

    await page.click("button[type='submit']");

    // Will navigate back
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

    await page.goto("/cbt/exams/exam-1/monitoring");
    await expect(page.getByText("Ahmad Santoso")).toBeVisible();
    await expect(page.getByText("80.00")).toBeVisible();

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
    await expect(page.locator("h1")).toContainText("Penilaian Manual");
    await expect(page.getByText("Jelaskan makna hijrah")).toBeVisible();
    await expect(page.getByText("Berpindah dari tempat buruk ke baik.")).toBeVisible();

    // Mock POST for Grading
    let gradingReceived = false;
    await page.route("**/api/cbt/attempts/attempt-1/grade", async (route) => {
      gradingReceived = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { score: "90.00" } }),
      });
    });

    // We change score from 10 to 18
    await page.fill('input[name="score"]', "18");
    await page.click("text=Tandai Benar");
    await page.click("button[type='submit']");

    await page.waitForTimeout(500); // let toast happen
    expect(gradingReceived).toBe(true);
  });
});
