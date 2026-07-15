import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth-api";

test.describe("Expanded Roles Access Control", () => {
  test("PT Rektor can access management pages", async ({ page }) => {
    await loginAs(page, "rektor");
    await page.goto("/dashboard");

    // Should be able to see Higher Ed specific navigation labels or items
    // based on our navigation config updates
    await expect(page.locator("nav")).toContainText("Users & Staff");
  });

  test("Wakasek can access academic and class management", async ({ page }) => {
    await loginAs(page, "wakasek");
    await page.goto("/dashboard");

    // Should see academic navigation items
    await expect(page.locator("nav")).toContainText("Classes");
    await expect(page.locator("nav")).toContainText("Students");
  });
});
