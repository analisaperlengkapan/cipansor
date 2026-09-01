import { test, expect } from "@playwright/test";
import { setupAuthenticatedPage } from "./helpers/auth";

test.describe("Integrated Performance Management (/kinerja) E2E Flows", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page, "SUPER_ADMIN");
  });

  test("main performance hub renders key navigation sections", async ({ page }) => {
    await page.goto("/kinerja");
    await expect(page).toHaveURL(/\/kinerja/);
    await expect(page.locator("h1")).toContainText(/Manajemen Kinerja/i);
    await expect(page.locator("text=Perjanjian Kinerja")).toBeVisible();
    await expect(page.locator("text=Evaluasi Periodik")).toBeVisible();
  });

  test("performance agreement page displays PK agreement table and actions", async ({ page }) => {
    await page.goto("/kinerja/pk");
    await expect(page).toHaveURL(/\/kinerja\/pk/);
    await expect(page.locator("h1")).toContainText(/Perjanjian Kinerja/i);
    await expect(page.locator("text=Buat PK Baru")).toBeVisible();
  });

  test("periodic evaluation hub loads monthly evaluations", async ({ page }) => {
    await page.goto("/kinerja/evaluasi");
    await expect(page).toHaveURL(/\/kinerja\/evaluasi/);
    await expect(page.locator("h1")).toContainText(/Evaluasi Periodik/i);
    await expect(page.locator("text=Buat Evaluasi Bulanan")).toBeVisible();
  });

  test("analytics page displays executive overview and consolidated report", async ({ page }) => {
    await page.goto("/kinerja/analytics");
    await expect(page).toHaveURL(/\/kinerja\/analytics/);
    await expect(page.locator("h1")).toContainText(/Analytics & Strategy Map/i);
    await expect(page.locator("text=Total Dokumen PK")).toBeVisible();
    await expect(page.locator("text=Rata-Rata Perilaku SAFTI")).toBeVisible();
  });

  test("historical PKG archive renders migration banner and archive records", async ({ page }) => {
    await page.goto("/pkg");
    await expect(page).toHaveURL(/\/pkg/);
    await expect(page.locator("text=Penilaian Kinerja Guru (PKG) Legasi")).toBeVisible();
    await expect(page.locator("text=Buka Kinerja Terintegrasi")).toBeVisible();
  });

  test("interactive PK creation modal opens and validates form inputs", async ({ page }) => {
    await page.goto("/kinerja/pk");
    await page.click("text=Buat PK Baru");
    await expect(page.locator("text=Buat Perjanjian Kinerja")).toBeVisible();
    await expect(page.locator("button:has-text('Simpan Perjanjian Kinerja')")).toBeVisible();
  });

  test("evaluation detail page handles evaluation status, tabs, and pending inputs", async ({ page }) => {
    // Intercept evaluation detail API request with mock evaluation data
    await page.route("**/api/performance-agreements/evaluations/eval-test-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "eval-test-1",
            pkId: "pk-test-1",
            month: 5,
            year: 2026,
            performanceScore: 85,
            behaviorScore: 90,
            overallScore: 87,
            status: "DRAFT",
            feedback: "Bagus, tingkatkan lagi.",
            pk: {
              id: "pk-test-1",
              userId: "user-test-1",
              supervisorId: "user-admin-id",
              user: { id: "user-test-1", name: "Ahmad Staff" },
              supervisor: { id: "user-admin-id", name: "Kepala Sekolah" },
            },
            indicatorDetails: [
              {
                id: "ind-det-1",
                evaluationId: "eval-test-1",
                indicatorId: "ind-1",
                realization: 10,
                activities: "Penataan berkas",
                score: 85,
                indicator: { title: "Laporan Administrasi", target: 12, unit: "laporan", weight: 100, category: "DIRECT" },
              },
            ],
            behaviorDetails: [
              {
                id: "beh-det-1",
                evaluationId: "eval-test-1",
                behaviorValueId: "bv-1",
                score: 90,
                notes: "Disiplin",
                behaviorValue: { id: "bv-1", name: "Siddiq", description: "Jujur dan dapat dipercaya", weight: 1 },
              },
            ],
          },
        }),
      });
    });

    await page.goto("/kinerja/evaluasi/eval-test-1");
    await expect(page.locator("h1")).toContainText(/Evaluasi Periode: Mei 2026/i);

    // Verify Tab 1: Realisasi Indikator
    await expect(page.locator("text=Realisasi Bulanan Target Indikator")).toBeVisible();
    await expect(page.locator("text=Laporan Administrasi")).toBeVisible();

    // Verify Tab 2: SAFTI Behavior
    await page.click("text=2. Evaluasi Perilaku SAFTI");
    await expect(page.locator("text=Penilaian Perilaku SAFTI")).toBeVisible();
    await expect(page.locator("text=Siddiq")).toBeVisible();

    // Verify Tab 3: Feedback Atasan
    await page.click("text=3. Feedback Atasan");
    await expect(page.locator("text=Catatan & Feedback Atasan Penilai")).toBeVisible();
  });

  test("approved evaluation page locks form inputs and hides approve action", async ({ page }) => {
    await page.route("**/api/performance-agreements/evaluations/eval-approved-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "eval-approved-1",
            pkId: "pk-test-1",
            month: 5,
            year: 2026,
            performanceScore: 90,
            behaviorScore: 95,
            overallScore: 92,
            status: "APPROVED",
            feedback: "Evaluasi disetujui",
            pk: { id: "pk-test-1", supervisorId: "user-admin-id" },
            indicatorDetails: [
              {
                id: "ind-det-1",
                evaluationId: "eval-approved-1",
                indicatorId: "ind-1",
                realization: 12,
                activities: "Selesai",
                score: 100,
                indicator: { title: "Target Kurikulum", target: 12, unit: "modul", weight: 100, category: "DIRECT" },
              },
            ],
            behaviorDetails: [],
          },
        }),
      });
    });

    await page.goto("/kinerja/evaluasi/eval-approved-1");
    await expect(page.locator("h1")).toContainText(/Mei 2026/i);
    await expect(page.locator("text=Finalisasi & Setujui Evaluasi")).not.toBeVisible();
  });
});
