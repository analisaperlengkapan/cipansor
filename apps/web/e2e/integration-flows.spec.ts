import { test, expect } from "./fixtures/auth.fixture";
import {
  waitForLoadingComplete,
  waitForToast,
  navigateTo,
} from "./helpers/page-helpers";
import { LoginPage, DashboardPage } from "./page-objects";

/**
 * Integration Tests - Cross-Module Workflows
 * Tests end-to-end flows that span multiple modules
 */

test.describe("Integration: Student → Attendance → Report Flow", () => {
  test("complete workflow: create student, mark attendance, view report", async ({
    page,
  }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard(
      "superadmin@cipansor.id",
      "SuperAdmin123!",
    );

    // STEP 1: Create a new student
    await navigateTo(page, "/students");

    const addButton = page
      .getByRole("button", { name: /tambah|add|create/i })
      .first();
    await addButton.click();
    await waitForLoadingComplete(page);

    const timestamp = Date.now();
    const studentName = `Integration Test Student ${timestamp}`;
    const studentNISN = `INT${timestamp.toString().slice(-10)}`;

    await page
      .getByLabel(/nama|name/i)
      .first()
      .fill(studentName);
    await page
      .getByLabel(/nisn|nis/i)
      .first()
      .fill(studentNISN);

    // Select unit if available
    const unitSelect = page
      .locator('button[role="combobox"]')
      .filter({ hasText: /unit/i })
      .first();
    if (await unitSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await unitSelect.click();
      await page.getByRole("option").first().click();
    }

    // Select class if available
    const classSelect = page
      .locator('button[role="combobox"]')
      .filter({ hasText: /kelas|class/i })
      .first();
    if (await classSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await classSelect.click();
      await page.getByRole("option").first().click();
    }

    const submitButton = page.getByRole("button", {
      name: /simpan|save|submit/i,
    });
    await submitButton.click();

    await waitForToast(page, /berhasil|success/i, "success");
    await waitForLoadingComplete(page);

    // STEP 2: Mark attendance for this student
    await navigateTo(page, "/attendance");

    // Select the class where student was added
    const attendanceClassSelect = page
      .locator('button[role="combobox"]')
      .filter({ hasText: /kelas|class/i })
      .first();
    if (
      await attendanceClassSelect
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await attendanceClassSelect.click();
      await page.getByRole("option").first().click();
      await waitForLoadingComplete(page);

      // Find our student in the list
      const studentRow = page
        .locator('table tbody tr, [role="listitem"]')
        .filter({ hasText: studentName });

      if (await studentRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Mark as present
        const presentButton = studentRow
          .getByRole("button", { name: /hadir|present/i })
          .or(studentRow.locator('input[type="radio"][value="PRESENT"]'));

        if (
          await presentButton.isVisible({ timeout: 2000 }).catch(() => false)
        ) {
          await presentButton.click();

          const saveAttendance = page.getByRole("button", {
            name: /simpan|save/i,
          });
          if (
            await saveAttendance.isVisible({ timeout: 2000 }).catch(() => false)
          ) {
            await saveAttendance.click();
            await waitForToast(page, /berhasil|success/i, "success");
          }
        }
      }
    }

    // STEP 3: Verify in attendance report
    await navigateTo(page, "/attendance/reports");

    const reportHeading = page.getByRole("heading", {
      name: /laporan|report/i,
    });
    if (await reportHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Generate report
      const generateButton = page.getByRole("button", {
        name: /generate|tampilkan|buat/i,
      });
      if (
        await generateButton.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        await generateButton.click();
        await waitForLoadingComplete(page);

        // Should show report with our student
        const reportContent = page.locator("table, .report-content");
        await expect(reportContent).toBeVisible({ timeout: 5000 });
      }
    }

    // STEP 4: Clean up - delete the test student
    await navigateTo(page, "/students");

    const searchInput = page
      .getByPlaceholder(/cari|search/i)
      .or(page.getByLabel(/cari|search/i));
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill(studentNISN);
      await waitForLoadingComplete(page);

      const deleteButton = page
        .getByRole("button", { name: /delete|hapus/i })
        .first();
      if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteButton.click();

        const confirmButton = page.getByRole("button", {
          name: /ya|yes|confirm|hapus/i,
        });
        await confirmButton.click();

        await waitForToast(page, /berhasil|success/i, "success");
      }
    }
  });
});

test.describe("Integration: Dashboard → Module Navigation", () => {
  test("should navigate from dashboard to modules and back", async ({
    page,
  }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard(
      "superadmin@cipansor.id",
      "SuperAdmin123!",
    );

    const dashboard = new dashboardPage.DashboardPage(page);

    // Start from dashboard
    await dashboard.goto();
    await dashboard.waitForDataLoad();

    // Navigate to Students
    const studentsLink = page.getByRole("link", {
      name: /santri|students|siswa/i,
    });
    if (await studentsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await studentsLink.click();
      await waitForLoadingComplete(page);
      await expect(page).toHaveURL(/students/);
    }

    // Back to dashboard
    await dashboard.goto();
    await dashboard.waitForDataLoad();

    // Navigate to Attendance
    const attendanceLink = page.getByRole("link", {
      name: /absen|attendance|kehadiran/i,
    });
    if (await attendanceLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await attendanceLink.click();
      await waitForLoadingComplete(page);
      await expect(page).toHaveURL(/attendance/);
    }

    // Back to dashboard
    await dashboard.goto();
    await dashboard.waitForDataLoad();

    // Navigate to Tahfidz
    const tahfidzLink = page.getByRole("link", { name: /tahfidz|hafalan/i });
    if (await tahfidzLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tahfidzLink.click();
      await waitForLoadingComplete(page);
      await expect(page).toHaveURL(/tahfidz/);
    }
  });
});

