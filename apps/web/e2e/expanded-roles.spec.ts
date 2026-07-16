import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth-api";

test.describe("Expanded Roles Access Control", () => {
  test("PT Rektor can access management pages", async ({ page }) => {
    await loginAs(page, "rektor");
    await page.goto("/dashboard");

    // Should be able to see Higher Ed specific navigation labels or items
    // rektor uses kepalaSekolahNavigation which contains "Users & Staff" (Indonesian: "Pengguna & Staff" usually, but let's check navigation.ts)
    // Looking at navigation.ts, kepalaSekolahNavigation has title: "Users & Staff"
    await expect(page.locator("nav")).toContainText("Users & Staff");
  });

  test("Wakasek can access academic and class management", async ({ page }) => {
    await loginAs(page, "wakasek");
    await page.goto("/dashboard");

    // Wakasek is a teacher role, uses teacherNavigation
    // teacherNavigation has "Kelas Saya" and "Siswa"
    await expect(page.locator("nav")).toContainText("Kelas Saya");
    await expect(page.locator("nav")).toContainText("Siswa");
  });
});
