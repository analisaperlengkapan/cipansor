import { test, expect } from "@playwright/test";

test("verify daily report photo upload ui", async ({ page }) => {
  // Mock API responses
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: { id: "user1", role: "TEACHER" } }) });
  });

  await page.route("**/api/units", async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [{ id: "unit1", name: "TK Quran" }] }) });
  });

  await page.route("**/api/academic-years", async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [{ id: "ay1", name: "2024/2025" }] }) });
  });

  await page.route("**/api/classes*", async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [{ id: "class1", name: "Kelas A" }] }) });
  });

  await page.route("**/api/classes/*/enrollments", async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [{ student: { id: "student1", name: "Ahmad" } }] }) });
  });

  // Set auth cookie
  await page.context().addCookies([
    { name: "auth-storage", value: JSON.stringify({ state: { accessToken: "mock-token", user: { role: "TEACHER" } } }), domain: "localhost", path: "/" }
  ]);

  // Navigate to create page
  await page.goto("http://localhost:3000/daily-report/create");

  // Fill basic info to enable tabs
  await page.click("text=Pilih Unit");
  await page.click("text=TK Quran");

  await page.click("text=Pilih Tahun");
  await page.click("text=2024/2025");

  await page.click("text=Pilih Kelas");
  await page.click("text=Kelas A");

  await page.click("text=Pilih Siswa");
  await page.click("text=Ahmad");

  // Click on Foto tab
  await page.click("text=Foto");

  // Verify Photo UI elements
  await expect(page.getByText("Dokumentasi Kegiatan")).toBeVisible();
  await expect(page.getByText("Upload foto kegiatan siswa hari ini")).toBeVisible();
  await expect(page.getByText("Tambah Foto")).toBeVisible();

  // Take screenshot
  await page.screenshot({ path: "apps/web/e2e/temp/daily-report-upload.png" });
});
