import { test, expect } from "./fixtures/auth.fixture";

test.describe("Integration - Perencanaan to Finance linkage", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a valid origin first to allow localStorage setting
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.setItem("accessToken", "mock-admin-token");
      window.localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user: {
              id: "admin-1",
              name: "Super Admin",
              email: "superadmin@cipansor.id",
              role: "SUPER_ADMIN",
              unitId: "unit-1",
            },
            isAuthenticated: true,
          },
        })
      );
    });
  });

  test("should allow linking a planning activity to a finance budget", async ({ page }) => {
    // 1. Mock API Responses
    await page.route("**/api/perencanaan/plan-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "plan-1",
            title: "Rencana Strategis Integrasi",
            type: "RENSTRA",
            status: "DRAFT",
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            progress: 0,
            objectives: [
              {
                id: "obj-1",
                title: "Sasaran Integrasi",
                weight: 100,
                progress: 0,
                activities: [],
              },
            ],
          },
        }),
      });
    });

    await page.route("**/api/finance/budgets", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "budget-1",
              amount: 50000000,
              account: { code: "5-1-01", name: "Beban Pelatihan" },
            },
          ],
        }),
      });
    });

    await page.route("**/api/users", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [{ id: "user-1", name: "Budi PIC" }],
        }),
      });
    });

    // 2. Navigate to Plan Detail
    await page.goto("/perencanaan/plan-1");
    await page.waitForLoadState("networkidle");

    // 3. Switch to Activities tab
    await page.getByRole("tab", { name: /Program & Kegiatan/i }).click();
    await expect(page.getByText("Daftar Program & Kegiatan")).toBeVisible();

    // 4. Open Create Activity Dialog
    // Ensure the objective is visible
    await expect(page.getByText("Sasaran Integrasi")).toBeVisible();

    // Click the button inside the target objective section
    const addButton = page.locator('div').filter({ hasText: /^Sasaran Integrasi$/ }).locator('..').getByRole("button", { name: /\+ Tambah Kegiatan/i });

    // If that selector is too complex, fall back to simple first button
    const finalAddBtn = await addButton.isVisible() ? addButton : page.getByRole("button", { name: /\+ Tambah Kegiatan/i }).first();

    await finalAddBtn.click();

    // The dialog should appear (using text-based selector if role=dialog is being tricky)
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Tambah Kegiatan")).toBeVisible();

    // 5. Fill Form including Budget selection
    await page.getByLabel(/Nama Kegiatan/i).fill("Kegiatan Terintegrasi");

    // Select priority
    await page.getByLabel(/Prioritas/i).click();
    await page.getByRole("option", { name: /Tinggi/i }).click();

    // Select PIC
    await page.getByLabel(/Penanggung Jawab/i).click();
    await page.getByRole("option", { name: /Budi PIC/i }).click();

    // Select Budget
    await page.getByLabel(/Link ke Anggaran Keuangan/i).click();
    await page.getByRole("option", { name: /5-1-01/i }).click();

    // Mock successful creation
    await page.route("**/api/perencanaan/activities", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    // 6. Submit
    await page.click('button[type="submit"]:has-text("Simpan")');

    // 7. Verify success toast or dialog closure
    await expect(page.locator('text="Kegiatan berhasil dibuat"')).toBeVisible();
  });
});