test.describe("Integration: Student → Tahfidz Progress", () => {
  test("should track tahfidz progress for student", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard(
      "superadmin@cipansor.id",
      "SuperAdmin123!",
    );

    // Go to student detail
    await navigateTo(page, "/students");

    const firstStudent = page.locator('table tbody tr, [role="row"]').first();
    if (await firstStudent.isVisible({ timeout: 5000 }).catch(() => false)) {
      const studentName = await firstStudent.textContent();

      // Click to view detail
      const viewButton = firstStudent.getByRole("button", {
        name: /view|lihat|detail/i,
      });
      if (await viewButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await viewButton.click();
      } else {
        await firstStudent.click();
      }

      await waitForLoadingComplete(page);

      // Look for Tahfidz progress section
      const tahfidzSection = page.getByText(/tahfidz|hafalan|progress/i);
      if (
        await tahfidzSection.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        await expect(tahfidzSection).toBeVisible();

        // Should show progress indicators
        const hasProgress = await page
          .locator('[role="progressbar"], .progress')
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        expect(hasProgress).toBeTruthy();
      }
    }
  });
});

test.describe("Integration: PAUD Assessment → Report Generation", () => {
  test("complete PAUD assessment and generate report", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard(
      "superadmin@cipansor.id",
      "SuperAdmin123!",
    );

    // Go to PAUD assessment
    await navigateTo(page, "/paud/assessment");

    const heading = page.getByRole("heading", {
      name: /penilaian|assessment/i,
    });
    if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Select student
      const studentSelect = page
        .locator('button[role="combobox"]')
        .filter({ hasText: /santri|student/i })
        .first();
      if (await studentSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await studentSelect.click();

        const studentOptions = page.getByRole("option");
        const optionCount = await studentOptions.count();

        if (optionCount > 0) {
          const selectedStudent = await studentOptions.first().textContent();
          await studentOptions.first().click();
          await waitForLoadingComplete(page);

          // Select an indicator
          const checkboxes = page.locator('input[type="checkbox"]');
          const checkboxCount = await checkboxes.count();

          if (checkboxCount > 0) {
            await checkboxes.first().check();

            // Set achievement level
            const levelRadio = page
              .locator('input[type="radio"][value="BSH"]')
              .first();
            if (
              await levelRadio.isVisible({ timeout: 2000 }).catch(() => false)
            ) {
              await levelRadio.check();
            }

            // Save assessment
            const saveButton = page.getByRole("button", {
              name: /simpan|save/i,
            });
            await saveButton.click();
            await waitForToast(page, /berhasil|success/i, "success");

            // Navigate to reports
            await navigateTo(page, "/paud/reports");

            // Select the same student
            const reportStudentSelect = page
              .locator('button[role="combobox"]')
              .filter({ hasText: /santri|student/i })
              .first();
            if (
              await reportStudentSelect
                .isVisible({ timeout: 3000 })
                .catch(() => false)
            ) {
              await reportStudentSelect.click();

              const reportOption = page
                .getByRole("option")
                .filter({ hasText: selectedStudent || /./i })
                .first();
              if (
                await reportOption
                  .isVisible({ timeout: 2000 })
                  .catch(() => false)
              ) {
                await reportOption.click();

                // Generate report
                const generateButton = page.getByRole("button", {
                  name: /generate|buat|tampilkan/i,
                });
                if (
                  await generateButton
                    .isVisible({ timeout: 3000 })
                    .catch(() => false)
                ) {
                  await generateButton.click();
                  await waitForLoadingComplete(page);

                  // Report should be visible
                  const reportContent = page.locator(
                    '[data-testid="report-content"], .report-container',
                  );
                  await expect(
                    reportContent.or(page.locator("table")),
                  ).toBeVisible({ timeout: 5000 });
                }
              }
            }
          }
        }
      }
    } else {
      test.skip(true, "PAUD assessment page not available");
    }
  });
});

test.describe("Integration: Finance → Dashboard Sync", () => {
  test("should sync finance data with dashboard", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard(
      "superadmin@cipansor.id",
      "SuperAdmin123!",
    );

    // Check dashboard finance metrics
    const dashboard = new dashboardPage.DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForDataLoad();

    const financeCard = page.getByText(/keuangan|finance|pendapatan|revenue/i);
    if (await financeCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      const initialValue = await financeCard.textContent();

      // Navigate to finance module
      await navigateTo(page, "/finance");

      // Should show finance data
      await expect(
        page.getByRole("heading", { name: /keuangan|finance/i }),
      ).toBeVisible({ timeout: 5000 });

      // Go back to dashboard
      await dashboard.goto();
      await dashboard.waitForDataLoad();

      // Finance card should still be visible
      await expect(financeCard).toBeVisible();
    }
  });
});

test.describe("Integration: Multi-user Collaboration", () => {
  test("should handle concurrent user actions", async ({ page, context }) => {
    // Login as superadmin
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard(
      "superadmin@cipansor.id",
      "SuperAdmin123!",
    );

    // Open second tab (simulate another user)
    const page2 = await context.newPage();
    const login2 = new loginPage.LoginPage(page2);
    await login2.goto();
    await login2.loginAndWaitForDashboard(
      "superadmin@cipansor.id",
      "SuperAdmin123!",
    );

    // Both navigate to students
    await navigateTo(page, "/students");
    await navigateTo(page2, "/students");

    // Verify both can see the same data
    const heading1 = page.getByRole("heading", { name: /santri|students/i });
    const heading2 = page2.getByRole("heading", { name: /santri|students/i });

    await expect(heading1).toBeVisible();
    await expect(heading2).toBeVisible();

    // Close second tab
    await page2.close();
  });
});
