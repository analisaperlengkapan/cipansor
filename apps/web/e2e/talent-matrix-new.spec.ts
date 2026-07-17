import { test, expect } from "@playwright/test";
import { apiLogin, apiRequest, loginAs, SEED_USERS } from "./helpers/auth-api";

test.describe("Talent Management Enhancements", () => {
  test("should render the 9-box talent matrix grid", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await page.goto("/talenta/matrix");

    // Wait for the page to load - check for header text (regex because it might be longer)
    await expect(page.getByText(/Talent Matrix/i).first()).toBeVisible();

    // Summary card fed by the real /api/talenta/analytics endpoint
    await expect(page.getByText(/Total Talenta/i).first()).toBeVisible();

    // 9-box cell labels
    await expect(page.getByText("High Potential").first()).toBeVisible();
    await expect(page.getByText("Key Talent").first()).toBeVisible();

    // The seeded HIGH_POTENTIAL profile (Ustadz Ahmad) renders as initials "UA"
    await expect(page.getByText("UA", { exact: true }).first()).toBeVisible();
  });

  test("should show financial realization in litbang project", async ({ page }) => {
    const session = await apiLogin(SEED_USERS.superAdmin);
    await loginAs(page, "superAdmin");

    // Use the real seeded research project
    const projects = await apiRequest<{ data: Array<{ id: string; title: string }> }>(
      session,
      "GET",
      "/litbang/projects",
    );
    const project = projects.data?.[0];
    expect(project, "seed should provide a research project").toBeTruthy();

    await page.goto(`/litbang/${project.id}`);

    await expect(page.getByText(project.title).first()).toBeVisible();
    await expect(page.getByText("Realisasi Anggaran")).toBeVisible();
    // Amounts come from real journal data — assert the Rp/percentage formatting
    await expect(page.getByText(/Rp\s?[\d.,]+/).first()).toBeVisible();
    await expect(page.getByText(/\d+(\.\d+)?%/).first()).toBeVisible();
  });
});
